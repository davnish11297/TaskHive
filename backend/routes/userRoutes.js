const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Task = require("../models/Task");  // Assuming you have a Task model
const authMiddleware = require("../middleware/authMiddleware");

// Get logged-in user profile and their tasks
router.get("/profile", async (req, res) => {
    try {
        const { email, postedBy } = req.body;  // Assuming the authMiddleware attaches the user info
        const user = await User.findOne(email).populate("tasks");  // Populate tasks if there's a reference in User model

        console.log(req)

        if (!user) return res.status(404).json({ message: "User not found" });

        // Fetch tasks related to the user, assuming the tasks have a reference to the user
        const tasks = await Task.find({ postedBy: postedBy }).exec();

        // Ensure the response includes the necessary fields
        const userData = {
            _id: user._id,
            name: user.name,  // Make sure name is a field in your User model
            email: user.email,  // Ensure email exists in your User model
            bio: user.bio,  // Include bio if it's a field in your model
            role: user.role,  // Include role if it's a field in your model
            profilePicture: user.profilePicture,  // Profile picture
            isVerified: user.isVerified,  // Verification status
            tasks: tasks,  // Include tasks or handle them if they are populated
        };

        console.log(user)

        // Return the user data along with the tasks
        res.json(userData);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;