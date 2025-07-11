import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaDollarSign, FaClock, FaUserCheck, FaFilter } from 'react-icons/fa';
import '../Home.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function TaskFeed() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        category: '',
        budget: '',
        sortBy: 'relevance'
    });
    const [showFilters, setShowFilters] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        fetchTasks();
    }, [currentPage, filters, navigate, fetchTasks]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const params = new URLSearchParams({
                page: currentPage,
                limit: 12,
                ...(filters.category && { category: filters.category }),
                ...(filters.budget && { budget: filters.budget }),
                sortBy: filters.sortBy
            });

            const response = await axios.get(`${API_URL}/api/tasks/feed?${params}`, config);
            setTasks(response.data.tasks);
            setTotalPages(response.data.pagination.totalPages);
        } catch (error) {
            console.error('Error fetching task feed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset to first page when filters change
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatBudget = (budget) => {
        return `$${budget.toLocaleString()}`;
    };

    const getRelevanceBadge = (relevanceScore) => {
        if (relevanceScore >= 15) return { text: 'Perfect Match', color: 'success' };
        if (relevanceScore >= 10) return { text: 'Great Match', color: 'primary' };
        if (relevanceScore >= 5) return { text: 'Good Match', color: 'warning' };
        return { text: 'Match', color: 'secondary' };
    };

    const budgetRanges = [
        { label: 'All Budgets', value: '' },
        { label: '$0 - $100', value: '0-100' },
        { label: '$100 - $500', value: '100-500' },
        { label: '$500 - $1000', value: '500-1000' },
        { label: '$1000+', value: '1000-10000' }
    ];

    const categories = [
        'All Categories',
        'Web Development',
        'Graphic Design',
        'Writing',
        'Marketing',
        'Other'
    ];

    if (loading && tasks.length === 0) {
        return (
            <div className="container mt-5">
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading personalized task feed...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-12">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <div>
                            <h2 className="mb-1">Personalized Task Feed</h2>
                            <p className="text-muted mb-0">Tasks matched to your skills and preferences</p>
                        </div>
                        <div className="d-flex gap-2">
                            <button 
                                className="btn btn-outline-secondary"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <FaFilter className="me-1" />
                                Filters
                            </button>
                            <button 
                                className="btn btn-outline-primary"
                                onClick={() => navigate('/recommendations')}
                            >
                                <FaStar className="me-1" />
                                Top Recommendations
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-4">
                                        <label className="form-label">Category</label>
                                        <select 
                                            className="form-select"
                                            value={filters.category}
                                            onChange={(e) => handleFilterChange('category', e.target.value)}
                                        >
                                            {categories.map(category => (
                                                <option key={category} value={category === 'All Categories' ? '' : category}>
                                                    {category}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Budget Range</label>
                                        <select 
                                            className="form-select"
                                            value={filters.budget}
                                            onChange={(e) => handleFilterChange('budget', e.target.value)}
                                        >
                                            {budgetRanges.map(range => (
                                                <option key={range.value} value={range.value}>
                                                    {range.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Sort By</label>
                                        <select 
                                            className="form-select"
                                            value={filters.sortBy}
                                            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                        >
                                            <option value="relevance">Relevance</option>
                                            <option value="newest">Newest First</option>
                                            <option value="budget_high">Highest Budget</option>
                                            <option value="budget_low">Lowest Budget</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tasks Grid */}
            <div className="row">
                {tasks.map((task) => {
                    const relevanceBadge = getRelevanceBadge(task.relevanceScore || 0);
                    return (
                        <div key={task._id} className="col-md-6 col-lg-4 mb-4">
                            <div className="card h-100 task-card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h6 className="card-title mb-0">{task.title}</h6>
                                        <span className={`badge bg-${relevanceBadge.color}`}>
                                            {relevanceBadge.text}
                                        </span>
                                    </div>
                                    
                                    <p className="card-text text-muted small mb-2">
                                        {task.description.substring(0, 100)}...
                                    </p>
                                    
                                    <div className="d-flex align-items-center mb-2">
                                        <FaDollarSign className="text-success me-1" />
                                        <span className="fw-bold">{formatBudget(task.budget)}</span>
                                    </div>
                                    
                                    <div className="d-flex align-items-center mb-2">
                                        <FaClock className="text-info me-1" />
                                        <span className="small">Posted {formatDate(task.createdAt)}</span>
                                    </div>
                                    
                                    <div className="d-flex align-items-center mb-3">
                                        <FaMapMarkerAlt className="text-secondary me-1" />
                                        <span className="small">{task.location || 'Location not specified'}</span>
                                    </div>
                                    
                                    {task.postedBy && (
                                        <div className="d-flex align-items-center mb-3">
                                            <img 
                                                src={task.postedBy.profilePicture || '/default-avatar.png'} 
                                                alt="Profile" 
                                                className="rounded-circle me-2" 
                                                style={{ width: '24px', height: '24px' }}
                                            />
                                            <span className="small fw-bold">{task.postedBy.name}</span>
                                            {task.postedBy.isVerified && (
                                                <FaUserCheck className="text-primary ms-1" size={12} />
                                            )}
                                        </div>
                                    )}
                                    
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="badge bg-light text-dark">
                                            {task.category}
                                        </span>
                                        <button 
                                            className="btn btn-primary btn-sm"
                                            onClick={() => navigate(`/task/${task._id}`)}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="row">
                    <div className="col-12">
                        <nav aria-label="Task feed pagination">
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button 
                                        className="page-link" 
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                </li>
                                
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                            <button 
                                                className="page-link"
                                                onClick={() => setCurrentPage(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        </li>
                                    );
                                })}
                                
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button 
                                        className="page-link" 
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            )}

            {tasks.length === 0 && !loading && (
                <div className="row">
                    <div className="col-12">
                        <div className="text-center py-5">
                            <p className="text-muted">No tasks found matching your criteria.</p>
                            <p className="text-muted">Try adjusting your filters or check back later for new tasks.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TaskFeed; 