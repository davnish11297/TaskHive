const express = require('express');
const path = require('path');
const app = express();
const taskRoutes = require('./routes/taskRoutes');
const http = require("http");
const { Server } = require("socket.io");
require('dotenv').config();

const mongoose = require('mongoose');

// Create HTTP server
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000", 
  "https://taskhive-frontend-6uz2diami-davnish11297s-projects.vercel.app",
  "https://taskhive-frontend.vercel.app/"
];

const cors = require('cors');

console.log("Current environment:", process.env.NODE_ENV);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
      origin: "*",
      methods: ["GET", "POST"]
  },
});

app.use(cors());
app.use(express.json());

// Serve uploads directory for profile images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Pass `io` to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.set("io", io);

app.get("/", (req, res) => {
  res.send("API is running...");
});

io.on("connection", (socket) => {
  console.log("🟢 A user connected:", socket.id);

  socket.on("disconnect", () => {
      console.log("🔴 A user disconnected");
  });
});

// API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', taskRoutes);

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sdavnish:davnish7@cluster0.dfy8i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    serverSelectionTimeoutMS: 30000,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const User = require('./models/User')

const bidRoutes = require('./routes/bidRoutes');
app.use('/api', bidRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/user', userRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api', notificationRoutes);
app.use('/api/notifications', notificationRoutes);

// Single server instance for both HTTP and WebSocket
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for Vercel
module.exports = app;