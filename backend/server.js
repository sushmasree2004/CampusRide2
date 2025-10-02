require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const realtime = require('./realtime');
const Chat = require('./models/Chat');
const Ride = require('./models/Ride');
const nodeCron = require('node-cron');

const server = http.createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } });

connectDB();

// initialize realtime module
realtime.init(io);

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);

  socket.on('joinRoom', (rideId) => {
    const room = `ride_${rideId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined ${room}`);
  });

  socket.on('leaveRoom', (rideId) => {
    const room = `ride_${rideId}`;
    socket.leave(room);
    console.log(`Socket ${socket.id} left ${room}`);
  });

  // chat message (persist + broadcast)
  socket.on('chatMessage', async (payload) => {
    // payload: { rideId, senderId, message }
    try {
      const chat = await Chat.create({
        rideId: payload.rideId,
        senderId: payload.senderId,
        message: payload.message,
        timestamp: payload.timestamp || new Date()
      });
      realtime.emitNewMessage({
        _id: chat._id,
        rideId: chat.rideId.toString(),
        senderId: chat.senderId.toString(),
        message: chat.message,
        timestamp: chat.timestamp
      });
    } catch (err) {
      console.error('chatMessage error', err);
    }
  });

  // optional: clients can emit notifyNewRide, notifyBooking, notifyCancellation
  socket.on('notifyNewRide', (ride) => realtime.emitNewRide(ride));
  socket.on('notifyBooking', (payload) => realtime.emitRideBooked(payload));
  socket.on('notifyCancellation', (payload) => realtime.emitRideCancelled(payload));

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
  });
});

// Cleanup job: every 30 minutes
nodeCron.schedule('*/30 * * * *', async () => {
  try {
    const now = new Date();
    const expiredRides = await Ride.find({ time: { $lt: now }, isActive: true }).select('_id');
    const ids = expiredRides.map(r => r._id.toString());
    if (ids.length > 0) {
      await Ride.updateMany({ _id: { $in: ids } }, { isActive: false });
      console.log(`[cron] Marked ${ids.length} rides inactive`);
      realtime.emitRideExpired(ids);
    } else {
      // no expired rides
    }
  } catch (err) {
    console.error('[cron] cleanup error', err);
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on ${PORT}`));
