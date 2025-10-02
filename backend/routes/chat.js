const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');

// Get chat history for a ride
router.get('/:rideId', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ rideId: req.params.rideId }).sort({ timestamp: 1 });
    res.json(chats);
  } catch (err) {
    console.error('Get chat error', err);
    res.status(500).send('Server error');
  }
});

// Optional: post message via REST (most usage should be via socket)
router.post('/:rideId', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const chat = await Chat.create({
      rideId: req.params.rideId,
      senderId: req.user._id,
      message
    });
    res.json(chat);
  } catch (err) {
    console.error('Post chat error', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
