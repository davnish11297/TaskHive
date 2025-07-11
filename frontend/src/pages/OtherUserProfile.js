import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../Profile.css';
import { FaUserCircle, FaMapMarkerAlt, FaDollarSign, FaStar, FaTasks } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const OtherUserProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_URL}/user/${id}`);
        setProfile(res.data);
      } catch (err) {
        setError('Failed to load user profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (error) return <div className="profile-error">{error}</div>;
  if (!profile) return <div className="profile-error">No user data found.</div>;

  let profilePic = profile.profilePicture || '/default-avatar.png';
  if (profilePic && !profilePic.startsWith('http') && profilePic !== '/default-avatar.png') {
    profilePic = API_URL + profilePic;
  }

  return (
    <div className="profile-bg">
      <div className="profile-main">
        {/* Left: Avatar, Name, Role */}
        <div className="profile-card profile-card-left">
          <div className="profile-avatar-wrapper">
            {profile.profilePicture ? (
              <img src={profilePic} alt="Profile" className="profile-avatar" />
            ) : (
              <FaUserCircle className="profile-avatar default" />
            )}
          </div>
          <h2 className="profile-name" style={{ marginTop: 16 }}>{profile.name}</h2>
          <span className={`user-role-badge ${profile.role === 'task_poster' ? 'poster' : 'freelancer'}`}>{profile.role === 'task_poster' ? 'Task Poster' : 'Freelancer'}</span>
          <div className="profile-stats-flex" style={{ marginTop: 32, width: '100%', justifyContent: 'center', gap: 24 }}>
            <div className="profile-stat" style={{ background: '#f0f9ff', borderRadius: 12, padding: 16, minWidth: 90, textAlign: 'center' }}>
              <FaTasks color="#38bdf8" size={22} style={{ marginBottom: 4 }} />
              <div className="profile-stat-value" style={{ fontWeight: 700, fontSize: 20 }}>{profile.tasks ? profile.tasks.length : 0}</div>
              <div className="profile-stat-label" style={{ color: '#38bdf8' }}>Tasks</div>
            </div>
          </div>
        </div>
        {/* Right: Details and Tasks */}
        <div className="profile-card profile-card-right">
          <div className="profile-info-card-modern">
            <h2 className="profile-info-title" style={{ color: '#2563eb', marginBottom: 18 }}>Profile Details</h2>
            {profile.bio && (
              <div className="profile-info-row-flex">
                <span className="profile-info-label"><FaUserCircle style={{ marginRight: 8, color: '#a21caf' }} />Bio:</span>
                <span className="profile-info-value">{profile.bio}</span>
              </div>
            )}
            {profile.location && (
              <div className="profile-info-row-flex">
                <span className="profile-info-label"><FaMapMarkerAlt style={{ marginRight: 8, color: '#f43f5e' }} />Location:</span>
                <span className="profile-info-value">{profile.location}</span>
              </div>
            )}
            {profile.hourlyRate && (
              <div className="profile-info-row-flex">
                <span className="profile-info-label"><FaDollarSign style={{ marginRight: 8, color: '#16a34a' }} />Hourly Rate:</span>
                <span className="profile-info-value">${profile.hourlyRate}/hr</span>
              </div>
            )}
            {profile.skills && profile.skills.length > 0 && (
              <div className="profile-info-row-flex">
                <span className="profile-info-label"><FaStar style={{ marginRight: 8, color: '#f59e42' }} />Skills:</span>
                <span className="profile-info-value">{Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}</span>
              </div>
            )}
          </div>
          <div className="profile-info-card-modern" style={{ marginTop: 32 }}>
            <h2 className="profile-info-title" style={{ color: '#2563eb', marginBottom: 18 }}>Posted Tasks</h2>
            {profile.tasks && profile.tasks.length > 0 ? (
              <div>
                {profile.tasks.map((task) => (
                  <div key={task._id} className="dashboard-task-card" style={{ marginBottom: 18, background: '#f8fafc' }}>
                    <div className="dashboard-task-title" style={{ fontWeight: 600, fontSize: 17 }}>{task.title}</div>
                    <div className="dashboard-task-desc" style={{ margin: '8px 0', color: '#555' }}>{task.description}</div>
                    <div className="dashboard-task-tags" style={{ marginBottom: 6 }}>
                      {task.tags && Array.isArray(task.tags) && task.tags.map((tag, i) => (
                        <span className="dashboard-task-tag" key={i}>{tag}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: '#888' }}>
                      <span style={{ fontWeight: 600, color: '#22c55e' }}>{task.budget ? `$${task.budget}` : ''}</span>
                      <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#888', fontSize: 16 }}>No tasks posted yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtherUserProfile; 