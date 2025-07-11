const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Task = require('../models/Task');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authMiddleware');

// Create or update a rating
router.post('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { rating, review, revieweeId } = req.body;
    const reviewerId = req.user.id;

    // Validate task exists and user is involved
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is involved in the task
    const isInvolved = task.postedBy.toString() === reviewerId || 
                      task.assignedTo?.toString() === reviewerId;
    if (!isInvolved) {
      return res.status(403).json({ message: 'Not authorized to rate this task' });
    }

    // Check if task is completed
    if (task.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Can only rate completed tasks' });
    }

    // Determine reviewee (the other person in the task)
    let actualRevieweeId = revieweeId;
    if (!actualRevieweeId) {
      actualRevieweeId = task.postedBy.toString() === reviewerId 
        ? task.assignedTo 
        : task.postedBy;
    }

    if (!actualRevieweeId) {
      return res.status(400).json({ message: 'Invalid reviewee' });
    }

    // Check if user is trying to rate themselves
    if (reviewerId === actualRevieweeId.toString()) {
      return res.status(400).json({ message: 'Cannot rate yourself' });
    }

    // Find existing rating or create new one
    let ratingDoc = await Rating.findOne({ taskId, reviewer: reviewerId });

    if (ratingDoc) {
      // Update existing rating
      ratingDoc.rating = rating;
      ratingDoc.review = review;
      ratingDoc.reviewee = actualRevieweeId;
      ratingDoc.updatedAt = new Date();
    } else {
      // Create new rating
      ratingDoc = new Rating({
        taskId,
        reviewer: reviewerId,
        reviewee: actualRevieweeId,
        rating,
        review
      });
    }

    await ratingDoc.save();

    // Populate the response
    ratingDoc = await Rating.findById(ratingDoc._id)
      .populate('reviewer', 'name profilePicture')
      .populate('reviewee', 'name profilePicture');

    res.json(ratingDoc);
  } catch (error) {
    console.error('Error creating/updating rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get ratings for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const ratings = await Rating.find({ 
      reviewee: userId,
      isPublic: true 
    })
    .populate('reviewer', 'name profilePicture')
    .populate('taskId', 'title')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Rating.countDocuments({ 
      reviewee: userId,
      isPublic: true 
    });

    // Calculate average rating
    const avgRating = await Rating.aggregate([
      { $match: { reviewee: userId, isPublic: true } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    res.json({
      ratings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      averageRating: avgRating.length > 0 ? Math.round(avgRating[0].avgRating * 10) / 10 : 0,
      totalRatings: total
    });
  } catch (error) {
    console.error('Error getting user ratings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get ratings for a task
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    const ratings = await Rating.find({ taskId })
      .populate('reviewer', 'name profilePicture')
      .populate('reviewee', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json(ratings);
  } catch (error) {
    console.error('Error getting task ratings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote on helpful review
router.post('/:ratingId/helpful', authenticateToken, async (req, res) => {
  try {
    const { ratingId } = req.params;
    const userId = req.user.id;

    const rating = await Rating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    // Check if user already voted
    const existingVote = rating.helpfulVotes.find(vote => vote.user.toString() === userId);
    
    if (existingVote) {
      // Remove vote
      rating.helpfulVotes = rating.helpfulVotes.filter(vote => vote.user.toString() !== userId);
    } else {
      // Add vote
      rating.helpfulVotes.push({ user: userId });
    }

    await rating.save();
    res.json({ helpfulVotes: rating.helpfulVotes.length });
  } catch (error) {
    console.error('Error voting on review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's own ratings
router.get('/my-ratings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const ratings = await Rating.find({ reviewer: userId })
      .populate('reviewee', 'name profilePicture')
      .populate('taskId', 'title')
      .sort({ createdAt: -1 });

    res.json(ratings);
  } catch (error) {
    console.error('Error getting user ratings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 