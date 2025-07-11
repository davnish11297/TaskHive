import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Home.css';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useUserProfile } from '../UserProfileContext';
import { FaBrain, FaClock, FaChartLine, FaLightbulb, FaInfoCircle } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const PostTask = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    category: '',
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showEstimations, setShowEstimations] = useState(false);
  const [estimations, setEstimations] = useState(null);
  const navigate = useNavigate();
  const { setUser } = useUserProfile();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.role !== 'task_poster') {
          // Not a poster, redirect or show message
          navigate('/tasks');
        }
      } catch {}
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Auto-calculate estimations when description changes
    if (name === 'description' && value.length > 10) {
      calculateEstimations({ ...form, [name]: value });
    }
  };

  const calculateEstimations = (currentForm) => {
    if (!currentForm.description || currentForm.description.length < 10) return;

    // Simple estimation logic (this would be more sophisticated in a real app)
    const descriptionLength = currentForm.description.length;
    const hasTechnicalTerms = /api|database|algorithm|optimization|security|testing|integration|scalability/i.test(currentForm.description);
    const hasComplexTerms = /large|comprehensive|complete|full|extensive|multiple|system/i.test(currentForm.description);
    
    let difficultyScore = 5; // Base score
    if (hasTechnicalTerms) difficultyScore += 2;
    if (hasComplexTerms) difficultyScore += 1;
    if (descriptionLength > 500) difficultyScore += 1;
    if (descriptionLength > 1000) difficultyScore += 1;
    
    difficultyScore = Math.min(10, Math.max(1, difficultyScore));
    
    let estimatedHours = 8; // Base hours
    estimatedHours *= (difficultyScore / 5);
    if (descriptionLength > 500) estimatedHours *= 1.2;
    if (hasComplexTerms) estimatedHours *= 1.3;
    
    const estimatedDays = Math.ceil(estimatedHours / 8);
    const confidence = Math.min(90, Math.max(50, 
      descriptionLength > 200 ? 80 : 
      descriptionLength > 100 ? 70 : 60
    ));

    setEstimations({
      difficulty: {
        score: difficultyScore,
        level: difficultyScore <= 3 ? 'BEGINNER' : 
               difficultyScore <= 6 ? 'INTERMEDIATE' : 
               difficultyScore <= 8 ? 'ADVANCED' : 'EXPERT'
      },
      timeEstimation: {
        estimatedHours: Math.round(estimatedHours * 10) / 10,
        estimatedDays: estimatedDays,
        confidence: confidence
      },
      priority: {
        score: Math.min(10, Math.max(1, 
          (currentForm.budget > 1000 ? 3 : 0) + 
          (difficultyScore <= 5 ? 2 : 0) + 
          (currentForm.deadline ? 2 : 0)
        )),
        level: 'MEDIUM'
      }
    });
    
    setShowEstimations(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const token = localStorage.getItem('token');
      const decoded = jwtDecode(token);
      const payload = {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        status: 'PENDING',
        userId: decoded.id,
      };
      await axios.post(`${API_URL}/api/tasks`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Refresh user profile to update task counts
      try {
        const profileRes = await axios.get(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(profileRes.data); // Update the user profile context
      } catch (profileErr) {
        console.error('Failed to refresh profile:', profileErr);
      }
      
      setSuccess(true);
      setForm({ title: '', description: '', budget: '', deadline: '', category: '', tags: '' });
      setEstimations(null);
      setShowEstimations(false);
      setTimeout(() => navigate('/tasks'), 1200);
    } catch (err) {
      setError('Failed to post task. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-root" style={{ background: 'linear-gradient(120deg, #f3f8ff 0%, #eaf6f2 100%)', minHeight: '100vh', paddingTop: 40 }}>
      <section className="dashboard-welcome" style={{ textAlign: 'center', marginBottom: 0 }}>
        <h1 style={{ fontWeight: 800, fontSize: 32, color: '#1a7f64', marginBottom: 6 }}>Post a New Task</h1>
        <p style={{ color: '#4b5563', fontSize: 18 }}>Describe your project and get help from top freelancers.</p>
      </section>
      
      <div className="post-task-form-container" style={{ maxWidth: 800, margin: '32px auto', background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(26,127,100,0.10)', padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* AI Estimations Panel */}
        {showEstimations && estimations && (
          <div className="estimations-panel" style={{ 
            width: '100%', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            borderRadius: 16, 
            padding: 24, 
            marginBottom: 24, 
            color: 'white' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <FaLightbulb style={{ fontSize: 24, color: '#fbbf24' }} />
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>AI-Powered Insights</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div className="estimation-card" style={{ background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FaBrain style={{ fontSize: 16 }} />
                  <span style={{ fontSize: 14, opacity: 0.9 }}>Difficulty</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    background: getDifficultyColor(estimations.difficulty.level), 
                    color: 'white', 
                    padding: '4px 12px', 
                    borderRadius: 20, 
                    fontSize: 12, 
                    fontWeight: 600 
                  }}>
                    {estimations.difficulty.level}
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{estimations.difficulty.score}/10</span>
                </div>
              </div>
              
              <div className="estimation-card" style={{ background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FaClock style={{ fontSize: 16 }} />
                  <span style={{ fontSize: 14, opacity: 0.9 }}>Time Estimate</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{estimations.timeEstimation.estimatedHours}h</span>
                  <span style={{ fontSize: 14, opacity: 0.8 }}>({estimations.timeEstimation.estimatedDays} days)</span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                  Confidence: {estimations.timeEstimation.confidence}%
                </div>
              </div>
              
              <div className="estimation-card" style={{ background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FaChartLine style={{ fontSize: 16 }} />
                  <span style={{ fontSize: 14, opacity: 0.9 }}>Priority</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    background: getPriorityColor(estimations.priority.level), 
                    color: 'white', 
                    padding: '4px 12px', 
                    borderRadius: 20, 
                    fontSize: 12, 
                    fontWeight: 600 
                  }}>
                    {estimations.priority.level}
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{estimations.priority.score}/10</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <form className="task-form" onSubmit={handleSubmit} style={{ width: '100%', background: '#f8fafc', borderRadius: 14, boxShadow: '0 1px 8px rgba(44,62,80,0.04)', padding: '24px 18px 18px 18px', minHeight: 420, margin: 0 }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontWeight: 700, fontSize: 22, color: '#2563eb', marginBottom: 18, textAlign: 'center' }}>Task Details</h2>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter a clear, descriptive title for your task"
                required
                className="modern-input"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
                Description *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Provide detailed requirements, specifications, and any important context for freelancers"
                required
                className="modern-input"
                style={{ minHeight: 120, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                <FaInfoCircle />
                <span>Detailed descriptions help AI provide better estimates and attract qualified freelancers</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
                  Budget (USD)
                </label>
                <input
                  type="number"
                  name="budget"
                  value={form.budget}
                  onChange={handleChange}
                  placeholder="Enter your budget"
                  min="0"
                  className="modern-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
                  Deadline *
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  required
                  className="modern-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
                  Category *
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="modern-input"
                >
                  <option value="">Select Category</option>
                  <option value="web-development">Web Development</option>
                  <option value="mobile-development">Mobile Development</option>
                  <option value="ui-ux-design">UI/UX Design</option>
                  <option value="graphic-design">Graphic Design</option>
                  <option value="content-writing">Content Writing</option>
                  <option value="data-analysis">Data Analysis</option>
                  <option value="video-editing">Video Editing</option>
                  <option value="translation">Translation</option>
                  <option value="virtual-assistant">Virtual Assistant</option>
                  <option value="research">Research</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="e.g., React, Logo, Blog, SEO"
                  className="modern-input"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="add-task-btn"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 0',
              fontSize: 18,
              fontWeight: 700,
              background: 'linear-gradient(90deg, #1cb98a 0%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(44, 62, 80, 0.08)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginTop: 8
            }}
          >
            {loading ? 'Posting...' : 'Post Task'}
          </button>

          {success && (
            <div style={{ color: '#22c55e', marginTop: 18, textAlign: 'center', fontWeight: 600, fontSize: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 32, lineHeight: 1 }}>✔️</span>
              Task posted! Redirecting...
            </div>
          )}
          {error && <div style={{ color: '#ef4444', marginTop: 14, textAlign: 'center', fontWeight: 500 }}>{error}</div>}
        </form>
      </div>

      <style>{`
        .modern-input {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #e0e7ef;
          border-radius: 10px;
          font-size: 1rem;
          margin-bottom: 0;
          background: #f8fafc;
          transition: border 0.2s, box-shadow 0.2s;
          outline: none;
          box-sizing: border-box;
        }
        .modern-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
          background: #fff;
        }
        .add-task-btn:hover:not(:disabled) {
          background: linear-gradient(90deg, #2563eb 0%, #1cb98a 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(44, 62, 80, 0.15);
        }
        .estimation-card {
          transition: all 0.2s;
        }
        .estimation-card:hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,0.15) !important;
        }
        @media (max-width: 768px) {
          .post-task-form-container {
            margin: 16px;
            padding: 24px 20px;
          }
          .estimations-panel {
            padding: 20px !important;
          }
          .estimations-panel > div:last-child {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .task-form > div:first-child > div:nth-child(3),
          .task-form > div:first-child > div:nth-child(4) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PostTask; 