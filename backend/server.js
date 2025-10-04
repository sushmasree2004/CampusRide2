require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// routes
const rideRoutes = require("./routes/rides");
const chatRoutes = require("./routes/chat");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");

const Chat = require("./models/Chat");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// basic middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

// attach io to req so routes can emit
app.use((req, res, next) => {
  req.io = io;
  next();
});

// api routes
app.use("/api/rides", rideRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// simple health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Socket.IO realtime handlers
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // join a ride room to receive messages for that ride only
  socket.on("joinRide", (rideId) => {
    if (!rideId) return;
    socket.join(rideId);
    // optionally emit joined ack
    socket.emit("joinedRide", { rideId });
  });

  // leave ride room
  socket.on("leaveRide", (rideId) => {
    if (!rideId) return;
    socket.leave(rideId);
  });

  // send message: save to DB and broadcast to the room
  socket.on("sendMessage", async ({ rideId, senderId, text, senderName }) => {
    try {
      if (!rideId || !senderId || !text) return;
      const newMsg = new Chat({
        rideId,
        senderId,
        senderName: senderName || "Unknown",
        message: text,
      });
      await newMsg.save();

      // emit to everyone in that ride room (including sender)
      io.to(rideId).emit("receiveMessage", newMsg);
    } catch (err) {
      console.error("Socket sendMessage error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO = process.env.MONGO_URI;

mongoose
  .connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
