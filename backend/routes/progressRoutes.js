const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const Task = require('../models/Task');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get progress for a task
router.get('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    let progress = await Progress.findOne({ taskId })
      .populate('milestones.completedBy', 'name profilePicture')
      .populate('createdBy', 'name profilePicture');

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found for this task' });
    }

    res.json(progress);
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update progress for a task
router.post('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { milestones } = req.body;
    const userId = req.user.id;

    // Check if user has permission to manage this task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.postedBy.toString() !== userId && task.assignedTo?.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to manage this task' });
    }

    let progress = await Progress.findOne({ taskId });

    if (!progress) {
      // Create new progress
      progress = new Progress({
        taskId,
        milestones: milestones.map((milestone, index) => ({
          ...milestone,
          order: index + 1
        })),
        createdBy: userId
      });
    } else {
      // Update existing progress
      progress.milestones = milestones.map((milestone, index) => ({
        ...milestone,
        order: index + 1
      }));
    }

    // Calculate overall progress
    const completedMilestones = progress.milestones.filter(m => m.status === 'completed').length;
    progress.overallProgress = progress.milestones.length > 0 
      ? Math.round((completedMilestones / progress.milestones.length) * 100)
      : 0;

    // Update status based on progress
    if (progress.overallProgress === 0) {
      progress.status = 'not_started';
    } else if (progress.overallProgress === 100) {
      progress.status = 'completed';
    } else {
      progress.status = 'in_progress';
    }

    progress.lastUpdated = new Date();
    await progress.save();

    // Populate the response
    progress = await Progress.findById(progress._id)
      .populate('milestones.completedBy', 'name profilePicture')
      .populate('createdBy', 'name profilePicture');

    res.json(progress);
  } catch (error) {
    console.error('Error creating/updating progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update milestone status
router.put('/task/:taskId/milestone/:milestoneIndex', authenticateToken, async (req, res) => {
  try {
    const { taskId, milestoneIndex } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const progress = await Progress.findOne({ taskId });
    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    const milestone = progress.milestones[milestoneIndex];
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Update milestone
    milestone.status = status;
    if (status === 'completed') {
      milestone.completedAt = new Date();
      milestone.completedBy = userId;
    } else {
      milestone.completedAt = null;
      milestone.completedBy = null;
    }

    // Recalculate overall progress
    const completedMilestones = progress.milestones.filter(m => m.status === 'completed').length;
    progress.overallProgress = progress.milestones.length > 0 
      ? Math.round((completedMilestones / progress.milestones.length) * 100)
      : 0;

    // Update status based on progress
    if (progress.overallProgress === 0) {
      progress.status = 'not_started';
    } else if (progress.overallProgress === 100) {
      progress.status = 'completed';
    } else {
      progress.status = 'in_progress';
    }

    progress.lastUpdated = new Date();
    await progress.save();

    // Populate the response
    const updatedProgress = await Progress.findById(progress._id)
      .populate('milestones.completedBy', 'name profilePicture')
      .populate('createdBy', 'name profilePicture');

    res.json(updatedProgress);
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's progress overview
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const progressList = await Progress.find({
      $or: [
        { createdBy: userId },
        { 'milestones.completedBy': userId }
      ]
    })
    .populate('taskId', 'title status')
    .populate('createdBy', 'name profilePicture')
    .sort({ lastUpdated: -1 });

    res.json(progressList);
  } catch (error) {
    console.error('Error getting user progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 