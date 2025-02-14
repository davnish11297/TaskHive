const { request } = require('express');
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://sdavnish:davnish7@cluster0.dfy8i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    serverSelectionTimeoutMS: 30000,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const User = require('./models/User')