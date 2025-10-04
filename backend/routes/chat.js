const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const auth = require("../middleware/auth");

// GET chat history for a ride
router.get("/:rideId", auth, async (req, res) => {
  try {
    const rideId = req.params.rideId;
    const messages = await Chat.find({ rideId }).sort({ createdAt: 1 }); // oldest -> newest
    res.json({ success: true, messages });
  } catch (err) {
    console.error("Get chat history error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
