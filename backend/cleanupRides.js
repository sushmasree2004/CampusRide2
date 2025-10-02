require('dotenv').config();
const connectDB = require('./config/db');
const Ride = require('./models/Ride');

const run = async () => {
  await connectDB();
  const now = new Date();
  const res = await Ride.updateMany({ time: { $lt: now }, isActive: true }, { isActive: false });
  console.log('Cleanup complete', res);
  process.exit(0);
};

run();
