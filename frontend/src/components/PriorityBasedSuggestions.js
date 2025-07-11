import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFilter, FaStar, FaClock, FaDollarSign, FaBrain, FaChartLine, FaSort, FaEye } from 'react-icons/fa';
import './PriorityBasedSuggestions.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const PriorityBasedSuggestions = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        difficulty: '',
        priority: '',
        category: '',
        limit: 10
    });
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('relevance');

    useEffect(() => {
        fetchPrioritySuggestions();
    }, [filters]);

    const fetchPrioritySuggestions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await axios.get(`${API_URL}/api/recommendations/priority?${params}`, config);
            setSuggestions(response.data.recommendations);
        } catch (err) {
            setError('Failed to load priority suggestions');
            console.error('Error fetching priority suggestions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            difficulty: '',
            priority: '',
            category: '',
            limit: 10
        });
    };

    const getDifficultyColor = (level) => {
        const colors = {
            'BEGINNER': '#10b981',
            'INTERMEDIATE': '#f59e0b',
            'ADVANCED': '#f97316',
            'EXPERT': '#ef4444'
        };
        return colors[level] || '#6b7280';
    };

    const getPriorityColor = (level) => {
        const colors = {
            'LOW': '#6b7280',
            'MEDIUM': '#3b82f6',
            'HIGH': '#f59e0b',
            'URGENT': '#ef4444'
        };
        return colors[level] || '#6b7280';
    };

    const getRelevanceColor = (score) => {
        if (score >= 8) return '#10b981';
        if (score >= 6) return '#f59e0b';
        if (score >= 4) return '#f97316';
        return '#6b7280';
    };

    const formatDeadline = (deadline) => {
        const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
        if (days <= 0) return 'Overdue';
        if (days === 1) return '1 day left';
        if (days <= 7) return `${days} days left`;
        return `${days} days left`;
    };

    const getDeadlineColor = (deadline) => {
        const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
        if (days <= 1) return '#ef4444';
        if (days <= 3) return '#f97316';
        if (days <= 7) return '#f59e0b';
        return '#10b981';
    };

    const sortedSuggestions = [...suggestions].sort((a, b) => {
        switch (sortBy) {
            case 'relevance':
                return b.relevanceScore - a.relevanceScore;
            case 'budget':
                return b.budget - a.budget;
            case 'deadline':
                return new Date(a.deadline) - new Date(b.deadline);
            case 'difficulty':
                return a.difficulty.score - b.difficulty.score;
            default:
                return b.relevanceScore - a.relevanceScore;
        }
    });

    if (loading) {
        return (
            <div className="priority-suggestions">
                <div className="suggestions-loading">
                    <div className="loading-spinner"></div>
                    <p>Finding the best tasks for you...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="priority-suggestions">
                <div className="suggestions-error">
                    <FaBrain className="error-icon" />
                    <h3>Unable to Load Suggestions</h3>
                    <p>{error}</p>
                    <button onClick={fetchPrioritySuggestions} className="retry-btn">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="priority-suggestions">
            <div className="suggestions-header">
                <div className="header-content">
                    <h2>
                        <FaBrain className="header-icon" />
                        Smart Task Suggestions
                    </h2>
                    <p>AI-powered recommendations based on your skills and preferences</p>
                </div>
                
                <div className="header-actions">
                    <button 
                        className={`filter-toggle ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FaFilter />
                        Filters
                    </button>
                    
                    <div className="sort-dropdown">
                        <FaSort className="sort-icon" />
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-select"
                        >
                            <option value="relevance">Sort by Relevance</option>
                            <option value="budget">Sort by Budget</option>
                            <option value="deadline">Sort by Deadline</option>
                            <option value="difficulty">Sort by Difficulty</option>
                        </select>
                    </div>
                </div>
            </div>

            {showFilters && (
                <div className="filters-panel">
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label>Difficulty Level</label>
                            <select 
                                value={filters.difficulty} 
                                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                            >
                                <option value="">All Levels</option>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                                <option value="expert">Expert</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Priority Level</label>
                            <select 
                                value={filters.priority} 
                                onChange={(e) => handleFilterChange('priority', e.target.value)}
                            >
                                <option value="">All Priorities</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Category</label>
                            <select 
                                value={filters.category} 
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                            >
                                <option value="">All Categories</option>
                                <option value="web-development">Web Development</option>
                                <option value="mobile-development">Mobile Development</option>
                                <option value="ui-ux-design">UI/UX Design</option>
                                <option value="content-writing">Content Writing</option>
                                <option value="data-analysis">Data Analysis</option>
                                <option value="graphic-design">Graphic Design</option>
                                <option value="video-editing">Video Editing</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Results Limit</label>
                            <select 
                                value={filters.limit} 
                                onChange={(e) => handleFilterChange('limit', e.target.value)}
                            >
                                <option value="5">5 results</option>
                                <option value="10">10 results</option>
                                <option value="15">15 results</option>
                                <option value="20">20 results</option>
                            </select>
                        </div>
                    </div>

                    <div className="filter-actions">
                        <button onClick={clearFilters} className="clear-filters-btn">
                            Clear Filters
                        </button>
                        <button onClick={() => setShowFilters(false)} className="apply-filters-btn">
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}

            <div className="suggestions-stats">
                <div className="stat-card">
                    <FaStar className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">{suggestions.length}</span>
                        <span className="stat-label">Tasks Found</span>
                    </div>
                </div>
                <div className="stat-card">
                    <FaChartLine className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">
                            {suggestions.length > 0 ? 
                                Math.round(suggestions.reduce((sum, task) => sum + task.relevanceScore, 0) / suggestions.length * 10) / 10 : 0
                            }
                        </span>
                        <span className="stat-label">Avg Relevance</span>
                    </div>
                </div>
                <div className="stat-card">
                    <FaDollarSign className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">
                            {suggestions.length > 0 ? 
                                Math.round(suggestions.reduce((sum, task) => sum + task.budget, 0) / suggestions.length) : 0
                            }
                        </span>
                        <span className="stat-label">Avg Budget</span>
                    </div>
                </div>
            </div>

            <div className="suggestions-grid">
                {sortedSuggestions.map((task) => (
                    <div key={task._id} className="suggestion-card">
                        <div className="card-header">
                            <div className="task-title">
                                <h3>{task.title}</h3>
                                <div className="task-meta">
                                    <span className="category-badge">{task.category}</span>
                                    {task.postedBy?.isVerified && (
                                        <span className="verified-badge">✓ Verified</span>
                                    )}
                                </div>
                            </div>
                            <div className="relevance-score" style={{ 
                                backgroundColor: getRelevanceColor(task.relevanceScore) 
                            }}>
                                {task.relevanceScore}/10
                            </div>
                        </div>

                        <p className="task-description">{task.description.substring(0, 150)}...</p>

                        <div className="task-metrics">
                            <div className="metric-item">
                                <FaDollarSign className="metric-icon" />
                                <span className="metric-value">${task.budget}</span>
                                <span className="metric-label">Budget</span>
                            </div>
                            <div className="metric-item">
                                <FaClock className="metric-icon" />
                                <span className="metric-value">{task.timeEstimation?.estimatedHours || 'N/A'}h</span>
                                <span className="metric-label">Est. Time</span>
                            </div>
                            <div className="metric-item">
                                <FaBrain className="metric-icon" />
                                <span className="metric-value">{task.difficulty?.score || 'N/A'}/10</span>
                                <span className="metric-label">Difficulty</span>
                            </div>
                        </div>

                        <div className="task-badges">
                            <span 
                                className="difficulty-badge" 
                                style={{ backgroundColor: getDifficultyColor(task.difficulty?.level) }}
                            >
                                {task.difficulty?.level || 'N/A'}
                            </span>
                            <span 
                                className="priority-badge" 
                                style={{ backgroundColor: getPriorityColor(task.priority?.level) }}
                            >
                                {task.priority?.level || 'N/A'}
                            </span>
                            <span 
                                className="deadline-badge" 
                                style={{ color: getDeadlineColor(task.deadline) }}
                            >
                                {formatDeadline(task.deadline)}
                            </span>
                        </div>

                        <div className="card-actions">
                            <button className="view-task-btn">
                                <FaEye />
                                View Details
                            </button>
                            <button className="apply-task-btn">
                                Apply Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {suggestions.length === 0 && (
                <div className="no-suggestions">
                    <FaBrain className="no-suggestions-icon" />
                    <h3>No matching tasks found</h3>
                    <p>Try adjusting your filters or check back later for new opportunities.</p>
                    <button onClick={clearFilters} className="clear-filters-btn">
                        Clear All Filters
                    </button>
                </div>
            )}
        </div>
    );
};

export default PriorityBasedSuggestions; 