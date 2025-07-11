import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import '../../src/Home.css';
import { useNavigate } from 'react-router-dom';
import { FaPlusCircle, FaSearch, FaGift, FaChartLine, FaClock, FaStar, FaUserCircle } from 'react-icons/fa';
import { useUserProfile } from '../UserProfileContext';
import { API_URL } from '../config/api';

const Home = () => {
    const [tasks, setTasks] = useState([]);
    const [bids, setBids] = useState([]);
    const [userToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState('');
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bidsLoading, setBidsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (userToken) {
            const decodedToken = jwtDecode(userToken);
            setUserRole(decodedToken.role);
            if (decodedToken.name) {
                setUser(decodedToken.name);
            } else {
                axios.get(`${API_URL}/user/profile`, {
                    headers: { Authorization: `Bearer ${userToken}` },
                }).then(res => {
                    setUser(res.data.name || 'User');
                }).catch(() => setUser('User'));
            }
        }
    }, [userToken]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/tasks`, {
                    headers: { Authorization: `Bearer ${userToken}` },
                });
                setTasks(response.data.tasks);
                setLoading(false);
            } catch (error) {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [userToken]);

    useEffect(() => {
        const fetchBids = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/bids/my`, {
                    headers: { Authorization: `Bearer ${userToken}` },
                });
                setBids(response.data);
                setBidsLoading(false);
            } catch (error) {
                setBidsLoading(false);
            }
        };
        fetchBids();
    }, [userToken]);

    // Stats
    const tasksPosted = tasks.length;
    const activeBids = bids.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const rating = 0.0; // Replace with real data if available

    // Recent tasks (show 2 most recent)
    const recentTasks = tasks.slice(0, 2);
    // Recent bids (show 2 most recent)
    const recentBids = bids.slice(0, 2);

    return (
        <div className="dashboard-root">
            {/* Welcome Section */}
            <section className="dashboard-welcome">
                <h1>Welcome back, {user || 'User'}! <span role="img" aria-label="wave">👋</span></h1>
                <p>Ready to tackle some tasks or find your next opportunity?</p>
            </section>

            {/* Action Cards */}
            <section className="dashboard-actions">
                {userRole === 'task_poster' && (
                  <div className="dashboard-action-card post-task" onClick={() => navigate('/tasks/create')}>
                      <div className="dashboard-action-icon"><FaPlusCircle size={32} /></div>
                      <div>
                          <h3>Post a Task</h3>
                          <p>Get help with your project</p>
                      </div>
                  </div>
                )}
                <div className="dashboard-action-card browse-tasks" onClick={() => navigate('/tasks')}>
                    <div className="dashboard-action-icon"><FaSearch size={32} /></div>
                    <div>
                        <h3>Browse Tasks</h3>
                        <p>Find your next opportunity</p>
                    </div>
                </div>
            </section>

            {/* Stats Cards */}
            <section className="dashboard-stats">
                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-label">Tasks Posted</div>
                    <div className="dashboard-stat-value">{tasksPosted}</div>
                    <div className="dashboard-stat-icon"><FaGift /></div>
                </div>
                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-label">Active Bids</div>
                    <div className="dashboard-stat-value">{activeBids}</div>
                    <div className="dashboard-stat-icon"><FaChartLine /></div>
                </div>
                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-label">Completed</div>
                    <div className="dashboard-stat-value">{completed}</div>
                    <div className="dashboard-stat-icon"><FaClock /></div>
                </div>
                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-label">Rating</div>
                    <div className="dashboard-stat-value">{rating.toFixed(1)}</div>
                    <div className="dashboard-stat-icon"><FaStar /></div>
                </div>
            </section>

            {/* Main Grid: Recent Tasks & My Recent Bids */}
            <div style={{display: 'flex', gap: 32, maxWidth: 1200, margin: '0 auto'}}>
                {/* Recent Tasks */}
                <section className="dashboard-recent-tasks" style={{flex: 1}}>
                    <div className="dashboard-recent-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <h2>Recent Tasks</h2>
                        <button className="dashboard-view-all" onClick={() => navigate('/tasks')}>View All</button>
                    </div>
                    <div className="dashboard-recent-list">
                        {loading ? (
                            <div className="loading-spinner"></div>
                        ) : recentTasks.length === 0 ? (
                            <div className="dashboard-no-tasks">No recent tasks.</div>
                        ) : (
                            recentTasks.map((task, idx) => (
                                <div className="dashboard-task-card" key={task._id || idx} style={{marginBottom: 18}}>
                                    {/* Poster info */}
                                    {task.postedBy && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }} onClick={e => { e.stopPropagation(); navigate(`/user/${task.postedBy._id}`); }}>
                                        <img
                                          src={task.postedBy.profilePicture && task.postedBy.profilePicture !== '/default-avatar.png' ? (task.postedBy.profilePicture.startsWith('http') ? task.postedBy.profilePicture : 'http://localhost:5001' + task.postedBy.profilePicture) : '/default-avatar.png'}
                                          alt={task.postedBy.name || 'Poster'}
                                          style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
                                        />
                                        <span style={{ fontWeight: 500, color: '#2563eb', fontSize: 14, textDecoration: 'underline' }}>{task.postedBy.name || 'Task Poster'}</span>
                                      </div>
                                    )}
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <div className="dashboard-task-title" style={{fontWeight: 600, fontSize: 18}}>{task.title}</div>
                                        {task.category && <span className="dashboard-task-tag" style={{background: '#eef2ff', color: '#6366f1', fontWeight: 600, borderRadius: 8, padding: '4px 12px', fontSize: 13}}>{task.category}</span>}
                                    </div>
                                    <div className="dashboard-task-desc" style={{margin: '8px 0', color: '#555'}}>{task.description}</div>
                                    <div className="dashboard-task-tags" style={{marginBottom: 6}}>
                                        {task.tags && Array.isArray(task.tags) && task.tags.map((tag, i) => (
                                            <span className="dashboard-task-tag" key={i}>{tag}</span>
                                        ))}
                                    </div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: '#888'}}>
                                        <span style={{fontWeight: 600, color: '#22c55e'}}>{task.budget ? `$${task.budget}` : ''}</span>
                                        <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : ''}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
                {/* My Recent Bids */}
                <section className="dashboard-recent-bids" style={{flex: 1}}>
                    <div className="dashboard-recent-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <h2>My Recent Bids</h2>
                        <button className="dashboard-view-all" onClick={() => navigate('/my-bids')}>View All</button>
                    </div>
                    <div className="dashboard-recent-list">
                        {bidsLoading ? (
                            <div className="loading-spinner"></div>
                        ) : recentBids.length === 0 ? (
                            <div className="dashboard-no-tasks" style={{textAlign: 'center', color: '#888', fontSize: 18, padding: '32px 0'}}>
                                <FaUserCircle size={48} style={{marginBottom: 8, color: '#cbd5e1'}} />
                                <div>No bids yet</div>
                                <div style={{fontSize: 15, color: '#aaa'}}>Start bidding on tasks to see them here</div>
                            </div>
                        ) : (
                            recentBids.map((bid, idx) => (
                                <div className="dashboard-task-card" key={bid._id || idx} style={{marginBottom: 18}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <div className="dashboard-task-title" style={{fontWeight: 600, fontSize: 18}}>{bid.task?.title || 'Task'}</div>
                                        {bid.task?.category && <span className="dashboard-task-tag" style={{background: '#e0f2fe', color: '#0284c7', fontWeight: 600, borderRadius: 8, padding: '4px 12px', fontSize: 13}}>{bid.task.category}</span>}
                                    </div>
                                    <div className="dashboard-task-desc" style={{margin: '8px 0', color: '#555'}}>{bid.task?.description || ''}</div>
                                    <div className="dashboard-task-tags" style={{marginBottom: 6}}>
                                        {bid.task?.tags && Array.isArray(bid.task.tags) && bid.task.tags.map((tag, i) => (
                                            <span className="dashboard-task-tag" key={i}>{tag}</span>
                                        ))}
                                    </div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: '#888'}}>
                                        <span style={{fontWeight: 600, color: '#22c55e'}}>{bid.bidAmount ? `$${bid.bidAmount}` : ''}</span>
                                        <span>{bid.createdAt ? new Date(bid.createdAt).toLocaleDateString() : ''}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Home;