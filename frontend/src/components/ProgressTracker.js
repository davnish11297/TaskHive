import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaCircle, FaEdit, FaPlus, FaTimes, FaSpinner } from 'react-icons/fa';
import { API_URL, ENDPOINTS } from '../config/api';
import './ProgressTracker.css';

const ProgressTracker = ({ 
  taskId,
  editable = true,
  showProgress = true 
}) => {
  const [milestones, setMilestones] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', dueDate: '' });
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (taskId) {
      loadProgress();
    }
  }, [taskId]);

  const loadProgress = async () => {
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.PROGRESS_TASK(taskId)}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
        setMilestones(data.milestones || []);
      } else if (response.status === 404) {
        // No progress exists yet, create default milestones
        setMilestones([]);
        setProgress(null);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (updatedMilestones) => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.PROGRESS_TASK(taskId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ milestones: updatedMilestones })
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data);
        setMilestones(data.milestones || []);
      } else {
        throw new Error('Failed to save progress');
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateMilestoneStatus = async (index, status) => {
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.PROGRESS_MILESTONE(taskId, index)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data);
        setMilestones(data.milestones || []);
      }
    } catch (error) {
      console.error('Failed to update milestone:', error);
    }
  };

  const addMilestone = async () => {
    if (!newMilestone.title.trim()) return;
    
    const milestone = {
      ...newMilestone,
      status: 'pending',
      order: milestones.length + 1
    };
    
    const updatedMilestones = [...milestones, milestone];
    await saveProgress(updatedMilestones);
    setNewMilestone({ title: '', description: '', dueDate: '' });
  };

  const toggleMilestone = async (index) => {
    if (!editable) return;
    
    const milestone = milestones[index];
    const newStatus = milestone.status === 'completed' ? 'pending' : 'completed';
    await updateMilestoneStatus(index, newStatus);
  };

  const updateMilestone = (index, field, value) => {
    const updatedMilestones = [...milestones];
    updatedMilestones[index][field] = value;
    setMilestones(updatedMilestones);
  };

  const deleteMilestone = async (index) => {
    const updatedMilestones = milestones.filter((_, i) => i !== index);
    await saveProgress(updatedMilestones);
    setEditingIndex(null);
  };

  const startEditing = (index) => {
    setEditingIndex(index);
  };

  const saveEdit = async () => {
    await saveProgress(milestones);
    setEditingIndex(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && !milestones.find(m => m.dueDate === dueDate)?.status === 'completed';
  };

  const getStatusColor = (milestone) => {
    if (milestone.status === 'completed') return '#10b981';
    if (isOverdue(milestone.dueDate)) return '#ef4444';
    return '#6b7280';
  };

  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const progressPercentage = progress?.overallProgress || (milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0);

  if (loading) {
    return (
      <div className="progress-tracker">
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Loading progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-tracker">
      {showProgress && (
        <div className="progress-header">
          <h3>Project Progress</h3>
          <div className="progress-stats">
            <span className="progress-text">
              {completedCount} of {milestones.length} completed
            </span>
            <span className="progress-percentage">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {progress && (
            <div className="progress-status">
              <span className={`status-badge ${progress.status}`}>
                {progress.status.replace('_', ' ').toUpperCase()}
              </span>
              <span className="last-updated">
                Last updated: {formatDate(progress.lastUpdated)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="milestones-list">
        {milestones.length === 0 ? (
          <div className="no-milestones">
            <p>No milestones yet. Add your first milestone to get started!</p>
          </div>
        ) : (
          milestones.map((milestone, index) => (
            <div 
              key={milestone._id || index} 
              className={`milestone-item ${milestone.status === 'completed' ? 'completed' : ''} ${isOverdue(milestone.dueDate) ? 'overdue' : ''}`}
            >
              <div className="milestone-content">
                <button
                  className="milestone-toggle"
                  onClick={() => toggleMilestone(index)}
                  disabled={!editable || saving}
                >
                  {milestone.status === 'completed' ? (
                    <FaCheckCircle className="milestone-icon completed" />
                  ) : (
                    <FaCircle className="milestone-icon" style={{ color: getStatusColor(milestone) }} />
                  )}
                </button>

                <div className="milestone-details">
                  {editingIndex === index ? (
                    <div className="milestone-edit">
                      <input
                        type="text"
                        value={milestone.title}
                        onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                        className="milestone-edit-input"
                        placeholder="Milestone title"
                      />
                      <textarea
                        value={milestone.description || ''}
                        onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                        className="milestone-edit-textarea"
                        placeholder="Description (optional)"
                      />
                      <input
                        type="date"
                        value={milestone.dueDate || ''}
                        onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
                        className="milestone-edit-date"
                      />
                      <div className="milestone-edit-actions">
                        <button onClick={saveEdit} className="save-btn" disabled={saving}>
                          {saving ? <FaSpinner className="spinner" /> : 'Save'}
                        </button>
                        <button onClick={() => setEditingIndex(null)} className="cancel-btn">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="milestone-header">
                        <h4 className="milestone-title">{milestone.title}</h4>
                        {editable && (
                          <div className="milestone-actions">
                            <button
                              onClick={() => startEditing(index)}
                              className="edit-btn"
                              title="Edit milestone"
                              disabled={saving}
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => deleteMilestone(index)}
                              className="delete-btn"
                              title="Delete milestone"
                              disabled={saving}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {milestone.description && (
                        <p className="milestone-description">{milestone.description}</p>
                      )}
                      
                      <div className="milestone-meta">
                        {milestone.dueDate && (
                          <span className={`milestone-date ${isOverdue(milestone.dueDate) ? 'overdue' : ''}`}>
                            Due: {formatDate(milestone.dueDate)}
                          </span>
                        )}
                        {milestone.completedAt && (
                          <span className="milestone-completed">
                            Completed: {formatDate(milestone.completedAt)}
                          </span>
                        )}
                        {milestone.completedBy && (
                          <span className="milestone-completed-by">
                            by {milestone.completedBy.name}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {editable && (
        <div className="add-milestone">
          <h4>Add New Milestone</h4>
          <div className="add-milestone-form">
            <input
              type="text"
              value={newMilestone.title}
              onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
              placeholder="Milestone title"
              className="milestone-input"
            />
            <textarea
              value={newMilestone.description}
              onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
              placeholder="Description (optional)"
              className="milestone-textarea"
            />
            <input
              type="date"
              value={newMilestone.dueDate}
              onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
              className="milestone-date-input"
            />
            <button 
              onClick={addMilestone} 
              className="add-milestone-btn"
              disabled={!newMilestone.title.trim() || saving}
            >
              {saving ? <FaSpinner className="spinner" /> : <FaPlus />}
              Add Milestone
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker; 