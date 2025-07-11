import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Home.css';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '../UserProfileContext';
import { FaEdit, FaTrash, FaLightbulb } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const statusColors = {
  PENDING: '#facc15', // yellow
  IN_PROGRESS: '#38bdf8', // blue
  COMPLETED: '#22c55e', // green
};

const statusLabels = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

function Toast({ message, type, onClose }) {
  // type: 'success' | 'error'
  return (
    <div className={`custom-toast ${type}`} onClick={onClose}>
      {message}
    </div>
  );
}

function StatusModal({ open, currentStatus, onSave, onCancel, updating }) {
  if (!open) return null;

  const statusOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' }
  ];

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 24, color: '#2563eb', fontWeight: 700 }}>Update Task Status</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => onSave(option.value)}
              disabled={updating}
              style={{
                padding: '12px 18px',
                border: '1px solid #e0e7ef',
                borderRadius: 8,
                background: currentStatus === option.value ? '#2563eb' : '#fff',
                color: currentStatus === option.value ? '#fff' : '#333',
                cursor: updating ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {updating ? 'Updating...' : option.label}
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          disabled={updating}
          style={{
            marginTop: 18,
            padding: '8px 16px',
            border: '1px solid #e0e7ef',
            borderRadius: 6,
            background: '#f8fafc',
            cursor: updating ? 'not-allowed' : 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function EditTaskModal({ open, task, onSave, onCancel, updating }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    category: '',
    tags: ''
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        budget: task.budget || '',
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
        category: task.category || '',
        tags: task.tags ? task.tags.join(', ') : ''
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    onSave(payload);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, width: '90vw' }}>
        <h3 style={{ marginBottom: 24, color: '#2563eb', fontWeight: 700 }}>Edit Task</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Task Title"
              required
              className="modern-input"
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Task Description"
              required
              className="modern-input"
              style={{ minHeight: 80, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="number"
                name="budget"
                value={form.budget}
                onChange={handleChange}
                placeholder="Budget (USD)"
                min="0"
                className="modern-input"
                style={{ flex: 1 }}
              />
              <input
                type="date"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                required
                className="modern-input"
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="modern-input"
                style={{ flex: 1 }}
              >
                <option value="">Select Category</option>
                <option value="Web Development">Web Development</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Writing">Writing</option>
                <option value="Marketing">Marketing</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="Tags (comma-separated)"
                className="modern-input"
                style={{ flex: 1 }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              type="submit"
              disabled={updating}
              className="add-task-btn"
              style={{ flex: 1 }}
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={updating}
              style={{
                flex: 1,
                padding: '12px 18px',
                border: '1px solid #e0e7ef',
                borderRadius: 8,
                background: '#f8fafc',
                cursor: updating ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [modalTaskId, setModalTaskId] = useState(null); // taskId or null
  const [modalStatus, setModalStatus] = useState('PENDING');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [editUpdating, setEditUpdating] = useState(false);
  const [deleteConfirming, setDeleteConfirming] = useState(null);
  const navigate = useNavigate();
  const { setUser } = useUserProfile();

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        // Decode token to get user id and role
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decoded = JSON.parse(jsonPayload);
        setUserId(decoded.id || decoded.userId);
        setUserRole(decoded.role);
        // Fetch all tasks
        const res = await axios.get(`${API_URL}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Show tasks posted by or assigned to the user
        const allTasks = res.data.tasks || [];
        const myTasks = allTasks.filter(
          t => (t.postedBy && (t.postedBy._id === (decoded.id || decoded.userId) || t.postedBy === (decoded.id || decoded.userId))) ||
               (t.assignedTo && (t.assignedTo._id === (decoded.id || decoded.userId) || t.assignedTo === (decoded.id || decoded.userId)))
        );
        setTasks(myTasks);
      } catch (err) {
        setError('Failed to fetch tasks.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const openModal = (taskId, currentStatus) => {
    setModalTaskId(taskId);
    setModalStatus(currentStatus);
  };
  const closeModal = () => {
    setModalTaskId(null);
  };

  const openEditModal = (task) => {
    setEditTask(task);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditTask(null);
  };

  const handleDeleteTask = async (taskId) => {
    if (deleteConfirming !== taskId) {
      setDeleteConfirming(taskId);
      setTimeout(() => setDeleteConfirming(null), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Update local tasks state
      setTasks(prev => prev.filter(t => t._id !== taskId));
      
      // Refresh user profile to update task counts
      try {
        const profileRes = await axios.get(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(profileRes.data);
      } catch (profileErr) {
        console.error('Failed to refresh profile:', profileErr);
      }
      
      setToast({ message: 'Task deleted successfully!', type: 'success' });
      setDeleteConfirming(null);
    } catch (err) {
      setToast({ message: 'Failed to delete task.', type: 'error' });
      setDeleteConfirming(null);
    }
    setTimeout(() => setToast(null), 2200);
  };

  const handleEditTask = async (updatedData) => {
    setEditUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/api/tasks/${editTask._id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Update local tasks state
      setTasks(prev => prev.map(t => t._id === editTask._id ? res.data : t));
      
      setToast({ message: 'Task updated successfully!', type: 'success' });
      closeEditModal();
    } catch (err) {
      setToast({ message: 'Failed to update task.', type: 'error' });
    } finally {
      setEditUpdating(false);
      setTimeout(() => setToast(null), 2200);
    }
  };

  const handleSaveStatus = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/api/tasks/${modalTaskId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local tasks state
      setTasks(prev => prev.map(t => t._id === modalTaskId ? { ...t, status: newStatus } : t));
      
      // Refresh user profile to update task counts
      try {
        const profileRes = await axios.get(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(profileRes.data); // Update the user profile context
      } catch (profileErr) {
        console.error('Failed to refresh profile:', profileErr);
      }
      
      setToast({ message: 'Status updated!', type: 'success' });
      closeModal();
    } catch (err) {
      setToast({ message: 'Failed to update status.', type: 'error' });
    } finally {
      setStatusUpdating(false);
      setTimeout(() => setToast(null), 2200);
    }
  };

  return (
    <div className="browse-root">
      <section className="browse-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1>My Tasks</h1>
            <p>View and manage all your tasks.</p>
          </div>
          {userRole === 'task_poster' && (
            <button 
              className="add-task-btn"
              style={{
                padding: '10px 20px',
                fontSize: 15,
                borderRadius: 8,
                background: '#f0f9ff',
                color: '#0369a1',
                border: '1px solid #bae6fd',
                fontWeight: 600,
                transition: 'background 0.2s'
              }}
              onClick={() => navigate('/recommendations')}
            >
              <FaLightbulb style={{ marginRight: 8 }} />
              Get Recommendations
            </button>
          )}
        </div>
      </section>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <StatusModal
        open={!!modalTaskId}
        currentStatus={modalStatus}
        onSave={handleSaveStatus}
        onCancel={closeModal}
        updating={statusUpdating}
      />
      <EditTaskModal
        open={editModalOpen}
        task={editTask}
        onSave={handleEditTask}
        onCancel={closeEditModal}
        updating={editUpdating}
      />
      <section className="browse-tasks-grid">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="dashboard-no-tasks" style={{width: '100%'}}>
            You have not posted or been assigned any tasks yet.
          </div>
        ) : (
          tasks.map((task, idx) => {
            const isPoster = userRole === 'task_poster' && (task.postedBy && (task.postedBy._id === userId || task.postedBy === userId));
            return (
              <div
                className="browse-task-card"
                key={task._id}
                style={{
                  position: 'relative',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  marginBottom: 32,
                  opacity: loading ? 0.7 : 1,
                  transform: `translateY(${loading ? 20 : 0}px)`,
                  transition: 'box-shadow 0.2s, transform 0.3s, opacity 0.3s',
                  animation: 'fadeInUp 0.4s',
                }}
              >
                {/* Poster info */}
                {task.postedBy && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }} onClick={e => { e.stopPropagation(); navigate(`/user/${task.postedBy._id}`); }}>
                    <img
                      src={task.postedBy.profilePicture && task.postedBy.profilePicture !== '/default-avatar.png' ? (task.postedBy.profilePicture.startsWith('http') ? task.postedBy.profilePicture : 'http://localhost:5001' + task.postedBy.profilePicture) : '/default-avatar.png'}
                      alt={task.postedBy.name || 'Poster'}
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
                    />
                    <span style={{ fontWeight: 500, color: '#2563eb', fontSize: 15, textDecoration: 'underline' }}>{task.postedBy.name || 'Task Poster'}</span>
                  </div>
                )}
                <div className="browse-task-header">
                  <div className="browse-task-title">{task.title}</div>
                  <div className="browse-task-price" style={{color: '#22c55e', fontWeight: 700, fontSize: 22}}>{task.budget ? `$${task.budget}` : ''}</div>
                </div>
                <div className="browse-task-badges">
                  {task.category && (
                    <span className="browse-badge badge-design">{task.category}</span>
                  )}
                  {task.isRemote && (
                    <span className="browse-badge badge-remote-ok">Remote OK</span>
                  )}
                </div>
                <div className="browse-task-desc">{task.description}</div>
                <div className="browse-task-tags">
                  {task.tags && Array.isArray(task.tags) && task.tags.map((tag, i) => (
                    <span className="browse-task-tag" key={i}>{tag}</span>
                  ))}
                </div>
                <div className="browse-task-footer">
                  <span className="browse-task-location">{task.location || 'Remote'}</span>
                  <span className="browse-task-date">{task.deadline ? new Date(task.deadline).toLocaleDateString() : ''}</span>
                </div>
                {/* Status badge and action buttons */}
                <div style={{marginTop: 18, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'}}>
                  <span style={{
                    background: statusColors[task.status] || '#eee',
                    color: '#222',
                    borderRadius: 12,
                    padding: '6px 18px',
                    fontWeight: 600,
                    fontSize: 15,
                    letterSpacing: 1,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                  }}>
                    {statusLabels[task.status] || task.status}
                  </span>
                  {isPoster && (
                    <>
                      <button
                        className="add-task-btn"
                        style={{padding: '7px 18px', fontSize: 15, borderRadius: 8, background: '#f3f8ff', color: '#1a7f64', border: '1px solid #eaf6f2', fontWeight: 600, transition: 'background 0.2s'}}
                        onClick={() => openModal(task._id, task.status)}
                      >
                        Change Status
                      </button>
                      <button
                        className="add-task-btn"
                        style={{padding: '7px 18px', fontSize: 15, borderRadius: 8, background: '#fef9c3', color: '#f59e42', border: '1px solid #fef3c7', fontWeight: 600, transition: 'background 0.2s'}}
                        onClick={() => openEditModal(task)}
                      >
                        <FaEdit style={{ marginRight: 6 }} /> Edit
                      </button>
                      <button
                        className="add-task-btn"
                        style={{
                          padding: '7px 18px', 
                          fontSize: 15, 
                          borderRadius: 8, 
                          background: deleteConfirming === task._id ? '#ef4444' : '#fef2f2', 
                          color: deleteConfirming === task._id ? '#fff' : '#ef4444', 
                          border: '1px solid #fecaca', 
                          fontWeight: 600, 
                          transition: 'background 0.2s'
                        }}
                        onClick={() => handleDeleteTask(task._id)}
                      >
                        <FaTrash style={{ marginRight: 6 }} /> 
                        {deleteConfirming === task._id ? 'Confirm Delete' : 'Delete'}
                      </button>
                      <button
                        className="add-task-btn"
                        style={{
                          padding: '7px 18px', 
                          fontSize: 15, 
                          borderRadius: 8, 
                          background: '#f0f9ff', 
                          color: '#0369a1', 
                          border: '1px solid #bae6fd', 
                          fontWeight: 600, 
                          transition: 'background 0.2s'
                        }}
                        onClick={() => navigate(`/recommendations?taskId=${task._id}`)}
                      >
                        <FaLightbulb style={{ marginRight: 6 }} /> 
                        Get Freelancers
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>
      {/* Animations CSS */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-toast {
          position: fixed;
          top: 32px;
          right: 32px;
          z-index: 9999;
          min-width: 220px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.13);
          padding: 18px 32px;
          font-size: 1.1rem;
          font-weight: 600;
          color: #222;
          animation: fadeIn 0.3s;
          cursor: pointer;
          border-left: 6px solid #22c55e;
          transition: border-color 0.2s;
        }
        .custom-toast.error {
          border-left-color: #ef4444;
          color: #ef4444;
        }
        .custom-toast.success {
          border-left-color: #22c55e;
          color: #22c55e;
        }
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.18);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-content {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.13);
          padding: 36px 32px 28px 32px;
          min-width: 320px;
          max-width: 95vw;
        }
        .modern-input {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #e0e7ef;
          border-radius: 10px;
          font-size: 1rem;
          background: #f8fafc;
          transition: border 0.2s, box-shadow 0.2s;
          outline: none;
          box-sizing: border-box;
        }
        .modern-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px #e0e7ef;
          background: #fff;
        }
      `}</style>
    </div>
  );
};

export default MyTasks; 