const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // optional if OAuth-only
  googleId: { type: String },
  ridesOffered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ride' }],
  ridesBooked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ride' }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
