import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaMapMarkerAlt, FaDollarSign, FaClock, FaUserCheck, FaLightbulb, FaRocket, FaUsers, FaChartLine, FaFilter } from 'react-icons/fa';
import '../Home.css';
import '../Recommendations.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function Recommendations() {
    const [taskRecommendations, setTaskRecommendations] = useState([]);
    const [freelancerRecommendations, setFreelancerRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');

    const [showFreelancerModal, setShowFreelancerModal] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Decode token to get user role
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUserRole(payload.role);
        } catch (error) {
            console.error('Error decoding token:', error);
        }

        fetchRecommendations();
    }, [navigate, userRole]);

    // Check if there's a taskId in the URL for freelancer recommendations
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const taskId = params.get('taskId');
        
        if (taskId && userRole === 'task_poster') {
            fetchFreelancerRecommendations(taskId);
        }
    }, [location.search, userRole]);

    const fetchRecommendations = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            if (userRole === 'freelancer') {
                // Fetch task recommendations for freelancers
                const response = await axios.get(`${API_URL}/api/tasks/recommendations/tasks`, config);
                setTaskRecommendations(response.data.recommendations);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            setLoading(false);
        }
    };

    const fetchFreelancerRecommendations = async (taskId) => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const response = await axios.get(`${API_URL}/api/tasks/recommendations/freelancers/${taskId}`, config);
            setFreelancerRecommendations(response.data.recommendations);
            setShowFreelancerModal(true);
        } catch (error) {
            console.error('Error fetching freelancer recommendations:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatBudget = (budget) => {
        return `$${budget.toLocaleString()}`;
    };



    if (loading) {
        return (
            <div className="recommendations-loading">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <h3>Loading Smart Recommendations</h3>
                    <p>Analyzing your skills and preferences...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="recommendations-page">
            {/* Hero Section */}
            <div className="recommendations-hero">
                <div className="hero-content">
                    <div className="hero-icon">
                        <FaLightbulb />
                    </div>
                    <h1>Smart Recommendations</h1>
                    <p>AI-powered matching to connect you with the best opportunities</p>
                </div>
                <div className="hero-stats">
                    <div className="stat-item">
                        <FaRocket className="stat-icon" />
                        <div className="stat-content">
                            <h4>Smart Matching</h4>
                            <p>Advanced algorithms</p>
                        </div>
                    </div>
                    <div className="stat-item">
                        <FaUsers className="stat-icon" />
                        <div className="stat-content">
                            <h4>Verified Users</h4>
                            <p>Quality connections</p>
                        </div>
                    </div>
                    <div className="stat-item">
                        <FaChartLine className="stat-icon" />
                        <div className="stat-content">
                            <h4>High Success Rate</h4>
                            <p>Proven results</p>
                        </div>
                    </div>
                </div>
            </div>

            {userRole === 'freelancer' && (
                <div className="recommendations-section">
                    <div className="section-header">
                        <div className="header-content">
                            <h2>Recommended Tasks for You</h2>
                            <p>Tasks that match your skills and preferences</p>
                        </div>
                        <div className="header-actions">
                            <button 
                                className="btn btn-outline-primary"
                                onClick={() => navigate('/task-feed')}
                            >
                                <FaFilter className="me-2" />
                                Advanced Filters
                            </button>
                        </div>
                    </div>
                    
                    <div className="recommendations-grid">
                        {taskRecommendations.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <FaLightbulb />
                                </div>
                                <h3>No recommendations yet</h3>
                                <p>Add skills to your profile to get personalized task recommendations</p>
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => navigate('/profile/edit')}
                                >
                                    Update Profile
                                </button>
                            </div>
                        ) : (
                            taskRecommendations.map((task, index) => (
                                <div key={task._id} className="recommendation-card task-card" style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className="card-header">
                                        <div className="card-badges">
                                            <span className="badge badge-recommended">Recommended</span>
                                            <span className={`badge badge-status ${task.status.toLowerCase()}`}>
                                                {task.status}
                                            </span>
                                        </div>
                                        <div className="card-budget">
                                            <FaDollarSign />
                                            <span>{formatBudget(task.budget)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="card-body">
                                        <h3 className="card-title">{task.title}</h3>
                                        <p className="card-description">
                                            {task.description.substring(0, 120)}...
                                        </p>
                                        
                                        <div className="card-meta">
                                            <div className="meta-item">
                                                <FaClock />
                                                <span>Posted {formatDate(task.createdAt)}</span>
                                            </div>
                                            <div className="meta-item">
                                                <FaMapMarkerAlt />
                                                <span>{task.location || 'Remote'}</span>
                                            </div>
                                        </div>
                                        
                                        {task.postedBy && (
                                            <div className="card-poster">
                                                <img 
                                                    src={task.postedBy.profilePicture || '/default-avatar.png'} 
                                                    alt="Profile" 
                                                    className="poster-avatar"
                                                />
                                                <div className="poster-info">
                                                    <span className="poster-name">{task.postedBy.name}</span>
                                                    {task.postedBy.isVerified && (
                                                        <FaUserCheck className="verified-badge" />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="card-tags">
                                            <span className="tag category">{task.category}</span>
                                            {task.tags && task.tags.slice(0, 2).map((tag, i) => (
                                                <span key={i} className="tag">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="card-footer">
                                        <button 
                                            className="btn btn-primary btn-full"
                                            onClick={() => navigate(`/task/${task._id}`)}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {userRole === 'task_poster' && (
                <div className="recommendations-section">
                    <div className="section-header">
                        <div className="header-content">
                            <h2>Recommended Freelancers</h2>
                            <p>Top talent matched to your task requirements</p>
                        </div>
                        <div className="header-actions">
                            <button 
                                className="view-my-tasks-btn"
                                onClick={() => navigate('/my-tasks')}
                            >
                                <FaUsers className="btn-icon" />
                                <span className="btn-text">View My Tasks</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="recommendations-grid">
                        {freelancerRecommendations.length > 0 ? (
                            freelancerRecommendations.map((freelancer, index) => (
                                <div key={freelancer._id} className="recommendation-card freelancer-card" style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className="card-header">
                                        <div className="card-badges">
                                            <span className="badge badge-recommended">Top Match</span>
                                            {freelancer.isVerified && (
                                                <span className="badge badge-verified">
                                                    <FaUserCheck /> Verified
                                                </span>
                                            )}
                                        </div>
                                        <div className="card-rate">
                                            <FaDollarSign />
                                            <span>${freelancer.hourlyRate}/hr</span>
                                        </div>
                                    </div>
                                    
                                    <div className="card-body">
                                        <div className="freelancer-profile">
                                            <img 
                                                src={freelancer.profilePicture || '/default-avatar.png'} 
                                                alt="Profile" 
                                                className="freelancer-avatar"
                                            />
                                            <div className="freelancer-info">
                                                <h3 className="freelancer-name">{freelancer.name}</h3>
                                                <div className="freelancer-location">
                                                    <FaMapMarkerAlt />
                                                    <span>{freelancer.location || 'Location not specified'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {freelancer.bio && (
                                            <p className="freelancer-bio">
                                                {freelancer.bio.substring(0, 100)}...
                                            </p>
                                        )}
                                        
                                        {freelancer.skills && freelancer.skills.length > 0 && (
                                            <div className="skills-section">
                                                <h4>Skills</h4>
                                                <div className="skills-grid">
                                                    {freelancer.skills.slice(0, 4).map((skill, index) => (
                                                        <span key={index} className="skill-tag">{skill}</span>
                                                    ))}
                                                    {freelancer.skills.length > 4 && (
                                                        <span className="skill-tag more">
                                                            +{freelancer.skills.length - 4} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="card-footer">
                                        <button 
                                            className="btn btn-primary btn-full"
                                            onClick={() => navigate(`/user/${freelancer._id}`)}
                                        >
                                            View Profile
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <FaUsers />
                                </div>
                                <h3>No freelancer recommendations yet</h3>
                                <p>Go to your tasks and click "Get Freelancers" to see recommendations</p>
                                <button 
                                    className="view-my-tasks-btn"
                                    onClick={() => navigate('/my-tasks')}
                                >
                                    <FaUsers className="btn-icon" />
                                    <span className="btn-text">View My Tasks</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Enhanced Modal */}
            {showFreelancerModal && (
                <div className="modal-overlay enhanced-modal" onClick={() => setShowFreelancerModal(false)}>
                    <div className="modal-content enhanced-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <FaUserCheck className="me-2" />
                                Recommended Freelancers
                            </h3>
                            <button 
                                className="modal-close"
                                onClick={() => setShowFreelancerModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            {freelancerRecommendations.length === 0 ? (
                                <div className="modal-empty">
                                    <p>No freelancer recommendations available for this task.</p>
                                </div>
                            ) : (
                                <div className="modal-grid">
                                    {freelancerRecommendations.map((freelancer) => (
                                        <div key={freelancer._id} className="modal-card">
                                            <div className="modal-card-header">
                                                <img 
                                                    src={freelancer.profilePicture || '/default-avatar.png'} 
                                                    alt="Profile" 
                                                    className="modal-avatar"
                                                />
                                                <div className="modal-user-info">
                                                    <h4>{freelancer.name}</h4>
                                                    <div className="modal-user-meta">
                                                        {freelancer.isVerified && (
                                                            <FaUserCheck className="verified-icon" />
                                                        )}
                                                        <span>{freelancer.location || 'Location not specified'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {freelancer.bio && (
                                                <p className="modal-bio">
                                                    {freelancer.bio.substring(0, 80)}...
                                                </p>
                                            )}
                                            
                                            <div className="modal-rate">
                                                <FaDollarSign />
                                                <span>${freelancer.hourlyRate}/hr</span>
                                            </div>
                                            
                                            {freelancer.skills && freelancer.skills.length > 0 && (
                                                <div className="modal-skills">
                                                    {freelancer.skills.slice(0, 3).map((skill, index) => (
                                                        <span key={index} className="modal-skill">{skill}</span>
                                                    ))}
                                                    {freelancer.skills.length > 3 && (
                                                        <span className="modal-skill more">
                                                            +{freelancer.skills.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <button 
                                                className="btn btn-outline-primary btn-full"
                                                onClick={() => navigate(`/user/${freelancer._id}`)}
                                            >
                                                View Profile
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Recommendations; 