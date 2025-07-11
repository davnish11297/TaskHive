const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { authenticateToken } = require("../middleware/authMiddleware");

// Get notifications for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
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

// Mark a notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark as read' });
  }
});

module.exports = router;