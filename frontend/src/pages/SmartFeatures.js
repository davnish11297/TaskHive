import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBrain, FaClock, FaChartLine, FaLightbulb, FaRocket, FaUsers, FaBullseye, FaStar, FaArrowRight } from 'react-icons/fa';
import TaskAnalytics from '../components/TaskAnalytics';
import PriorityBasedSuggestions from '../components/PriorityBasedSuggestions';
import './SmartFeatures.css';

const SmartFeatures = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const navigate = useNavigate();

    const features = [
        {
            icon: <FaBrain />,
            title: 'AI Difficulty Scoring',
            description: 'Automatic task complexity analysis based on technical requirements, scope, and skill needs.',
            benefits: [
                'Real-time difficulty assessment',
                'Smart categorization',
                'Skill requirement matching',
                'Complexity factor breakdown'
            ],
            color: '#667eea'
        },
        {
            icon: <FaClock />,
            title: 'Intelligent Time Estimation',
            description: 'AI-powered time predictions with confidence scores and detailed breakdowns.',
            benefits: [
                'Accurate time predictions',
                'Confidence scoring',
                'Phase-by-phase breakdown',
                'Learning from past projects'
            ],
            color: '#f59e0b'
        },
        {
            icon: <FaChartLine />,
            title: 'Priority-Based Suggestions',
            description: 'Smart task recommendations based on urgency, budget, and skill compatibility.',
            benefits: [
                'Urgency-based prioritization',
                'Budget attractiveness scoring',
                'Skill compatibility matching',
                'Market demand analysis'
            ],
            color: '#10b981'
        }
    ];

    const demoTask = {
        _id: '6870fc65d261b5986d60c172', // Real task ID from database
        title: 'E-commerce Website Development',
        description: 'Build a comprehensive e-commerce platform with React frontend, Node.js backend, MongoDB database, payment integration, user authentication, admin dashboard, and mobile responsiveness. The platform should handle inventory management, order processing, customer reviews, and analytics.',
        budget: 2500,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        category: 'web-development',
        difficulty: {
            score: 6,
            level: 'INTERMEDIATE',
            factors: [
                { factor: 'technical_complexity', weight: 0.3, score: 7 },
                { factor: 'scope_size', weight: 0.25, score: 6 },
                { factor: 'integration_requirements', weight: 0.2, score: 5 },
                { factor: 'skill_requirements', weight: 0.25, score: 6 }
            ]
        },
        timeEstimation: {
            estimatedHours: 12.5,
            estimatedDays: 2,
            confidence: 80,
            breakdown: [
                { phase: 'Planning & Analysis', hours: 2.5, percentage: 20 },
                { phase: 'Development', hours: 7.5, percentage: 60 },
                { phase: 'Testing & Review', hours: 2.5, percentage: 20 }
            ]
        },
        priority: {
            score: 7,
            level: 'HIGH',
            factors: [
                { factor: 'deadline_urgency', weight: 0.3, score: 6 },
                { factor: 'budget_attractiveness', weight: 0.25, score: 8 },
                { factor: 'task_complexity', weight: 0.2, score: 6 },
                { factor: 'category_demand', weight: 0.25, score: 7 }
            ]
        },
        autoCategory: {
            primary: 'web-development',
            secondary: 'e-commerce',
            confidence: 90,
            keywords: ['website', 'react', 'node', 'database', 'e-commerce', 'platform']
        }
    };

    return (
        <div className="smart-features-page">
            {/* Header */}
            <div className="features-header">
                <div className="header-content">
                    <h1>
                        <FaLightbulb className="header-icon" />
                        Smart Features
                    </h1>
                    <p>Experience the power of AI-driven task management and intelligent recommendations</p>
                </div>
                <div className="header-actions">
                    <button 
                        className="demo-btn"
                        onClick={() => {
                            setSelectedTaskId(demoTask._id);
                            setShowAnalytics(true);
                        }}
                    >
                        <FaRocket />
                        Try Demo
                    </button>
                    <button 
                        className="post-task-btn"
                        onClick={() => navigate('/tasks/create')}
                    >
                        Post a Task
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="features-nav">
                <button 
                    className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button 
                    className={`nav-tab ${activeTab === 'difficulty' ? 'active' : ''}`}
                    onClick={() => setActiveTab('difficulty')}
                >
                    Difficulty Scoring
                </button>
                <button 
                    className={`nav-tab ${activeTab === 'time' ? 'active' : ''}`}
                    onClick={() => setActiveTab('time')}
                >
                    Time Estimation
                </button>
                <button 
                    className={`nav-tab ${activeTab === 'suggestions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('suggestions')}
                >
                    Smart Suggestions
                </button>
            </div>

            {/* Content */}
            <div className="features-content">
                {activeTab === 'overview' && (
                    <div className="overview-section">
                        <div className="features-grid">
                            {features.map((feature, index) => (
                                <div key={index} className="feature-card" style={{ borderTopColor: feature.color }}>
                                    <div className="feature-icon" style={{ color: feature.color }}>
                                        {feature.icon}
                                    </div>
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                    <div className="feature-benefits">
                                        <h4>Key Benefits:</h4>
                                        <ul>
                                            {feature.benefits.map((benefit, idx) => (
                                                <li key={idx}>{benefit}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="demo-section">
                            <h2>See It In Action</h2>
                            <p>Experience our smart features with a demo task</p>
                            <div className="demo-task-card">
                                <div className="demo-task-header">
                                    <h3>{demoTask.title}</h3>
                                    <div className="demo-badges">
                                        <span className="demo-badge difficulty" style={{ backgroundColor: '#f97316' }}>
                                            {demoTask.difficulty.level}
                                        </span>
                                        <span className="demo-badge priority" style={{ backgroundColor: '#f59e0b' }}>
                                            {demoTask.priority.level}
                                        </span>
                                        <span className="demo-badge time">
                                            {demoTask.timeEstimation.estimatedDays} days
                                        </span>
                                    </div>
                                </div>
                                <p className="demo-description">{demoTask.description}</p>
                                <div className="demo-metrics">
                                    <div className="demo-metric">
                                        <span className="metric-label">Difficulty Score</span>
                                        <span className="metric-value">{demoTask.difficulty.score}/10</span>
                                    </div>
                                    <div className="demo-metric">
                                        <span className="metric-label">Time Estimate</span>
                                        <span className="metric-value">{demoTask.timeEstimation.estimatedHours}h</span>
                                    </div>
                                    <div className="demo-metric">
                                        <span className="metric-label">Priority Score</span>
                                        <span className="metric-value">{demoTask.priority.score}/10</span>
                                    </div>
                                </div>
                                <button 
                                    className="analyze-btn"
                                    onClick={() => {
                                        setSelectedTaskId(demoTask._id);
                                        setShowAnalytics(true);
                                    }}
                                >
                                    <FaBullseye />
                                    Analyze This Task
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'difficulty' && (
                    <div className="difficulty-section">
                        <div className="section-header">
                            <h2>
                                <FaBrain />
                                AI Difficulty Scoring
                            </h2>
                            <p>Our AI analyzes task complexity based on multiple factors to provide accurate difficulty assessments</p>
                        </div>

                        <div className="difficulty-explanation">
                            <div className="explanation-card">
                                <h3>How It Works</h3>
                                <div className="factors-grid">
                                    <div className="factor-item">
                                        <div className="factor-icon">🔧</div>
                                        <h4>Technical Complexity</h4>
                                        <p>Analyzes technical requirements, APIs, databases, and advanced concepts</p>
                                        <div className="factor-weight">Weight: 30%</div>
                                    </div>
                                    <div className="factor-item">
                                        <div className="factor-icon">📏</div>
                                        <h4>Scope Size</h4>
                                        <p>Evaluates project scope, features, and overall complexity</p>
                                        <div className="factor-weight">Weight: 25%</div>
                                    </div>
                                    <div className="factor-item">
                                        <div className="factor-icon">🔗</div>
                                        <h4>Integration Requirements</h4>
                                        <p>Assesses third-party integrations and external dependencies</p>
                                        <div className="factor-weight">Weight: 20%</div>
                                    </div>
                                    <div className="factor-item">
                                        <div className="factor-icon">👨‍💻</div>
                                        <h4>Skill Requirements</h4>
                                        <p>Evaluates required expertise level and specialized skills</p>
                                        <div className="factor-weight">Weight: 25%</div>
                                    </div>
                                </div>
                            </div>

                            <div className="difficulty-levels">
                                <h3>Difficulty Levels</h3>
                                <div className="levels-grid">
                                    <div className="level-card beginner">
                                        <div className="level-header">
                                            <span className="level-badge">BEGINNER</span>
                                            <span className="level-score">1-3</span>
                                        </div>
                                        <p>Simple tasks suitable for newcomers</p>
                                    </div>
                                    <div className="level-card intermediate">
                                        <div className="level-header">
                                            <span className="level-badge">INTERMEDIATE</span>
                                            <span className="level-score">4-6</span>
                                        </div>
                                        <p>Moderate complexity requiring experience</p>
                                    </div>
                                    <div className="level-card advanced">
                                        <div className="level-header">
                                            <span className="level-badge">ADVANCED</span>
                                            <span className="level-score">7-8</span>
                                        </div>
                                        <p>Complex tasks for experienced professionals</p>
                                    </div>
                                    <div className="level-card expert">
                                        <div className="level-header">
                                            <span className="level-badge">EXPERT</span>
                                            <span className="level-score">9-10</span>
                                        </div>
                                        <p>Highly specialized and complex projects</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'time' && (
                    <div className="time-section">
                        <div className="section-header">
                            <h2>
                                <FaClock />
                                Intelligent Time Estimation
                            </h2>
                            <p>AI-powered time predictions with confidence scores and detailed breakdowns</p>
                        </div>

                        <div className="time-explanation">
                            <div className="explanation-card">
                                <h3>Estimation Factors</h3>
                                <div className="factors-grid">
                                    <div className="factor-item">
                                        <div className="factor-icon">📝</div>
                                        <h4>Description Quality</h4>
                                        <p>Detailed descriptions lead to more accurate estimates</p>
                                    </div>
                                    <div className="factor-item">
                                        <div className="factor-icon">🎯</div>
                                        <h4>Task Complexity</h4>
                                        <p>Difficulty score directly impacts time requirements</p>
                                    </div>
                                    <div className="factor-item">
                                        <div className="factor-icon">📊</div>
                                        <h4>Scope Keywords</h4>
                                        <p>Keywords like "comprehensive" or "full" affect estimates</p>
                                    </div>
                                    <div className="factor-item">
                                        <div className="factor-icon">📈</div>
                                        <h4>Historical Data</h4>
                                        <p>Learning from similar completed tasks</p>
                                    </div>
                                </div>
                            </div>

                            <div className="time-breakdown-demo">
                                <h3>Sample Time Breakdown</h3>
                                <div className="breakdown-chart">
                                    <div className="breakdown-item">
                                        <div className="breakdown-label">Planning & Analysis</div>
                                        <div className="breakdown-bar">
                                            <div className="breakdown-fill" style={{ width: '20%' }}></div>
                                        </div>
                                        <div className="breakdown-value">20% (24h)</div>
                                    </div>
                                    <div className="breakdown-item">
                                        <div className="breakdown-label">Development</div>
                                        <div className="breakdown-bar">
                                            <div className="breakdown-fill" style={{ width: '60%' }}></div>
                                        </div>
                                        <div className="breakdown-value">60% (72h)</div>
                                    </div>
                                    <div className="breakdown-item">
                                        <div className="breakdown-label">Testing & Review</div>
                                        <div className="breakdown-bar">
                                            <div className="breakdown-fill" style={{ width: '20%' }}></div>
                                        </div>
                                        <div className="breakdown-value">20% (24h)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'suggestions' && (
                    <div className="suggestions-section">
                        <div className="section-header">
                            <h2>
                                <FaChartLine />
                                Priority-Based Suggestions
                            </h2>
                            <p>Smart task recommendations based on urgency, budget, and skill compatibility</p>
                        </div>

                        <PriorityBasedSuggestions />
                    </div>
                )}
            </div>

            {/* Task Analytics Modal */}
            {showAnalytics && selectedTaskId && (
                <TaskAnalytics 
                    taskId={selectedTaskId} 
                    onClose={() => {
                        setShowAnalytics(false);
                        setSelectedTaskId(null);
                    }}
                />
            )}
        </div>
    );
};

export default SmartFeatures; 