require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const taskRoutes = require('./routes/taskRoutes');

const { request } = require('express');
const mongoose = require('mongoose');

const allowedOrigins = [
  "http://localhost:3000", 
  "https://taskhive-frontend-6uz2diami-davnish11297s-projects.vercel.app"
];

// Middleware to parse JSON
app.use(express.json());

const cors = require('cors');
app.use(cors({
  origin: allowedOrigins, 
  methods: "GET,POST,PUT,DELETE,PATCH",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true
}));

// API routes
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api', taskRoutes);

// Serve static files (React app) after API routes
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, 'frontend', 'build')));

//   // If any route does not match API, serve React app
//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
//   });
// } else {
//   // In development, serve React app directly from the frontend folder
//   app.use(express.static(path.join(__dirname, 'frontend', 'public')));
// }

mongoose.connect('mongodb+srv://sdavnish:davnish7@cluster0.dfy8i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    serverSelectionTimeoutMS: 30000,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const User = require('./models/User')

const bidRoutes = require('./routes/bidRoutes');
app.use('/api', bidRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});