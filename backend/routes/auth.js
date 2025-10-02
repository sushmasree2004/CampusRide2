const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');

// util: create JWT
function createToken(user) {
  const payload = { id: user._id };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Register (email/password) - optional
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ msg: 'Provide email and password' });
  const domain = email.split('@')[1];
  if (domain !== process.env.ALLOWED_DOMAIN) return res.status(400).json({ msg: 'Use VIT student email' });

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User exists' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    user = await User.create({ name, email, password: hashed });

    const token = createToken(user);
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Login (email/password)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    if (!user.password) return res.status(400).json({ msg: 'Use Google login' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = createToken(user);
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Google OAuth start
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google callback -> issue JWT & redirect
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/auth/google/failure' }),
  (req, res) => {
    // req.user exists (created/loaded in strategy)
    const token = createToken(req.user);
    // redirect to frontend with token (for dev). Frontend should read token from query.
    const redirect = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login-success?token=${token}`;
    res.redirect(redirect);
  }
);

router.get('/google/failure', (req, res) => {
  res.status(401).send('Google authentication failed.');
});

module.exports = router;
