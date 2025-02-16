const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Task = require('../models/Task');

const router = express.Router();

// Create a new task
router.post('/tasks', async (req, res) => {
    try {
      const { title, description, userId, budget, deadline, category, tags, status } = req.body;

      // Validate the input for status to ensure it's one of the valid options
      const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
        if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }

      const newTask = new Task({ title, description, budget, deadline, status, category, tags, user: userId });
      await newTask.save();
      res.status(201).json(newTask);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

// Get All Tasks
router.get('/tasks', async (req, res) => {
    const { category, tag } = req.query;

    try {
        let filter = {};

        if (category) filter.category = category;
        if (tag) filter.tags = { $in: tag.split(',') }; // Match any of the tags

        const tasks = await Task.find(filter);

        res.status(200).json({ tasks });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});

router.patch('/tasks/:id/status', async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    const allowedStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const task = await Task.findByIdAndUpdate(id, { status }, { new: true });
        if (!task) return res.status(404).json({ error: 'Task not found' });

        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;