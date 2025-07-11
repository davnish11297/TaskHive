const express = require('express');
const router = express.Router();
const CalendarEvent = require('../models/CalendarEvent');
const Task = require('../models/Task');
const Progress = require('../models/Progress');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get all calendar events for a user (with permissions)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { start, end, type } = req.query;
    const userId = req.user.id;

    let query = {
      $or: [
        { createdBy: userId },
        { isPublic: true },
        { 'attendees.userId': userId },
        { 'sharedWith.userId': userId }
      ]
    };

    // Filter by date range
    if (start && end) {
      query.$and = [
        { startDate: { $lte: new Date(end) } },
        { endDate: { $gte: new Date(start) } }
      ];
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    const events = await CalendarEvent.find(query)
      .populate('createdBy', 'name email')
      .populate('attendees.userId', 'name email')
      .populate('sharedWith.userId', 'name email')
      .populate('taskId', 'title status')
      .sort({ startDate: 1 });

    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ message: 'Error fetching calendar events' });
  }
});

// Get a specific calendar event
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await CalendarEvent.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('attendees.userId', 'name email')
      .populate('sharedWith.userId', 'name email')
      .populate('taskId', 'title status description');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.hasPermission(req.user.id, 'view')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    res.status(500).json({ message: 'Error fetching calendar event' });
  }
});

// Create a new calendar event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      allDay,
      type,
      color,
      location,
      attendees,
      taskId,
      milestoneId,
      meetingType,
      meetingLink,
      meetingNotes,
      recurrence,
      recurrenceEndDate,
      reminders,
      isPublic,
      sharedWith
    } = req.body;

    // Validate required fields
    if (!title || !startDate || !endDate || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate date range
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const event = new CalendarEvent({
      title,
      description,
      startDate,
      endDate,
      allDay: allDay || false,
      type,
      color,
      location,
      attendees: attendees || [],
      taskId,
      milestoneId,
      meetingType,
      meetingLink,
      meetingNotes,
      recurrence: recurrence || 'none',
      recurrenceEndDate,
      reminders: reminders || [{ type: 'email', time: 15, sent: false }],
      isPublic: isPublic || false,
      sharedWith: sharedWith || [],
      createdBy: req.user.id
    });

    await event.save();

    // Populate references
    await event.populate('createdBy', 'name email');
    await event.populate('attendees.userId', 'name email');
    await event.populate('taskId', 'title status');

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ message: 'Error creating calendar event' });
  }
});

// Update a calendar event
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await CalendarEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.hasPermission(req.user.id, 'edit')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedEvent = await CalendarEvent.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email')
      .populate('attendees.userId', 'name email')
      .populate('sharedWith.userId', 'name email')
      .populate('taskId', 'title status');

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ message: 'Error updating calendar event' });
  }
});

// Delete a calendar event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await CalendarEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.hasPermission(req.user.id, 'edit')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await CalendarEvent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ message: 'Error deleting calendar event' });
  }
});

// Respond to meeting invitation
router.post('/:id/respond', authenticateToken, async (req, res) => {
  try {
    const { response } = req.body;
    const userId = req.user.id;

    if (!['accepted', 'declined', 'tentative'].includes(response)) {
      return res.status(400).json({ message: 'Invalid response' });
    }

    const event = await CalendarEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Find attendee and update response
    const attendeeIndex = event.attendees.findIndex(
      attendee => attendee.userId.toString() === userId
    );

    if (attendeeIndex === -1) {
      return res.status(404).json({ message: 'You are not an attendee of this event' });
    }

    event.attendees[attendeeIndex].response = response;
    await event.save();

    await event.populate('createdBy', 'name email');
    await event.populate('attendees.userId', 'name email');

    res.json(event);
  } catch (error) {
    console.error('Error responding to meeting:', error);
    res.status(500).json({ message: 'Error responding to meeting' });
  }
});

// Get task deadlines and milestones for calendar
router.get('/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Get task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to this task
    if (task.postedBy.toString() !== userId && task.assignedTo?.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get task deadline event
    const deadlineEvent = await CalendarEvent.findOne({
      taskId,
      type: 'task_deadline'
    });

    // Get progress milestones
    const progress = await Progress.findOne({ taskId });
    const milestoneEvents = progress ? await CalendarEvent.find({
      taskId,
      type: 'milestone'
    }) : [];

    res.json({
      task,
      deadlineEvent,
      milestoneEvents
    });
  } catch (error) {
    console.error('Error fetching task calendar events:', error);
    res.status(500).json({ message: 'Error fetching task calendar events' });
  }
});

// Auto-create calendar events for task deadlines and milestones
router.post('/auto-create/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Get task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to this task
    if (task.postedBy.toString() !== userId && task.assignedTo?.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const events = [];

    // Create deadline event if it doesn't exist
    const existingDeadlineEvent = await CalendarEvent.findOne({
      taskId,
      type: 'task_deadline'
    });

    if (!existingDeadlineEvent && task.deadline) {
      const deadlineEvent = new CalendarEvent({
        title: `Deadline: ${task.title}`,
        description: `Task deadline for: ${task.title}`,
        startDate: task.deadline,
        endDate: new Date(task.deadline.getTime() + 60 * 60 * 1000), // 1 hour duration
        allDay: false,
        type: 'task_deadline',
        color: '#EF4444',
        taskId,
        createdBy: userId,
        reminders: [{ type: 'email', time: 60, sent: false }] // 1 hour reminder
      });
      await deadlineEvent.save();
      events.push(deadlineEvent);
    }

    // Create milestone events if they don't exist
    const progress = await Progress.findOne({ taskId });
    if (progress && progress.milestones.length > 0) {
      for (const milestone of progress.milestones) {
        if (milestone.dueDate) {
          const existingMilestoneEvent = await CalendarEvent.findOne({
            taskId,
            type: 'milestone',
            'milestoneId': milestone._id
          });

          if (!existingMilestoneEvent) {
            const milestoneEvent = new CalendarEvent({
              title: `Milestone: ${milestone.title}`,
              description: milestone.description || `Milestone for task: ${task.title}`,
              startDate: milestone.dueDate,
              endDate: new Date(milestone.dueDate.getTime() + 30 * 60 * 1000), // 30 min duration
              allDay: false,
              type: 'milestone',
              color: '#10B981',
              taskId,
              milestoneId: milestone._id,
              createdBy: userId,
              reminders: [{ type: 'email', time: 30, sent: false }] // 30 min reminder
            });
            await milestoneEvent.save();
            events.push(milestoneEvent);
          }
        }
      }
    }

    res.json({ message: 'Calendar events created successfully', events });
  } catch (error) {
    console.error('Error auto-creating calendar events:', error);
    res.status(500).json({ message: 'Error auto-creating calendar events' });
  }
});

// Get upcoming events for dashboard
router.get('/upcoming/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const upcomingEvents = await CalendarEvent.find({
      $or: [
        { createdBy: userId },
        { isPublic: true },
        { 'attendees.userId': userId },
        { 'sharedWith.userId': userId }
      ],
      startDate: { $gte: new Date() },
      status: { $ne: 'cancelled' }
    })
      .populate('createdBy', 'name email')
      .populate('taskId', 'title status')
      .sort({ startDate: 1 })
      .limit(parseInt(limit));

    res.json(upcomingEvents);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ message: 'Error fetching upcoming events' });
  }
});

module.exports = router; 