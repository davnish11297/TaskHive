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
    //   const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
      const token = jwt.sign({ userId: user._id }, 'yourSuperSecretKey', { expiresIn: '1h' });
  
      console.log('User registered successfully:', user); // Debug log
  
      res.json({ token, user });
    } catch (error) {
      console.error('Error registering user:', error); // Debug log
      res.status(500).json({ message: 'Error registering user' });
    }
  });

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, user });
});

module.exports = router;