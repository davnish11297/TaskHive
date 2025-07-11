import React from 'react';
import '../Home.css';
import '../Profile.css';
import { FaUserCircle, FaStar, FaMapMarkerAlt, FaDollarSign, FaUserEdit, FaEnvelope, FaTasks, FaCheckCircle, FaGavel, FaSyncAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '../UserProfileContext';

const Profile = () => {
  const { user, loading, error, refreshProfile } = useUserProfile();
  const navigate = useNavigate();

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (error) return <div className="profile-error">{error}</div>;
  if (!user) return <div className="profile-error">No user data found.</div>;

  // Example stats (replace with real data if available)
  const totalTasks = user.tasks ? user.tasks.length : 0;
  const completedTasks = user.tasks ? user.tasks.filter(t => t.status === 'COMPLETED').length : 0;
  // Optionally, you can pass activeBids as a prop or fetch it from context
  const activeBids = user.activeBids || 0;

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Profile image logic
  let profilePic = user.profilePicture || '/default-avatar.png';
  if (profilePic && !profilePic.startsWith('http') && profilePic !== '/default-avatar.png') {
    profilePic = API_URL + profilePic;
  }

  return (
    <div className="profile-bg">
      <div className="profile-main">
        {/* Left: Avatar, Name, Role, Edit */}
        <div className="profile-card profile-card-left">
          <div className="profile-avatar-wrapper">
            {user.profilePicture ? (
              <img src={profilePic} alt="Profile" className="profile-avatar" />
            ) : (
              <FaUserCircle className="profile-avatar default" />
            )}
          </div>
          <h2 className="profile-name" style={{ marginTop: 16 }}>{user.name || user.email}</h2>
          <span className={`user-role-badge ${user.role === 'task_poster' ? 'poster' : 'freelancer'}`}>{user.role === 'task_poster' ? 'Task Poster' : 'Freelancer'}</span>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="profile-edit-btn" onClick={() => navigate('/profile/edit')}>
              <FaUserEdit style={{ marginRight: 6 }} /> Edit Profile
            </button>
            <button 
              className="profile-edit-btn" 
              onClick={refreshProfile}
              style={{ background: '#f3f8ff', color: '#2563eb', border: '1px solid #e0e7ef' }}
            >
              <FaSyncAlt style={{ marginRight: 6 }} /> Refresh
            </button>
          </div>
          {/* Stats Section */}
          <div className="profile-stats-flex" style={{ marginTop: 32, width: '100%', justifyContent: 'center', gap: 24 }}>
            <div className="profile-stat" style={{ background: '#f0f9ff', borderRadius: 12, padding: 16, minWidth: 90, textAlign: 'center' }}>
              <FaTasks color="#38bdf8" size={22} style={{ marginBottom: 4 }} />
              <div className="profile-stat-value" style={{ fontWeight: 700, fontSize: 20 }}>{totalTasks}</div>
              <div className="profile-stat-label" style={{ color: '#38bdf8' }}>Tasks</div>
            </div>
            <div className="profile-stat" style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, minWidth: 90, textAlign: 'center' }}>
              <FaCheckCircle color="#22c55e" size={22} style={{ marginBottom: 4 }} />
              <div className="profile-stat-value" style={{ fontWeight: 700, fontSize: 20 }}>{completedTasks}</div>
              <div className="profile-stat-label" style={{ color: '#22c55e' }}>Completed</div>
            </div>
            <div className="profile-stat" style={{ background: '#fef9c3', borderRadius: 12, padding: 16, minWidth: 90, textAlign: 'center' }}>
              <FaGavel color="#facc15" size={22} style={{ marginBottom: 4 }} />
              <div className="profile-stat-value" style={{ fontWeight: 700, fontSize: 20 }}>{activeBids}</div>
              <div className="profile-stat-label" style={{ color: '#facc15' }}>Active Bids</div>
            </div>
          </div>
        </div>
        {/* Right: Details */}
        <div className="profile-card profile-card-right">
          <div className="profile-info-card-modern">
            <h2 className="profile-info-title" style={{ color: '#2563eb', marginBottom: 18 }}>Profile Details</h2>
            <div className="profile-info-row-flex">
              <span className="profile-info-label"><FaEnvelope style={{ marginRight: 8, color: '#2563eb' }} />Email:</span>
              <span className="profile-info-value">{user.email}</span>
            </div>
            {user.bio && (
              <div className="profile-info-row-flex">
                <span className="profile-info-label"><FaUserCircle style={{ marginRight: 8, color: '#a21caf' }} />Bio:</span>
                <span className="profile-info-value">{user.bio}</span>
              </div>
            )}
            {user.location && (
              <div className="profile-info-row-flex">
                <span className="profile-info-label"><FaMapMarkerAlt style={{ marginRight: 8, color: '#f43f5e' }} />Location:</span>
                <span className="profile-info-value">{user.location}</span>
              </div>
            )}
            {user.hourlyRate && (
              <div className="profile-info-row-flex">
                <span className="profile-info-label"><FaDollarSign style={{ marginRight: 8, color: '#16a34a' }} />Hourly Rate:</span>
                <span className="profile-info-value">${user.hourlyRate}/hr</span>
              </div>
            )}
            {user.skills && user.skills.length > 0 && (
              <div className="profile-info-row-flex">
                <span className="profile-info-label"><FaStar style={{ marginRight: 8, color: '#f59e42' }} />Skills:</span>
                <span className="profile-info-value">{Array.isArray(user.skills) ? user.skills.join(', ') : user.skills}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;