const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  allDay: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['task_deadline', 'milestone', 'meeting', 'custom'],
    required: true
  },
  color: {
    type: String,
    default: '#3B82F6' // Default blue color
  },
  location: {
    type: String,
    trim: true
  },
  attendees: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: String,
    name: String,
    response: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'tentative'],
      default: 'pending'
    }
  }],
  // Reference to related task or milestone
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  milestoneId: {
    type: mongoose.Schema.Types.ObjectId
  },
  // Meeting specific fields
  meetingType: {
    type: String,
    enum: ['video_call', 'audio_call', 'in_person', 'chat'],
    default: 'video_call'
  },
  meetingLink: {
    type: String,
    trim: true
  },
  meetingNotes: {
    type: String,
    trim: true
  },
  // Event recurrence
  recurrence: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
    default: 'none'
  },
  recurrenceEndDate: {
    type: Date
  },
  // Event status
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  // Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'push', 'sms'],
      default: 'email'
    },
    time: {
      type: Number, // minutes before event
      default: 15
    },
    sent: {
      type: Boolean,
      default: false
    }
  }],
  // Permissions
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit', 'admin'],
      default: 'view'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
calendarEventSchema.index({ startDate: 1, endDate: 1 });
calendarEventSchema.index({ type: 1 });
calendarEventSchema.index({ createdBy: 1 });
calendarEventSchema.index({ taskId: 1 });
calendarEventSchema.index({ 'attendees.userId': 1 });

// Pre-save middleware to update updatedAt
calendarEventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if user has permission
calendarEventSchema.methods.hasPermission = function(userId, permission = 'view') {
  if (this.createdBy.toString() === userId.toString()) {
    return true;
  }
  
  if (this.isPublic && permission === 'view') {
    return true;
  }
  
  const sharedUser = this.sharedWith.find(share => 
    share.userId.toString() === userId.toString()
  );
  
  if (!sharedUser) return false;
  
  const permissions = ['view', 'edit', 'admin'];
  const userPermissionIndex = permissions.indexOf(sharedUser.permission);
  const requiredPermissionIndex = permissions.indexOf(permission);
  
  return userPermissionIndex >= requiredPermissionIndex;
};

// Method to get event color based on type
calendarEventSchema.methods.getEventColor = function() {
  const colorMap = {
    task_deadline: '#EF4444', // Red
    milestone: '#10B981',     // Green
    meeting: '#3B82F6',       // Blue
    custom: '#8B5CF6'         // Purple
  };
  
  return this.color || colorMap[this.type] || '#6B7280';
};

module.exports = mongoose.model('CalendarEvent', calendarEventSchema); 