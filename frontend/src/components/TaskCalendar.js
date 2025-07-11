import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './TaskCalendar.css';

const locales = {
  'en-US': require('date-fns/locale/en-US')
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const TaskCalendar = () => {
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [view, setView] = useState('month');

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    allDay: false,
    type: 'custom',
    color: '#3B82F6',
    location: '',
    meetingType: 'video_call',
    meetingLink: '',
    meetingNotes: '',
    recurrence: 'none',
    isPublic: false,
    attendees: []
  });

  const token = localStorage.getItem('token');

  // Fetch calendar events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/calendar`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      const formattedEvents = data.map(event => ({
        id: event._id,
        title: event.title,
        start: new Date(event.startDate),
        end: new Date(event.endDate),
        allDay: event.allDay,
        resource: event,
        className: `calendar-event-${event.type}`,
        style: {
          backgroundColor: event.color,
          borderColor: event.color
        }
      }));

      setEvents(formattedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle event selection
  const handleEventSelect = (event) => {
    setSelectedEvent(event.resource);
    setShowEventModal(true);
  };

  // Handle slot selection (create new event)
  const handleSlotSelect = ({ start, end }) => {
    setEventForm(prev => ({
      ...prev,
      startDate: start,
      endDate: end
    }));
    setShowCreateModal(true);
  };

  // Create new event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/calendar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventForm)
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      await fetchEvents();
      setShowCreateModal(false);
      setEventForm({
        title: '',
        description: '',
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 60 * 1000),
        allDay: false,
        type: 'custom',
        color: '#3B82F6',
        location: '',
        meetingType: 'video_call',
        meetingLink: '',
        meetingNotes: '',
        recurrence: 'none',
        isPublic: false,
        attendees: []
      });
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.message);
    }
  };

  // Update event
  const handleUpdateEvent = async (updatedEvent) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/calendar/${updatedEvent._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedEvent)
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      await fetchEvents();
      setShowEventModal(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error('Error updating event:', err);
      setError(err.message);
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/calendar/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      await fetchEvents();
      setShowEventModal(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err.message);
    }
  };

  // Filter events by type
  const filteredEvents = events.filter(event => {
    if (filterType === 'all') return true;
    return event.resource.type === filterType;
  });

  // Event styling
  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: event.resource.color,
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0',
      display: 'block',
      padding: '2px 5px'
    };
    return { style };
  };

  if (loading) {
    return (
      <div className="calendar-loading">
        <div className="loading-spinner"></div>
        <p>Loading calendar events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-error">
        <p>Error: {error}</p>
        <button onClick={fetchEvents} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="task-calendar">
      <div className="calendar-header">
        <h2>Task Calendar</h2>
        <div className="calendar-controls">
          <div className="filter-controls">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Events</option>
              <option value="task_deadline">Task Deadlines</option>
              <option value="milestone">Milestones</option>
              <option value="meeting">Meetings</option>
              <option value="custom">Custom Events</option>
            </select>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="create-event-btn"
          >
            + New Event
          </button>
        </div>
      </div>

      <div className="calendar-container">
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          onSelectEvent={handleEventSelect}
          onSelectSlot={handleSlotSelect}
          selectable
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="month"
          view={view}
          onView={setView}
          step={60}
          timeslots={1}
          tooltipAccessor={(event) => event.title}
        />
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          eventForm={eventForm}
          setEventForm={setEventForm}
          onSubmit={handleCreateEvent}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

// Event Details Modal Component
const EventDetailsModal = ({ event, onClose, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: event.title,
    description: event.description,
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
    allDay: event.allDay,
    type: event.type,
    color: event.color,
    location: event.location,
    meetingType: event.meetingType,
    meetingLink: event.meetingLink,
    meetingNotes: event.meetingNotes,
    isPublic: event.isPublic
  });

  const handleSave = () => {
    onUpdate({ ...event, ...editForm });
    setIsEditing(false);
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

  const getMeetingTypeIcon = (type) => {
    const icons = {
      video_call: '📹',
      audio_call: '📞',
      in_person: '👥',
      chat: '💬'
    };
    return icons[type] || '📹';
  };

  return (
    <div className="modal-overlay">
      <div className="event-modal">
        <div className="modal-header">
          <h3>{getEventTypeIcon(event.type)} {event.title}</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="modal-content">
          {!isEditing ? (
            <div className="event-details">
              <div className="event-info">
                <p><strong>Description:</strong> {event.description || 'No description'}</p>
                <p><strong>Date:</strong> {new Date(event.startDate).toLocaleString()}</p>
                <p><strong>Duration:</strong> {event.allDay ? 'All day' : `${Math.round((new Date(event.endDate) - new Date(event.startDate)) / (1000 * 60 * 60))} hours`}</p>
                <p><strong>Type:</strong> {event.type.replace('_', ' ').toUpperCase()}</p>
                {event.location && <p><strong>Location:</strong> {event.location}</p>}
                
                {event.type === 'meeting' && (
                  <div className="meeting-details">
                    <p><strong>Meeting Type:</strong> {getMeetingTypeIcon(event.meetingType)} {event.meetingType.replace('_', ' ').toUpperCase()}</p>
                    {event.meetingLink && <p><strong>Link:</strong> <a href={event.meetingLink} target="_blank" rel="noopener noreferrer">{event.meetingLink}</a></p>}
                    {event.meetingNotes && <p><strong>Notes:</strong> {event.meetingNotes}</p>}
                  </div>
                )}

                {event.attendees && event.attendees.length > 0 && (
                  <div className="attendees">
                    <p><strong>Attendees:</strong></p>
                    <ul>
                      {event.attendees.map((attendee, index) => (
                        <li key={index}>
                          {attendee.name || attendee.email} - {attendee.response}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {event.taskId && (
                  <div className="task-link">
                    <p><strong>Related Task:</strong> {event.taskId.title}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="edit-form">
              <input
                type="text"
                placeholder="Event title"
                value={editForm.title}
                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                className="form-input"
              />
              <textarea
                placeholder="Description"
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                className="form-textarea"
              />
              <div className="form-row">
                <input
                  type="datetime-local"
                  value={editForm.startDate.toISOString().slice(0, 16)}
                  onChange={(e) => setEditForm({...editForm, startDate: new Date(e.target.value)})}
                  className="form-input"
                />
                <input
                  type="datetime-local"
                  value={editForm.endDate.toISOString().slice(0, 16)}
                  onChange={(e) => setEditForm({...editForm, endDate: new Date(e.target.value)})}
                  className="form-input"
                />
              </div>
              <input
                type="text"
                placeholder="Location (optional)"
                value={editForm.location}
                onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                className="form-input"
              />
              <input
                type="color"
                value={editForm.color}
                onChange={(e) => setEditForm({...editForm, color: e.target.value})}
                className="color-input"
              />
            </div>
          )}
        </div>

        <div className="modal-actions">
          {!isEditing ? (
            <>
              <button onClick={() => setIsEditing(true)} className="edit-btn">Edit</button>
              <button onClick={() => onDelete(event._id)} className="delete-btn">Delete</button>
              <button onClick={onClose} className="cancel-btn">Close</button>
            </>
          ) : (
            <>
              <button onClick={handleSave} className="save-btn">Save</button>
              <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Create Event Modal Component
const CreateEventModal = ({ eventForm, setEventForm, onSubmit, onClose }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="modal-overlay">
      <div className="event-modal">
        <div className="modal-header">
          <h3>Create New Event</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="create-event-form">
          <div className="form-group">
            <label>Event Type</label>
            <select
              value={eventForm.type}
              onChange={(e) => setEventForm({...eventForm, type: e.target.value})}
              className="form-select"
            >
              <option value="custom">Custom Event</option>
              <option value="meeting">Meeting</option>
              <option value="task_deadline">Task Deadline</option>
              <option value="milestone">Milestone</option>
            </select>
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={eventForm.title}
              onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
              className="form-textarea"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="datetime-local"
                value={eventForm.startDate.toISOString().slice(0, 16)}
                onChange={(e) => setEventForm({...eventForm, startDate: new Date(e.target.value)})}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input
                type="datetime-local"
                value={eventForm.endDate.toISOString().slice(0, 16)}
                onChange={(e) => setEventForm({...eventForm, endDate: new Date(e.target.value)})}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={eventForm.allDay}
                onChange={(e) => setEventForm({...eventForm, allDay: e.target.checked})}
              />
              All Day Event
            </label>
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={eventForm.location}
              onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
              className="form-input"
            />
          </div>

          {eventForm.type === 'meeting' && (
            <>
              <div className="form-group">
                <label>Meeting Type</label>
                <select
                  value={eventForm.meetingType}
                  onChange={(e) => setEventForm({...eventForm, meetingType: e.target.value})}
                  className="form-select"
                >
                  <option value="video_call">Video Call</option>
                  <option value="audio_call">Audio Call</option>
                  <option value="in_person">In Person</option>
                  <option value="chat">Chat</option>
                </select>
              </div>

              <div className="form-group">
                <label>Meeting Link</label>
                <input
                  type="url"
                  value={eventForm.meetingLink}
                  onChange={(e) => setEventForm({...eventForm, meetingLink: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Meeting Notes</label>
                <textarea
                  value={eventForm.meetingNotes}
                  onChange={(e) => setEventForm({...eventForm, meetingNotes: e.target.value})}
                  className="form-textarea"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Color</label>
            <input
              type="color"
              value={eventForm.color}
              onChange={(e) => setEventForm({...eventForm, color: e.target.value})}
              className="color-input"
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={eventForm.isPublic}
                onChange={(e) => setEventForm({...eventForm, isPublic: e.target.checked})}
              />
              Public Event
            </label>
          </div>

          <div className="modal-actions">
            <button type="submit" className="create-btn">Create Event</button>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskCalendar; 