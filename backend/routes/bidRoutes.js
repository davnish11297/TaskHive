const express = require('express');
const router = express.Router();
const Bid = require('../models/Bid');
const Task = require('../models/Task');
const Notification = require('../models/Notification'); // Make sure this model exists
const { authenticateToken } = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail'); // Ensure this function is implemented

// Place a Bid
router.post('/tasks/:taskId/bid', authenticateToken, async (req, res) => {
    try {
        const { bidAmount, estimatedCompletion, message } = req.body;
        const task = await Task.findById(req.params.taskId);

        if (!task) return res.status(404).json({ error: 'Task not found' });

        if (task.postedBy.toString() === req.user.id) {
            return res.status(403).json({ error: 'Cannot bid on your own task' });
        }

        // Create a new bid
        const bid = new Bid({
            task: req.params.taskId,
            bidder: req.user.id,
            bidAmount,
            estimatedCompletion,
            message
        });

        await bid.save();

        // Notify task owner
        await new Notification({
            user: task.postedBy,
            message: `A new bid of $${bidAmount} was placed on your task: ${task.title}`
        }).save();

        // Send Email
        sendEmail(task.postedBy.email, "New Bid Received", `Someone placed a bid on your task: "${task.title}".`);

        res.status(201).json(bid);
    } catch (error) {
        console.error("Error placing bid:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get All Bids for a Task
router.get('/tasks/:taskId/bids', authenticateToken, async (req, res) => {
    try {
        const bids = await Bid.find({ task: req.params.taskId }).populate('bidder', 'name username email');
        res.json(bids);
    } catch (error) {
        console.error("Error fetching bids:", error);
        res.status(500).json({ error: error.message });
    }
});

// Accept a Bid
router.patch('/tasks/accept/:bidId', authenticateToken, async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.bidId).populate('task');
        if (!bid) return res.status(404).json({ error: 'Bid not found' });

        if (bid.task.postedBy.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Only the task creator can accept a bid' });
        }

        bid.status = 'ACCEPTED';
        await bid.save();

        // Reject other bids
        await Bid.updateMany(
            { task: bid.task._id, _id: { $ne: bid._id } },
            { status: 'REJECTED' }
        );

        // Assign task to the bidder
        bid.task.assignedTo = bid.bidder;
        bid.task.status = 'IN_PROGRESS';
        await bid.task.save();

        res.json({ message: 'Bid accepted successfully', bid });
    } catch (error) {
        console.error("Error accepting bid:", error);
        res.status(500).json({ error: error.message });
    }
});

// Reject a Bid
router.patch('/tasks/reject/:bidId', authenticateToken, async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.bidId).populate('task');
        if (!bid) return res.status(404).json({ error: 'Bid not found' });

        if (bid.task.postedBy.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Only the task creator can reject a bid' });
        }

        bid.status = 'REJECTED';
        await bid.save();

        res.json({ message: 'Bid rejected successfully', bid });
    } catch (error) {
        console.error("Error rejecting bid:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get all bids made by the current user
router.get('/bids/my', authenticateToken, async (req, res) => {
    try {
        const bids = await Bid.find({ bidder: req.user.id })
            .populate('task')
            .sort({ createdAt: -1 });
        res.json(bids);
    } catch (error) {
        console.error('Error fetching user bids:', error);
        res.status(500).json({ error: 'Failed to fetch user bids' });
    }
});

module.exports = router;