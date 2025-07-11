const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Task = require("../models/Task");  // Assuming you have a Task model
const { authenticateToken } = require("../middleware/authMiddleware");
const multer = require('multer');
const path = require('path');

// Multer config for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `profile_${req.user.id}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Get logged-in user profile and their tasks
router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Fetch tasks related to the user (posted or assigned)
        const tasks = await Task.find({
            $or: [
                { postedBy: user._id },
                { assignedTo: user._id }
            ]
        });

        // Ensure the response includes the necessary fields
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            bio: user.bio,
            role: user.role,
            profilePicture: user.profilePicture,
            isVerified: user.isVerified,
            location: user.location,
            hourlyRate: user.hourlyRate,
            skills: user.skills,
            tasks: tasks,
        };

        res.json(userData);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Public: Get any user's public profile and their posted tasks
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Only include posted tasks
        const tasks = await Task.find({ postedBy: user._id });

        const publicProfile = {
            _id: user._id,
            name: user.name || 'No name provided',
            profilePicture: user.profilePicture || '/default-avatar.png',
            bio: user.bio || 'No bio provided',
            role: user.role || 'freelancer',
            location: user.location || 'Not specified',
            hourlyRate: user.hourlyRate || 0,
            skills: user.skills || [],
            tasks: tasks || [],
        };
        res.json(publicProfile);
    } catch (error) {
        console.error('Error fetching public user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update logged-in user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // decoded.id is always present
    const { name, bio, location, hourlyRate, skills, profilePicture } = req.body;
    const update = { name, bio, location, hourlyRate, skills, profilePicture };
    // Remove undefined fields
    Object.keys(update).forEach(key => update[key] === undefined && delete update[key]);
    const user = await User.findByIdAndUpdate(userId, update, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Upload profile picture
router.post('/profile/upload-picture', authenticateToken, upload.single('profilePicture'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  // Return the relative path to the uploaded file
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ filePath });
});

module.exports = router;