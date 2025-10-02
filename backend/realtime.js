let ioInstance = null;

function init(io) {
  ioInstance = io;
}

function emitNewRide(ride) {
  if (!ioInstance) return;
  ioInstance.emit('newRide', ride);
}

function emitRideBooked(payload) {
  if (!ioInstance) return;
  // notify the specific ride room
  const room = `ride_${payload.rideId}`;
  ioInstance.to(room).emit('rideBooked', payload);
}

function emitRideCancelled(payload) {
  if (!ioInstance) return;
  const room = `ride_${payload.rideId}`;
  ioInstance.to(room).emit('rideCancelled', payload);
}

function emitNewMessage(message) {
  if (!ioInstance) return;
  const room = `ride_${message.rideId}`;
  ioInstance.to(room).emit('newMessage', message);
}

function emitRideExpired(rideIds) {
  if (!ioInstance) return;
  // broadcast expired ride IDs
  ioInstance.emit('rideExpired', rideIds);
}

module.exports = {
  init,
  emitNewRide,
  emitRideBooked,
  emitRideCancelled,
  emitNewMessage,
  emitRideExpired
};
