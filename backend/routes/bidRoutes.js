const express = require('express');
const router = express.Router();
const Bid = require('../models/Bid');
const Task = require('../models/Task');
const { authenticateToken } = require('../middleware/authMiddleware'); // ✅ Correct

// Place a Bid
router.post('/tasks/:taskId/bid', authenticateToken, async (req, res) => {
    try {
        const { bidAmount, estimatedCompletion, message } = req.body;
        const task = await Task.findById(req.params.taskId);

        console.log(task); // Ensure taskId is correct

        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (task.createdAt.toString() === req.user.id) {
            return res.status(403).json({ error: 'Cannot bid on your own task' });
        }

        const bid = new Bid({
            task: req.params.taskId,
            bidder: req.user.id,
            bidAmount,
            estimatedCompletion,
            message
        });

        await bid.save();
        res.status(201).json(bid);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// Get All Bids for a Task
router.get('/tasks/:taskId/bids', authenticateToken, async (req, res) => {
    try {
        const bids = await Bid.find({ task: req.params.taskId }).populate('bidder', 'name username email');
        res.json(bids);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/tasks/accept/:bidId', authenticateToken, async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.bidId).populate('task');
        console.log('Bid:', bid);

        if (!bid) {
            console.log('Bid not found');
            return res.status(404).json({ error: 'Bid not found' });
        }

        if (!bid.task) {
            console.log('Task not found in bid:', bid);
            return res.status(400).json({ error: 'Task not found in bid' });
        }

        if (!bid.task.postedBy) {
            console.log('Task creator (user) not found in task:', bid.task);
            return res.status(400).json({ error: 'Task creator not found in task' });
        }

        if (req.user.role !== 'task_poster') {
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
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reject a Bid
router.patch('/tasks/reject/:bidId', authenticateToken, async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.bidId).populate('task');
        if (!bid) return res.status(404).json({ error: 'Bid not found' });

        if (req.user.role !== 'task_poster') {
            return res.status(403).json({ error: 'Only the task creator can accept a bid' });
        }

        bid.status = 'REJECTED';
        await bid.save();

        res.json({ message: 'Bid rejected successfully', bid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;