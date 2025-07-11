import React, { useState, useEffect } from 'react';
import TaskCalendar from '../components/TaskCalendar';
import CalendarEventCreator from '../components/CalendarEventCreator';
import './Calendar.css';

const Calendar = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const token = localStorage.getItem('token');

  // Fetch upcoming events
  const fetchUpcomingEvents = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/calendar/upcoming/events?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch upcoming events');
      }

      const data = await response.json();
      setUpcomingEvents(data);
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const formatEventTime = (date) => {
    const eventDate = new Date(date);
    const now = new Date();
    const diffTime = eventDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays > 0) {
      return `In ${diffDays} days`;
    } else {
      return 'Overdue';
    }
  };

  const getEventTypeIcon = (type) => {
    const icons = {
      task_deadline: '⏰',
      milestone: '🎯',
      meeting: '📅',
      custom: '📝'
    };
    return icons[type] || '📝';
  };

  const getEventTypeColor = (type) => {
    const colors = {
      task_deadline: '#EF4444',
      milestone: '#10B981',
      meeting: '#3B82F6',
      custom: '#8B5CF6'
    };
    return colors[type] || '#6B7280';
  };

  const handleRefresh = () => {
    fetchUpcomingEvents();
  };

  const handleEventsCreated = () => {
    fetchUpcomingEvents();
  };

  return (
    <div className="calendar-page">
      <div className="calendar-page-header">
        <div className="header-content">
          <h1>Calendar</h1>
          <p>Manage your tasks, milestones, and meetings in one place</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="quick-actions-btn"
          >
            Quick Actions
          </button>
          <button onClick={handleRefresh} className="refresh-btn">
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="calendar-page-content">
        <div className="calendar-main">
          <CalendarEventCreator onEventsCreated={handleEventsCreated} />
          <TaskCalendar />
        </div>

        <div className="calendar-sidebar">
          <div className="sidebar-section">
            <h3>Upcoming Events</h3>
            {loading ? (
              <div className="loading-events">
                <div className="loading-spinner"></div>
                <p>Loading events...</p>
              </div>
            ) : error ? (
              <div className="error-events">
                <p>Error: {error}</p>
                <button onClick={handleRefresh} className="retry-btn">Retry</button>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="no-events">
                <p>No upcoming events</p>
              </div>
            ) : (
              <div className="upcoming-events-list">
                {upcomingEvents.map((event) => (
                  <div 
                    key={event._id} 
                    className="upcoming-event-item"
                    style={{ borderLeftColor: getEventTypeColor(event.type) }}
                  >
                    <div className="event-icon">
                      {getEventTypeIcon(event.type)}
                    </div>
                    <div className="event-details">
                      <h4>{event.title}</h4>
                      <p className="event-time">
                        {formatEventTime(event.startDate)} • {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {event.location && (
                        <p className="event-location">📍 {event.location}</p>
                      )}
                      {event.type === 'meeting' && event.meetingLink && (
                        <a 
                          href={event.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="meeting-link"
                        >
                          Join Meeting
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <h3>Quick Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">{upcomingEvents.filter(e => e.type === 'task_deadline').length}</div>
                <div className="stat-label">Deadlines</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{upcomingEvents.filter(e => e.type === 'milestone').length}</div>
                <div className="stat-label">Milestones</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{upcomingEvents.filter(e => e.type === 'meeting').length}</div>
                <div className="stat-label">Meetings</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{upcomingEvents.filter(e => e.type === 'custom').length}</div>
                <div className="stat-label">Custom</div>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Calendar Tips</h3>
            <div className="tips-list">
              <div className="tip-item">
                <span className="tip-icon">💡</span>
                <p>Click on any date to create a new event</p>
              </div>
              <div className="tip-item">
                <span className="tip-icon">🎯</span>
                <p>Use different colors to categorize your events</p>
              </div>
              <div className="tip-item">
                <span className="tip-icon">📅</span>
                <p>Switch between month, week, and day views</p>
              </div>
              <div className="tip-item">
                <span className="tip-icon">🔔</span>
                <p>Set reminders for important deadlines</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Modal */}
      {showQuickActions && (
        <div className="quick-actions-modal">
          <div className="quick-actions-content">
            <h3>Quick Actions</h3>
            <div className="quick-actions-grid">
              <button className="quick-action-btn">
                <span className="action-icon">📅</span>
                <span>Schedule Meeting</span>
              </button>
              <button className="quick-action-btn">
                <span className="action-icon">⏰</span>
                <span>Set Reminder</span>
              </button>
              <button className="quick-action-btn">
                <span className="action-icon">📊</span>
                <span>View Analytics</span>
              </button>
              <button className="quick-action-btn">
                <span className="action-icon">📤</span>
                <span>Export Calendar</span>
              </button>
            </div>
            <button 
              onClick={() => setShowQuickActions(false)}
              className="close-quick-actions"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar; 