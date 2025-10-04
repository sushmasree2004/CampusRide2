const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const passport = require("passport");

const router = express.Router();

// ----------------------
// JWT Signup
// ----------------------
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ✅ Restrict to vitstudent.ac.in
    if (!email.endsWith("@vitstudent.ac.in")) {
      return res.json({
        success: false,
        message: "Only @vitstudent.ac.in emails are allowed",
      });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({
      name,
      email,
      password: hashedPassword,
    });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// JWT Login
// ----------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Restrict to vitstudent.ac.in
    if (!email.endsWith("@vitstudent.ac.in")) {
      return res.json({
        success: false,
        message: "Only @vitstudent.ac.in emails are allowed",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// Google OAuth Routes
// ----------------------
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login?error=true&message=Google login failed",
    session: false,
  }),
  (req, res) => {
    // ✅ If email restriction fails in passport.js → user will be redirected with error query
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.redirect(
      `http://localhost:5173/?token=${token}&user=${encodeURIComponent(
        JSON.stringify({ id: req.user._id, name: req.user.name, email: req.user.email })
      )}`
    );
  }
);

// ----------------------
// Get Current User
// ----------------------
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.json({ success: false, message: "No token" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Invalid token" });
  }
});

module.exports = router;
