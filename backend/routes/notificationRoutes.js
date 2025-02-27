const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { authenticateToken } = require("../middleware/authMiddleware");

// Get notifications for the logged-in user
router.get('/notifications', authenticateToken, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(400).json({ error: "User ID not found in request" });
        }

        const notifications = await Notification.find({ user: req.user.id, isRead: false });
        res.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: error.message });
    }
});

// Mark notification as read
router.put("/notifications/:id/read", async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ message: "Notification marked as read" });
    } catch (error) {
        console.error("Error updating notification:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;