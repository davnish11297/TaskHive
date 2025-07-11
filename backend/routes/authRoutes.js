const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    console.log('Register request received');
  
    console.log('Received registration data:', req.body); // Debug log
  
    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email already in use'); // Debug log
      return res.status(400).json({ message: 'Email already in use' });
    }
  
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
  
    try {
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role
      });
      await user.save();
  
      // Generate JWT token
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  
      console.log('User registered successfully:', user); // Debug log
  
      res.json({ token, user });
    } catch (error) {
      console.error('Error registering user:', error); // Debug log
      res.status(500).json({ message: 'Error registering user' });
    }
  });

router.post('/login', async (req, res) => {
    console.log("Login request received:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      console.log("Missing email or password:", { email, password });
      return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
          console.log("User not found for email:", email);
          return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log("User found:", { 
            id: user._id, 
            name: user.name, 
            email: user.email, 
            role: user.role,
            hasPassword: !!user.password 
        });

        if (!user.password) {
            console.log("User password is missing!");
            return res.status(500).json({ message: 'Server error: password missing' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match result:", isMatch);

        if (!isMatch) {
            console.log("Password does not match");
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
        console.log("Login successful for:", user.email);
        res.json({ token, user });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router;