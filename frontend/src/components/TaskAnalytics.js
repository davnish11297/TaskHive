import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChartBar, FaClock, FaStar, FaBrain, FaBullseye, FaChartLine, FaLightbulb, FaUsers, FaDollarSign, FaCalendarAlt } from 'react-icons/fa';
import './TaskAnalytics.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const TaskAnalytics = ({ taskId, onClose }) => {
    const [difficultyData, setDifficultyData] = useState(null);
    const [timeData, setTimeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('difficulty');

    useEffect(() => {
        if (taskId) {
            fetchTaskAnalytics();
        }
    }, [taskId]);

    const fetchTaskAnalytics = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [difficultyRes, timeRes] = await Promise.all([
                axios.get(`${API_URL}/api/tasks/${taskId}/difficulty`, config),
                axios.get(`${API_URL}/api/tasks/${taskId}/time-estimation`, config)
            ]);

            setDifficultyData(difficultyRes.data);
            setTimeData(timeRes.data);
        } catch (err) {
            setError('Failed to load task analytics');
            console.error('Error fetching task analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyColor = (score) => {
        if (score <= 3) return '#10b981'; // green
        if (score <= 6) return '#f59e0b'; // yellow
        if (score <= 8) return '#f97316'; // orange
        return '#ef4444'; // red
    };

    const getDifficultyLabel = (level) => {
        const labels = {
            'BEGINNER': 'Beginner Friendly',
            'INTERMEDIATE': 'Intermediate Level',
            'ADVANCED': 'Advanced Level',
            'EXPERT': 'Expert Level'
        };
        return labels[level] || level;
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

    if (loading) {
        return (
            <div className="task-analytics-modal">
                <div className="analytics-content">
                    <div className="analytics-loading">
                        <div className="loading-spinner"></div>
                        <p>Analyzing task complexity...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="task-analytics-modal">
                <div className="analytics-content">
                    <div className="analytics-error">
                        <FaBrain className="error-icon" />
                        <h3>Analysis Error</h3>
                        <p>{error}</p>
                        <button onClick={fetchTaskAnalytics} className="retry-btn">
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="task-analytics-modal" onClick={onClose}>
            <div className="analytics-content" onClick={e => e.stopPropagation()}>
                <div className="analytics-header">
                    <h2>
                        <FaBrain className="header-icon" />
                        Task Intelligence
                    </h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="analytics-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'difficulty' ? 'active' : ''}`}
                        onClick={() => setActiveTab('difficulty')}
                    >
                        <FaBullseye />
                        Difficulty Analysis
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'time' ? 'active' : ''}`}
                        onClick={() => setActiveTab('time')}
                    >
                        <FaClock />
                        Time Estimation
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
                        onClick={() => setActiveTab('insights')}
                    >
                        <FaLightbulb />
                        Smart Insights
                    </button>
                </div>

                <div className="analytics-body">
                    {activeTab === 'difficulty' && difficultyData && (
                        <div className="difficulty-analysis">
                            <div className="overall-score">
                                <div className="score-circle" style={{ 
                                    background: `conic-gradient(${getDifficultyColor(difficultyData.overallScore)} ${difficultyData.overallScore * 36}deg, #f3f4f6 0deg)` 
                                }}>
                                    <div className="score-inner">
                                        <span className="score-number">{difficultyData.overallScore}</span>
                                        <span className="score-label">/10</span>
                                    </div>
                                </div>
                                <div className="score-info">
                                    <h3>{getDifficultyLabel(difficultyData.level)}</h3>
                                    <p>Overall complexity score</p>
                                </div>
                            </div>

                            <div className="difficulty-factors">
                                <h4>Complexity Factors</h4>
                                {difficultyData.factors.map((factor, index) => (
                                    <div key={index} className="factor-item">
                                        <div className="factor-header">
                                            <span className="factor-name">
                                                {factor.factor.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <span className="factor-score">{factor.score}/10</span>
                                        </div>
                                        <div className="factor-bar">
                                            <div 
                                                className="factor-progress" 
                                                style={{ 
                                                    width: `${factor.score * 10}%`,
                                                    backgroundColor: getDifficultyColor(factor.score)
                                                }}
                                            ></div>
                                        </div>
                                        <div className="factor-weight">
                                            Weight: {(factor.weight * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {difficultyData.autoCategory && (
                                <div className="auto-categorization">
                                    <h4>Smart Categorization</h4>
                                    <div className="category-info">
                                        <div className="category-item">
                                            <span className="category-label">Primary Category:</span>
                                            <span className="category-value">{difficultyData.autoCategory.primary}</span>
                                        </div>
                                        {difficultyData.autoCategory.secondary && (
                                            <div className="category-item">
                                                <span className="category-label">Secondary Category:</span>
                                                <span className="category-value">{difficultyData.autoCategory.secondary}</span>
                                            </div>
                                        )}
                                        <div className="category-item">
                                            <span className="category-label">Confidence:</span>
                                            <span className="category-value">{difficultyData.autoCategory.confidence}%</span>
                                        </div>
                                        {difficultyData.autoCategory.keywords.length > 0 && (
                                            <div className="category-keywords">
                                                <span className="category-label">Detected Keywords:</span>
                                                <div className="keywords-list">
                                                    {difficultyData.autoCategory.keywords.map((keyword, index) => (
                                                        <span key={index} className="keyword-tag">{keyword}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'time' && timeData && (
                        <div className="time-estimation">
                            <div className="time-overview">
                                <div className="time-card">
                                    <FaClock className="time-icon" />
                                    <div className="time-info">
                                        <h3>{timeData.estimatedHours}h</h3>
                                        <p>Estimated Hours</p>
                                    </div>
                                </div>
                                <div className="time-card">
                                    <FaCalendarAlt className="time-icon" />
                                    <div className="time-info">
                                        <h3>{timeData.estimatedDays}d</h3>
                                        <p>Estimated Days</p>
                                    </div>
                                </div>
                                <div className="time-card">
                                    <FaChartLine className="time-icon" />
                                    <div className="time-info">
                                        <h3>{timeData.confidence}%</h3>
                                        <p>Confidence</p>
                                    </div>
                                </div>
                            </div>

                            <div className="time-breakdown">
                                <h4>Time Breakdown</h4>
                                {timeData.breakdown.map((phase, index) => (
                                    <div key={index} className="phase-item">
                                        <div className="phase-header">
                                            <span className="phase-name">{phase.phase}</span>
                                            <span className="phase-hours">{phase.hours.toFixed(1)}h</span>
                                        </div>
                                        <div className="phase-bar">
                                            <div 
                                                className="phase-progress" 
                                                style={{ width: `${phase.percentage}%` }}
                                            ></div>
                                        </div>
                                        <div className="phase-percentage">{phase.percentage}%</div>
                                    </div>
                                ))}
                            </div>

                            <div className="estimation-factors">
                                <h4>Estimation Factors</h4>
                                <div className="factors-grid">
                                    <div className="factor-card">
                                        <span className="factor-label">Difficulty Multiplier</span>
                                        <span className="factor-value">{timeData.factors.difficultyMultiplier.toFixed(1)}x</span>
                                    </div>
                                    <div className="factor-card">
                                        <span className="factor-label">Description Length</span>
                                        <span className="factor-value">{timeData.factors.descriptionLength} chars</span>
                                    </div>
                                    <div className="factor-card">
                                        <span className="factor-label">Scope Keywords</span>
                                        <span className="factor-value">{timeData.factors.scopeKeywords} found</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'insights' && (
                        <div className="smart-insights">
                            <div className="insights-header">
                                <FaLightbulb className="insights-icon" />
                                <h3>AI-Powered Insights</h3>
                            </div>

                            <div className="insights-grid">
                                <div className="insight-card">
                                    <FaUsers className="insight-icon" />
                                    <h4>Recommended Freelancers</h4>
                                    <p>Based on task complexity and skill requirements</p>
                                    <button className="insight-btn">View Matches</button>
                                </div>

                                <div className="insight-card">
                                    <FaDollarSign className="insight-icon" />
                                    <h4>Budget Optimization</h4>
                                    <p>Smart pricing suggestions based on complexity</p>
                                    <button className="insight-btn">Get Suggestions</button>
                                </div>

                                <div className="insight-card">
                                    <FaChartBar className="insight-icon" />
                                    <h4>Market Analysis</h4>
                                    <p>Compare with similar tasks in the market</p>
                                    <button className="insight-btn">View Trends</button>
                                </div>

                                <div className="insight-card">
                                    <FaStar className="insight-icon" />
                                    <h4>Success Predictors</h4>
                                    <p>Factors that increase completion success</p>
                                    <button className="insight-btn">Learn More</button>
                                </div>
                            </div>

                            <div className="insights-recommendations">
                                <h4>Smart Recommendations</h4>
                                <ul className="recommendations-list">
                                    <li>Consider breaking down complex tasks into smaller milestones</li>
                                    <li>Add detailed requirements to improve time estimation accuracy</li>
                                    <li>Include specific technical requirements for better freelancer matching</li>
                                    <li>Set realistic deadlines based on task complexity</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskAnalytics; 