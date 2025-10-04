import React, { useEffect, useState, useContext } from "react";
import api from "../src/api"; // adjust path if needed
import socket from "../src/socket"; // your socket client instance
import { AuthContext } from "../src/auth/AuthProvider";

const RideFeed = () => {
  const [rides, setRides] = useState([]);
  const { user } = useContext(AuthContext);

  // fetch rides on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/rides");
        if (mounted && res.data.success) setRides(res.data.rides);
      } catch (err) {
        console.error("Failed to fetch rides", err);
      }
    })();
    return () => (mounted = false);
  }, []);

  // realtime updates: booking, cancellation, new ride
  useEffect(() => {
    const onBooking = (data) => {
      setRides(prev =>
        prev.map(r => (r._id === data.rideId ? { ...r, passengers: data.passengers } : r))
      );
    };

    const onCancellation = (data) => {
      setRides(prev =>
        prev.map(r => (r._id === data.rideId ? { ...r, passengers: data.passengers } : r))
      );
    };

    const onRideCreated = (ride) => {
      setRides(prev => {
        // avoid duplicate insertion
        if (prev.some(r => r._id === ride._id)) return prev;
        return [...prev, ride].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
      });
    };

    socket.on("notifyBooking", onBooking);
    socket.on("notifyCancellation", onCancellation);
    socket.on("rideCreated", onRideCreated);

    return () => {
      socket.off("notifyBooking", onBooking);
      socket.off("notifyCancellation", onCancellation);
      socket.off("rideCreated", onRideCreated);
    };
  }, []);

  // helper for local UI (e.g., book via API)
  const handleBook = async (rideId) => {
    try {
      const res = await api.post(`/rides/${rideId}/book`);
      if (!res.data.success) return alert(res.data.message || "Booking failed");
      // UI will update via socket event emitted by backend
    } catch (err) {
      console.error("Book error:", err);
      alert("Booking failed");
    }
  };

  const handleCancel = async (rideId) => {
    try {
      const res = await api.post(`/rides/${rideId}/cancel`);
      if (!res.data.success) return alert(res.data.message || "Cancel failed");
      // UI will update via socket event emitted by backend
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Cancel failed");
    }
  };

  return (
    <div className="ride-feed">
      <h2>Available Rides</h2>
      {rides.length === 0 && <p>No rides found.</p>}
      <ul>
        {rides.map((ride) => {
          const isBooked = ride.passengers && ride.passengers.some(p => p === (user?.id || user?._id));
          return (
            <li key={ride._id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 8 }}>
              <div>
                <strong>{ride.from} → {ride.to}</strong> <small>on {new Date(ride.dateTime).toLocaleString()}</small>
              </div>
              <div>Driver: {ride.driver?.name || "Unknown"}</div>
              <div>Seats: {ride.seats ?? "—"} | Booked: {ride.passengers?.length ?? 0}</div>
              <div style={{ marginTop: 8 }}>
                {!isBooked ? (
                  <button onClick={() => handleBook(ride._id)}>Book</button>
                ) : (
                  <button onClick={() => handleCancel(ride._id)}>Cancel Booking</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RideFeed;
