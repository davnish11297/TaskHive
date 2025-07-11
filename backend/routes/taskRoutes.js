const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const sendEmail = require("../utils/sendEmail");
const Task = require('../models/Task'); 
const User = require('../models/User');
const Notification = require('../models/Notification');

const router = express.Router();
const moment = require("moment");

// Create a new task
router.post('/', require('../middleware/authMiddleware').authenticateToken, async (req, res) => {
    try {
      // Role check: Only task posters can create tasks
      if (!req.user || req.user.role !== 'task_poster') {
        return res.status(403).json({ error: 'Only task posters can create tasks.' });
      }
      const { title, description, userId, budget, deadline, category, tags, status } = req.body;

      // Validate the input for status to ensure it's one of the valid options
      const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
        if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }

      const newTask = new Task({ title, description, budget, deadline, status, category, tags, postedBy: userId });
      await newTask.save();

      // Notify all freelancers
      const freelancers = await User.find({ role: 'freelancer' });
      const notifications = freelancers.map(freelancer => ({
        user: freelancer._id,
        message: `New task posted: ${newTask.title}`,
      }));
      await Notification.insertMany(notifications);

      // Emit notifications via WebSocket
      freelancers.forEach((freelancer) => {
        req.io.to(freelancer._id.toString()).emit("notification", {
          message: `New task posted: ${newTask.title}`,
          createdAt: new Date(),
        });
      });

      // Send email to freelancers
      freelancers.forEach((freelancer) => {
        sendEmail(freelancer.email, "New Task Available!", `A new task "${newTask.title}" has been posted.`);
      });

      res.status(201).json(newTask);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get All Tasks
router.get('/', async (req, res) => {
    const { category, tag } = req.query;

    try {
        let filter = {};

        if (category) filter.category = category;
        if (tag) filter.tags = { $in: tag.split(',') }; // Match any of the tags

        const tasks = await Task.find(filter).populate('postedBy', 'name profilePicture');

        res.status(200).json({ tasks });
    } catch (error) {
        console.error("Error fetching tasks:", error); // Log the full error
        res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }
});

router.patch('/:id/status', async (req, res) => {
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

// Delete a task
router.delete("/:id", require('../middleware/authMiddleware').authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;

        // Find the task and ensure it belongs to the logged-in user
        const task = await Task.findOne({ _id: taskId, postedBy: userId });

        if (!task) {
            return res.status(404).json({ message: "Task not found or you don't have permission to delete this task" });
        }

        // Delete the task
        await Task.deleteOne({ _id: taskId });

        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Update a task
router.put("/:taskId", require('../middleware/authMiddleware').authenticateToken, async (req, res) => {
    try {
        const { title, description, deadline, budget, category, tags } = req.body;
        const taskId = req.params.taskId;
        const userId = req.user.id;

        // Find the task and ensure it belongs to the logged-in user
        const task = await Task.findOne({ _id: taskId, postedBy: userId });

        if (!task) {
            return res.status(404).json({ message: "Task not found or you don't have permission to edit this task" });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { title, description, deadline, budget, category, tags },
            { new: true }
        );

        res.json(updatedTask);
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get task recommendations for freelancers based on their skills
router.get("/recommendations/tasks", require('../middleware/authMiddleware').authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user's skills and preferences
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get user's skills (convert to lowercase for better matching)
        const userSkills = (user.skills || []).map(skill => skill.toLowerCase());
        
        // Build query for task recommendations
        let query = {
            status: 'PENDING',
            postedBy: { $ne: userId } // Exclude tasks posted by the user
        };

        // If user has skills, prioritize tasks that match their skills
        if (userSkills.length > 0) {
            query.$or = [
                { category: { $in: userSkills } },
                { tags: { $in: userSkills } },
                { title: { $regex: userSkills.join('|'), $options: 'i' } },
                { description: { $regex: userSkills.join('|'), $options: 'i' } }
            ];
        }

        // Get recommended tasks
        const recommendedTasks = await Task.find(query)
            .populate('postedBy', 'name profilePicture isVerified')
            .sort({ createdAt: -1 })
            .limit(10);

        // If not enough skill-based recommendations, get recent tasks
        if (recommendedTasks.length < 5) {
            const recentTasks = await Task.find({
                status: 'PENDING',
                postedBy: { $ne: userId },
                _id: { $nin: recommendedTasks.map(task => task._id) }
            })
            .populate('postedBy', 'name profilePicture isVerified')
            .sort({ createdAt: -1 })
            .limit(10 - recommendedTasks.length);

            recommendedTasks.push(...recentTasks);
        }

        res.json({
            recommendations: recommendedTasks,
            userSkills: userSkills,
            totalFound: recommendedTasks.length
        });

    } catch (error) {
        console.error("Error getting task recommendations:", error);
        res.status(500).json({ message: "Error getting recommendations", error: error.message });
    }
});

// Get priority-based task suggestions for freelancers
router.get("/recommendations/priority", require('../middleware/authMiddleware').authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10, difficulty, priority, category } = req.query;
        
        // Get user's skills and preferences
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userSkills = (user.skills || []).map(skill => skill.toLowerCase());
        
        // Build query for priority-based recommendations
        let query = {
            status: 'PENDING',
            postedBy: { $ne: userId }
        };

        // Filter by difficulty level if specified
        if (difficulty) {
            query['difficulty.level'] = difficulty.toUpperCase();
        }

        // Filter by priority level if specified
        if (priority) {
            query['priority.level'] = priority.toUpperCase();
        }

        // Filter by category if specified
        if (category) {
            query.category = category;
        }

        // Get tasks with priority scoring
        let recommendedTasks = await Task.find(query)
            .populate('postedBy', 'name profilePicture isVerified')
            .sort({ 'priority.score': -1, createdAt: -1 })
            .limit(parseInt(limit));

        // Calculate relevance score for each task
        recommendedTasks = recommendedTasks.map(task => {
            let relevanceScore = task.priority.score;
            
            // Boost score for tasks matching user skills
            if (userSkills.length > 0) {
                const skillMatch = userSkills.filter(skill => 
                    task.title.toLowerCase().includes(skill) ||
                    task.description.toLowerCase().includes(skill) ||
                    task.tags.some(tag => tag.toLowerCase().includes(skill))
                ).length;
                relevanceScore += skillMatch * 2;
            }

            // Boost score for tasks with higher budget
            if (task.budget > 500) relevanceScore += 1;
            if (task.budget > 1000) relevanceScore += 2;

            // Boost score for urgent deadlines
            const daysUntilDeadline = Math.ceil((task.deadline - new Date()) / (1000 * 60 * 60 * 24));
            if (daysUntilDeadline <= 3) relevanceScore += 3;
            else if (daysUntilDeadline <= 7) relevanceScore += 1;

            return {
                ...task.toObject(),
                relevanceScore: Math.min(10, relevanceScore)
            };
        });

        // Sort by relevance score
        recommendedTasks.sort((a, b) => b.relevanceScore - a.relevanceScore);

        res.json({
            recommendations: recommendedTasks,
            userSkills: userSkills,
            totalFound: recommendedTasks.length,
            filters: { difficulty, priority, category }
        });

    } catch (error) {
        console.error("Error getting priority-based recommendations:", error);
        res.status(500).json({ message: "Error getting recommendations", error: error.message });
    }
});

// Get task analytics and insights
router.get("/analytics", require('../middleware/authMiddleware').authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { timeframe = '30' } = req.query; // days

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeframe));

        // Get user's tasks
        const userTasks = await Task.find({
            $or: [
                { postedBy: userId },
                { assignedTo: userId }
            ],
            createdAt: { $gte: startDate }
        });

        // Calculate analytics
        const analytics = {
            totalTasks: userTasks.length,
            postedTasks: userTasks.filter(task => task.postedBy.toString() === userId).length,
            assignedTasks: userTasks.filter(task => task.assignedTo && task.assignedTo.toString() === userId).length,
            
            // Difficulty distribution
            difficultyDistribution: {
                BEGINNER: 0,
                INTERMEDIATE: 0,
                ADVANCED: 0,
                EXPERT: 0
            },
            
            // Priority distribution
            priorityDistribution: {
                LOW: 0,
                MEDIUM: 0,
                HIGH: 0,
                URGENT: 0
            },
            
            // Category distribution
            categoryDistribution: {},
            
            // Time estimation accuracy
            averageEstimatedHours: 0,
            averageActualHours: 0,
            
            // Budget analysis
            totalBudget: 0,
            averageBudget: 0,
            
            // Status distribution
            statusDistribution: {
                PENDING: 0,
                IN_PROGRESS: 0,
                COMPLETED: 0,
                CANCELLED: 0
            }
        };

        let totalEstimatedHours = 0;
        let totalActualHours = 0;

        userTasks.forEach(task => {
            // Count by difficulty
            if (task.difficulty && task.difficulty.level) {
                analytics.difficultyDistribution[task.difficulty.level]++;
            }

            // Count by priority
            if (task.priority && task.priority.level) {
                analytics.priorityDistribution[task.priority.level]++;
            }

            // Count by category
            if (task.category) {
                analytics.categoryDistribution[task.category] = 
                    (analytics.categoryDistribution[task.category] || 0) + 1;
            }

            // Count by status
            analytics.statusDistribution[task.status]++;

            // Budget calculations
            if (task.budget) {
                analytics.totalBudget += task.budget;
            }

            // Time estimation calculations
            if (task.timeEstimation && task.timeEstimation.estimatedHours) {
                totalEstimatedHours += task.timeEstimation.estimatedHours;
            }
        });

        // Calculate averages
        if (userTasks.length > 0) {
            analytics.averageBudget = Math.round(analytics.totalBudget / userTasks.length);
            analytics.averageEstimatedHours = Math.round((totalEstimatedHours / userTasks.length) * 10) / 10;
        }

        // Get market insights
        const marketInsights = await Task.aggregate([
            { $match: { status: 'PENDING', createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    avgBudget: { $avg: '$budget' },
                    avgDifficulty: { $avg: '$difficulty.score' },
                    avgPriority: { $avg: '$priority.score' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            analytics,
            marketInsights,
            timeframe: parseInt(timeframe)
        });

    } catch (error) {
        console.error("Error getting task analytics:", error);
        res.status(500).json({ message: "Error getting analytics", error: error.message });
    }
});

// Get task difficulty breakdown
router.get("/:taskId/difficulty", require('../middleware/authMiddleware').authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        console.log(`🔍 Fetching difficulty for task: ${taskId}`);
        
        const task = await Task.findById(taskId);
        if (!task) {
            console.log(`❌ Task not found: ${taskId}`);
            return res.status(404).json({ message: "Task not found" });
        }

        console.log(`✅ Task found: "${task.title}"`);
        console.log(`📊 Task difficulty:`, task.difficulty);
        console.log(`📊 Task timeEstimation:`, task.timeEstimation);

        // Check if analytics fields exist
        if (!task.difficulty || !task.timeEstimation) {
            console.log(`❌ Task missing analytics fields`);
            return res.status(500).json({ message: "Task analytics not available" });
        }

        const difficultyBreakdown = {
            overallScore: task.difficulty.score,
            level: task.difficulty.level,
            factors: task.difficulty.factors,
            timeEstimation: task.timeEstimation,
            complexity: task.complexity,
            autoCategory: task.autoCategory
        };

        console.log(`✅ Sending difficulty breakdown:`, difficultyBreakdown);
        res.json(difficultyBreakdown);

    } catch (error) {
        console.error("Error getting task difficulty:", error);
        res.status(500).json({ message: "Error getting difficulty breakdown", error: error.message });
    }
});

// Get time estimation insights
router.get("/:taskId/time-estimation", require('../middleware/authMiddleware').authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        console.log(`🔍 Fetching time estimation for task: ${taskId}`);
        
        const task = await Task.findById(taskId);
        if (!task) {
            console.log(`❌ Task not found: ${taskId}`);
            return res.status(404).json({ message: "Task not found" });
        }

        console.log(`✅ Task found: "${task.title}"`);
        console.log(`📊 Task timeEstimation:`, task.timeEstimation);

        // Check if analytics fields exist
        if (!task.timeEstimation || !task.difficulty || !task.autoCategory) {
            console.log(`❌ Task missing analytics fields`);
            return res.status(500).json({ message: "Task analytics not available" });
        }

        const timeInsights = {
            estimatedHours: task.timeEstimation.estimatedHours,
            estimatedDays: task.timeEstimation.estimatedDays,
            confidence: task.timeEstimation.confidence,
            breakdown: task.timeEstimation.breakdown,
            factors: {
                difficultyMultiplier: task.difficulty.score / 5,
                descriptionLength: task.description.length,
                scopeKeywords: task.autoCategory.keywords.filter(keyword => 
                    ['large', 'comprehensive', 'complete', 'full', 'extensive'].includes(keyword.toLowerCase())
                ).length
            }
        };

        console.log(`✅ Sending time insights:`, timeInsights);
        res.json(timeInsights);

    } catch (error) {
        console.error("Error getting time estimation:", error);
        res.status(500).json({ message: "Error getting time estimation", error: error.message });
    }
});

// Get priority-based suggestions for task posters
router.get("/recommendations/freelancers/:taskId", require('../middleware/authMiddleware').authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const { limit = 10 } = req.query;
        
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Get freelancers with matching skills
        const taskKeywords = [
            task.category,
            ...task.tags,
            ...task.autoCategory.keywords
        ].map(keyword => keyword.toLowerCase());

        const freelancers = await User.find({ role: 'freelancer' });
        
        // Calculate relevance score for each freelancer
        const scoredFreelancers = freelancers.map(freelancer => {
            let relevanceScore = 0;
            const freelancerSkills = (freelancer.skills || []).map(skill => skill.toLowerCase());
            
            // Skill matching
            const skillMatches = taskKeywords.filter(keyword => 
                freelancerSkills.some(skill => skill.includes(keyword) || keyword.includes(skill))
            ).length;
            relevanceScore += skillMatches * 3;

            // Experience level matching
            if (task.difficulty.level === 'BEGINNER' && freelancer.experience === 'beginner') relevanceScore += 2;
            else if (task.difficulty.level === 'INTERMEDIATE' && freelancer.experience === 'intermediate') relevanceScore += 2;
            else if (task.difficulty.level === 'ADVANCED' && freelancer.experience === 'advanced') relevanceScore += 2;
            else if (task.difficulty.level === 'EXPERT' && freelancer.experience === 'expert') relevanceScore += 2;

            // Verification bonus
            if (freelancer.isVerified) relevanceScore += 2;

            // Rating bonus
            if (freelancer.rating) relevanceScore += freelancer.rating;

            // Budget compatibility
            if (freelancer.hourlyRate && task.budget) {
                const estimatedHours = task.timeEstimation.estimatedHours;
                const estimatedCost = freelancer.hourlyRate * estimatedHours;
                if (estimatedCost <= task.budget * 1.2) relevanceScore += 1;
            }

            return {
                ...freelancer.toObject(),
                relevanceScore: Math.min(10, relevanceScore),
                skillMatches: skillMatches
            };
        });

        // Sort by relevance score and limit results
        const topFreelancers = scoredFreelancers
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, parseInt(limit));

        res.json({
            recommendations: topFreelancers,
            taskInfo: {
                title: task.title,
                category: task.category,
                difficulty: task.difficulty.level,
                budget: task.budget,
                estimatedHours: task.timeEstimation.estimatedHours
            },
            totalFound: topFreelancers.length
        });

    } catch (error) {
        console.error("Error getting freelancer recommendations:", error);
        res.status(500).json({ message: "Error getting recommendations", error: error.message });
    }
});

// Get personalized task feed for freelancers
router.get("/feed", require('../middleware/authMiddleware').authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, category, budget } = req.query;
        
        // Get user's skills and preferences
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Build query for personalized feed
        let query = {
            status: 'PENDING',
            postedBy: { $ne: userId }
        };

        // Filter by category if specified
        if (category) {
            query.category = category;
        }

        // Filter by budget if specified
        if (budget) {
            const budgetRange = budget.split('-');
            if (budgetRange.length === 2) {
                query.budget = {
                    $gte: parseInt(budgetRange[0]),
                    $lte: parseInt(budgetRange[1])
                };
            }
        }

        // Get user's skills for relevance scoring
        const userSkills = (user.skills || []).map(skill => skill.toLowerCase());

        // Determine sort order based on query parameter
        let sortOrder = { createdAt: -1 }; // Default: newest first
        
        if (req.query.sortBy) {
            switch (req.query.sortBy) {
                case 'newest':
                    sortOrder = { createdAt: -1 };
                    break;
                case 'budget_high':
                    sortOrder = { budget: -1 };
                    break;
                case 'budget_low':
                    sortOrder = { budget: 1 };
                    break;
                case 'relevance':
                default:
                    sortOrder = { createdAt: -1 }; // Will be re-sorted after relevance calculation
                    break;
            }
        }

        // Get tasks with pagination
        const tasks = await Task.find(query)
            .populate('postedBy', 'name profilePicture isVerified')
            .sort(sortOrder)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Calculate relevance score for each task
        const tasksWithRelevance = tasks.map(task => {
            let relevanceScore = 0;
            
            // Score based on skill matches
            if (userSkills.length > 0) {
                const taskText = `${task.title} ${task.description} ${task.category} ${(task.tags || []).join(' ')}`.toLowerCase();
                const skillMatches = userSkills.filter(skill => taskText.includes(skill));
                relevanceScore += skillMatches.length * 10;
            }

            // Score based on budget compatibility
            if (user.hourlyRate && task.budget) {
                const estimatedHours = task.budget / user.hourlyRate;
                if (estimatedHours >= 1 && estimatedHours <= 40) {
                    relevanceScore += 5;
                }
            }

            // Score based on verification status of poster
            if (task.postedBy && task.postedBy.isVerified) {
                relevanceScore += 3;
            }

            return {
                ...task.toObject(),
                relevanceScore
            };
        });

        // Sort by relevance score
        tasksWithRelevance.sort((a, b) => b.relevanceScore - a.relevanceScore);

        // Get total count for pagination
        const totalTasks = await Task.countDocuments(query);

        res.json({
            tasks: tasksWithRelevance,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalTasks / limit),
                totalTasks,
                hasNextPage: page * limit < totalTasks,
                hasPrevPage: page > 1
            },
            userSkills: userSkills
        });

    } catch (error) {
        console.error("Error getting task feed:", error);
        res.status(500).json({ message: "Error getting task feed" });
    }
});

module.exports = router;