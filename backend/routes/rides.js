const express = require("express");
const router = express.Router();
const Ride = require("../models/Ride");
const auth = require("../middleware/auth"); // ensures req.user exists

// Create a new ride
router.post("/", auth, async (req, res) => {
  try {
    const { from, to, dateTime, seats, price, description } = req.body;
    const ride = new Ride({
      driver: req.user.id,
      from,
      to,
      dateTime,
      seats,
      price,
      description,
      passengers: [],
    });
    await ride.save();
    // emit new ride created (optional)
    if (req.io) req.io.emit("rideCreated", ride);
    res.json({ success: true, ride });
  } catch (err) {
    console.error("Create ride error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all rides (simple listing; add filters as needed)
router.get("/", async (req, res) => {
  try {
    const rides = await Ride.find().populate("driver", "name email").sort({ dateTime: 1 });
    res.json({ success: true, rides });
  } catch (err) {
    console.error("Get rides error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Book a ride (add current user as passenger)
router.post("/:rideId/book", auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ success: false, message: "Ride not found" });

    // prevent double booking
    if (ride.passengers.some(p => p.toString() === req.user.id)) {
      return res.json({ success: false, message: "Already booked" });
    }

    // optional seat capacity check
    if (ride.seats !== undefined && ride.passengers.length >= ride.seats) {
      return res.json({ success: false, message: "No seats available" });
    }

    ride.passengers.push(req.user.id);
    await ride.save();

    // Emit booking update to all clients
    if (req.io) {
      req.io.emit("notifyBooking", {
        rideId: ride._id.toString(),
        passengers: ride.passengers,
        seatsLeft: ride.seats !== undefined ? ride.seats - ride.passengers.length : null,
      });
    }

    res.json({ success: true, ride });
  } catch (err) {
    console.error("Book ride error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Cancel booking (remove current user from passengers)
router.post("/:rideId/cancel", auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ success: false, message: "Ride not found" });

    const before = ride.passengers.length;
    ride.passengers = ride.passengers.filter(p => p.toString() !== req.user.id);
    const after = ride.passengers.length;

    if (before === after) {
      return res.json({ success: false, message: "You did not have a booking on this ride" });
    }

    await ride.save();

    // Emit cancellation update to all clients
    if (req.io) {
      req.io.emit("notifyCancellation", {
        rideId: ride._id.toString(),
        passengers: ride.passengers,
        seatsLeft: ride.seats !== undefined ? ride.seats - ride.passengers.length : null,
      });
    }

    res.json({ success: true, ride });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
