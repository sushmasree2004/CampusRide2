const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Ride = require('../models/Ride');
const User = require('../models/User');
const realtime = require('../realtime');

// Create ride
router.post('/', auth, async (req, res) => {
  try {
    const { source, destination, time, seatsAvailable } = req.body;
    const ride = await Ride.create({
      driver: req.user._id,
      source, destination,
      time,
      seatsAvailable
    });
    await User.findByIdAndUpdate(req.user._id, { $push: { ridesOffered: ride._id } });

    // emit newRide server-side
    realtime.emitNewRide(await ride.populate('driver', 'name email').execPopulate?.() || ride);
    res.json(ride);
  } catch (err) {
    console.error('Create ride error', err);
    res.status(500).send('Server error');
  }
});

// List rides
router.get('/', async (req, res) => {
  try {
    const { source, destination, fromTime, toTime } = req.query;
    const q = { isActive: true, time: { $gte: new Date() } };

    if (source) q.source = new RegExp(source, 'i');
    if (destination) q.destination = new RegExp(destination, 'i');
    if (fromTime || toTime) {
      q.time = {};
      if (fromTime) q.time.$gte = new Date(fromTime);
      if (toTime) q.time.$lte = new Date(toTime);
    }

    const rides = await Ride.find(q).populate('driver', 'name email').sort({ time: 1 }).limit(200);
    res.json(rides);
  } catch (err) {
    console.error('List rides error', err);
    res.status(500).send('Server error');
  }
});

// Get single ride
router.get('/:id', async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate('driver', 'name email');
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });
    res.json(ride);
  } catch (err) {
    console.error('Get ride error', err);
    res.status(500).send('Server error');
  }
});

// Book a seat
router.post('/:id/book', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });
    if (!ride.isActive) return res.status(400).json({ msg: 'Ride not active' });
    if (ride.seatsAvailable <= 0) return res.status(400).json({ msg: 'No seats available' });

    if (ride.passengers.some(p => p.toString() === req.user._id.toString())) {
      return res.status(400).json({ msg: 'Already booked' });
    }

    ride.passengers.push(req.user._id);
    ride.seatsAvailable -= 1;
    await ride.save();

    await User.findByIdAndUpdate(req.user._id, { $push: { ridesBooked: ride._id } });

    // emit rideBooked event
    realtime.emitRideBooked({ rideId: ride._id.toString(), passengerId: req.user._id.toString(), passengerName: req.user.name });

    res.json({ msg: 'Booked', ride });
  } catch (err) {
    console.error('Book ride error', err);
    res.status(500).send('Server error');
  }
});

// Passenger cancels booking (POST /rides/:id/cancel)
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    const passengerId = req.body.passengerId || req.user._id.toString();

    if (!ride.passengers.some(p => p.toString() === passengerId)) {
      return res.status(400).json({ msg: 'Passenger not booked in this ride' });
    }

    ride.passengers = ride.passengers.filter(p => p.toString() !== passengerId);
    ride.seatsAvailable += 1;
    await ride.save();

    await User.findByIdAndUpdate(passengerId, { $pull: { ridesBooked: ride._id } });

    realtime.emitRideCancelled({ rideId: ride._id.toString(), cancelledBy: passengerId, type: 'passenger' });

    res.json({ msg: 'Booking cancelled', ride });
  } catch (err) {
    console.error('Passenger cancel error', err);
    res.status(500).send('Server error');
  }
});

// Driver cancels full ride (DELETE /rides/:id)
router.delete('/:id', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    if (ride.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Only driver can cancel the ride' });
    }

    ride.isActive = false;
    await ride.save();

    // cleanup references
    await User.findByIdAndUpdate(ride.driver, { $pull: { ridesOffered: ride._id } });
    await User.updateMany({ _id: { $in: ride.passengers } }, { $pull: { ridesBooked: ride._id } });

    realtime.emitRideCancelled({ rideId: ride._id.toString(), cancelledBy: req.user._id.toString(), type: 'driver' });

    res.json({ msg: 'Ride cancelled', ride });
  } catch (err) {
    console.error('Driver cancel error', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
