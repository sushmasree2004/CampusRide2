const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get profile with rides
router.get('/:id', async (req, res) => {
  try {
    const u = await User.findById(req.params.id)
      .populate({ path: 'ridesOffered', populate: { path: 'driver', select: 'name' } })
      .populate({ path: 'ridesBooked', populate: { path: 'driver', select: 'name' } });
    if (!u) return res.status(404).json({ msg: 'User not found' });
    res.json(u);
  } catch (err) {
    console.error('Get user error', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
