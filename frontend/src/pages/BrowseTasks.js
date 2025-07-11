import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../Home.css';
import { FaSearch, FaEye, FaTimes } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function BidModal({ open, onClose, onSubmit, loading, error }) {
  const [bidAmount, setBidAmount] = useState('');
  const [estimatedCompletion, setEstimatedCompletion] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) {
      setBidAmount('');
      setEstimatedCompletion('');
      setMessage('');
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bid-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><FaTimes /></button>
        <h2>Place a Bid</h2>
        <form onSubmit={e => { e.preventDefault(); onSubmit({ bidAmount, estimatedCompletion, message }); }}>
          <label>Bid Amount (USD)</label>
          <input type="number" min="1" value={bidAmount} onChange={e => setBidAmount(e.target.value)} required />
          <label>Estimated Completion</label>
          <input type="date" value={estimatedCompletion} onChange={e => setEstimatedCompletion(e.target.value)} required />
          <label>Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Your message to the poster..." required />
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="add-task-btn" disabled={loading}>
            {loading ? 'Placing Bid...' : 'Submit Bid'}
          </button>
        </form>
      </div>
    </div>
  );
}

const budgetRanges = [
  { label: 'All Budgets', value: 'all' },
  { label: '$0 - $500', value: '0-500' },
  { label: '$500 - $1000', value: '500-1000' },
  { label: '$1000+', value: '1000+' },
];

const statusLabels = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};
const statusColors = {
  PENDING: '#facc15', // yellow
  IN_PROGRESS: '#38bdf8', // blue
  COMPLETED: '#22c55e', // green
};

const BrowseTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [budget, setBudget] = useState('all');
  const [tag, setTag] = useState('All Tags');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidLoading, setBidLoading] = useState(false);
  const [bidError, setBidError] = useState(null);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        let url = `${API_URL}/api/tasks`;
        const params = [];
        if (category !== 'All Categories') params.push(`category=${encodeURIComponent(category)}`);
        if (tag !== 'All Tags') params.push(`tag=${encodeURIComponent(tag)}`);
        if (params.length) url += `?${params.join('&')}`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(response.data.tasks || []);
      } catch (err) {
        setError('Failed to fetch tasks.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [category, tag]);

  useEffect(() => {
    // Get user role from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role);
      } catch {}
    }
  }, []);

  // Extract unique categories and tags from tasks
  const uniqueCategories = useMemo(() => {
    const cats = new Set();
    tasks.forEach(t => { if (t.category) cats.add(t.category); });
    return ['All Categories', ...Array.from(cats)];
  }, [tasks]);
  const uniqueTags = useMemo(() => {
    const tags = new Set();
    tasks.forEach(t => {
      if (Array.isArray(t.tags)) t.tags.forEach(tag => tags.add(tag));
    });
    return ['All Tags', ...Array.from(tags)];
  }, [tasks]);

  // Filtered tasks (search, budget)
  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase());
    let matchesBudget = true;
    if (budget !== 'all' && task.budget) {
      const b = parseFloat(task.budget);
      if (budget === '0-500') matchesBudget = b >= 0 && b <= 500;
      else if (budget === '500-1000') matchesBudget = b > 500 && b <= 1000;
      else if (budget === '1000+') matchesBudget = b > 1000;
    }
    return matchesSearch && matchesBudget;
  });

  const anyFilterActive = category !== 'All Categories' || budget !== 'all' || tag !== 'All Tags' || search;

  const handleBidSubmit = async ({ bidAmount, estimatedCompletion, message }) => {
    if (!selectedTask) return;
    setBidLoading(true);
    setBidError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/tasks/${selectedTask._id}/bid`, {
        bidAmount,
        estimatedCompletion,
        message,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBidSuccess(true);
      setTimeout(() => {
        setShowBidModal(false);
        setBidSuccess(false);
      }, 1200);
    } catch (err) {
      setBidError('Failed to place bid. Please try again.');
    } finally {
      setBidLoading(false);
    }
  };

  function TaskDetailsModal({ task, onClose }) {
    if (!task) return null;
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
          <h2 className="modal-title">{task.title}</h2>
          <div className="modal-badges">
            {task.category && <span className="browse-badge badge-design">{task.category}</span>}
            {task.isRemote && <span className="browse-badge badge-remote-ok">Remote OK</span>}
          </div>
          <div className="modal-section">
            <strong>Description:</strong>
            <p>{task.description}</p>
          </div>
          <div className="modal-section modal-details-grid">
            <div><strong>Budget:</strong> {task.budget ? `$${task.budget}` : '-'}</div>
            <div><strong>Deadline:</strong> {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}</div>
            <div><strong>Location:</strong> {task.location || 'Remote'}</div>
          </div>
          <div className="modal-section">
            <strong>Tags:</strong>
            <div className="browse-task-tags">
              {task.tags && Array.isArray(task.tags) && task.tags.length > 0 ? (
                task.tags.map((tag, i) => <span className="browse-task-tag" key={i}>{tag}</span>)
              ) : (
                <span style={{ color: '#888' }}>None</span>
              )}
            </div>
          </div>
          {/* Place Bid button for freelancers */}
          {userRole === 'freelancer' && (
            <div style={{marginTop: 24, textAlign: 'center'}}>
              <button className="add-task-btn" style={{width: 180}} onClick={() => setShowBidModal(true)}>
                Place Bid
              </button>
              {bidSuccess && <div className="success-message" style={{marginTop: 10}}>Bid placed successfully!</div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="browse-root">
      <TaskDetailsModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      <BidModal open={showBidModal} onClose={() => setShowBidModal(false)} onSubmit={handleBidSubmit} loading={bidLoading} error={bidError} />
      <section className="browse-header">
        <h1>Browse Tasks</h1>
        <p>Discover opportunities and find your next project</p>
      </section>
      <section className="browse-filters">
        <div className="browse-search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {uniqueCategories.map(cat => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
        <select value={budget} onChange={e => setBudget(e.target.value)}>
          {budgetRanges.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select value={tag} onChange={e => setTag(e.target.value)}>
          {uniqueTags.map(t => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <div className="browse-tasks-found">{filteredTasks.length} tasks found</div>
        {anyFilterActive && (
          <button className="clear-filters-btn" onClick={() => { setCategory('All Categories'); setBudget('all'); setTag('All Tags'); setSearch(''); }}>Clear Filters</button>
        )}
      </section>
      <section className="browse-tasks-grid">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredTasks.length === 0 ? (
          <div className="dashboard-no-tasks">No tasks found.</div>
        ) : (
          filteredTasks.map(task => (
            <div className="browse-task-card" key={task._id}>
              {/* Poster info */}
              {task.postedBy && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }} onClick={e => { e.stopPropagation(); navigate(`/user/${task.postedBy._id}`); }}>
                  <img
                    src={task.postedBy.profilePicture && task.postedBy.profilePicture !== '/default-avatar.png' ? (task.postedBy.profilePicture.startsWith('http') ? task.postedBy.profilePicture : API_URL + task.postedBy.profilePicture) : '/default-avatar.png'}
                    alt={task.postedBy.name || 'Poster'}
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
                  />
                  <span style={{ fontWeight: 500, color: '#2563eb', fontSize: 15, textDecoration: 'underline' }}>{task.postedBy.name || 'Task Poster'}</span>
                </div>
              )}
              <div className="browse-task-header">
                <div className="browse-task-title">{task.title}</div>
                <div className="browse-task-price">
                  {task.budget ? `$${task.budget}` : ''}
                </div>
                <span className="status-badge" style={{
                  background: statusColors[task.status] || '#eee',
                  color: '#222',
                  borderRadius: 12,
                  padding: '4px 14px',
                  fontWeight: 600,
                  fontSize: 13,
                  marginLeft: 10,
                  letterSpacing: 1,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                }}>{statusLabels[task.status] || task.status}</span>
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
                <button className="browse-view-details" onClick={() => setSelectedTask(task)}>
                  <FaEye style={{ marginRight: 6 }} /> View Details
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default BrowseTasks; 