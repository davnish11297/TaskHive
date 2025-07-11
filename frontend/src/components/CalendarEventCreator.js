import React, { useState } from 'react';
import './CalendarEventCreator.css';

const CalendarEventCreator = ({ onEventsCreated }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');

  const createEventsForTasks = async () => {
    setIsCreating(true);
    setMessage('Creating calendar events for your tasks...');

    try {
      // First, get user's tasks
      const tasksResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!tasksResponse.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const tasks = await tasksResponse.json();
      let createdEvents = 0;

      // Create calendar events for each task
      for (const task of tasks) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/calendar/auto-create/${task._id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const result = await response.json();
            createdEvents += result.events.length;
          }
        } catch (error) {
          console.error(`Error creating events for task ${task._id}:`, error);
        }
      }

      setMessage(`Successfully created ${createdEvents} calendar events!`);
      
      // Callback to refresh calendar
      if (onEventsCreated) {
        onEventsCreated();
      }

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error creating calendar events:', error);
      setMessage('Error creating calendar events. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="calendar-event-creator">
      <div className="creator-content">
        <h3>📅 Auto-Create Calendar Events</h3>
        <p>Automatically create calendar events for your existing tasks and milestones.</p>
        
        <button 
          onClick={createEventsForTasks}
          disabled={isCreating}
          className="create-events-btn"
        >
          {isCreating ? 'Creating Events...' : 'Create Events for Tasks'}
        </button>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarEventCreator; 