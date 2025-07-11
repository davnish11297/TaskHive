import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Home.css';
import '../Profile.css';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '../UserProfileContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function Toast({ message, onClose }) {
  return (
    <div className="custom-toast success" onClick={onClose}>
      {message}
    </div>
  );
}

const EditProfile = () => {
  const [form, setForm] = useState({
    name: '',
    bio: '',
    location: '',
    hourlyRate: '',
    skills: '',
    profilePicture: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState('');
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUserProfile();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForm({
          name: res.data.name || '',
          bio: res.data.bio || '',
          location: res.data.location || '',
          hourlyRate: res.data.hourlyRate || '',
          skills: res.data.skills ? res.data.skills.join(', ') : '',
          profilePicture: res.data.profilePicture || '',
        });
        // Use full URL for preview if needed
        let pic = res.data.profilePicture || '/default-avatar.png';
        if (pic && !pic.startsWith('http') && pic !== '/default-avatar.png') {
          pic = API_URL + pic;
        }
        setPreview(pic);
      } catch (err) {
        setError('Failed to load profile.');
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('profilePicture', file);
        const res = await axios.post(`${API_URL}/user/profile/upload-picture`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        setForm((prev) => ({ ...prev, profilePicture: res.data.filePath }));
      } catch (err) {
        setError('Failed to upload image.');
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const token = localStorage.getItem('token');
      // Prepare JSON body (profilePicture is now a string path)
      const payload = {
        name: form.name,
        bio: form.bio,
        location: form.location,
        hourlyRate: form.hourlyRate,
        skills: form.skills,
        profilePicture: form.profilePicture,
      };
      const res = await axios.put(`${API_URL}/user/profile`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setSuccess(true);
      setUser(res.data); // Update context for live update
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate('/profile');
      }, 1200);
    } catch (err) {
      setError('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-profile-bg">
      <h1 className="edit-profile-title">Edit Profile</h1>
      <p className="edit-profile-sub">Update your profile information</p>
      <div className="edit-profile-card animate-fade-in">
        <div className="edit-profile-avatar-wrapper">
          <label htmlFor="profilePicture" className="edit-profile-avatar-label">
            <img
              src={preview || '/default-avatar.png'}
              alt="Profile Preview"
              className="edit-profile-avatar"
            />
            <div className="edit-profile-avatar-hover">Change</div>
            <input
              id="profilePicture"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>
        </div>
        <form className="edit-profile-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="form-row">
            <div className="form-group floating-label">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="edit-input"
                autoComplete="off"
              />
              <label>Name</label>
            </div>
            <div className="form-group floating-label">
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="edit-input"
                autoComplete="off"
              />
              <label>Location</label>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group floating-label">
              <input
                type="number"
                name="hourlyRate"
                value={form.hourlyRate}
                onChange={handleChange}
                className="edit-input"
                min="0"
                step="0.01"
                autoComplete="off"
              />
              <label>Hourly Rate (USD)</label>
            </div>
            <div className="form-group floating-label">
              <input
                type="text"
                name="skills"
                value={form.skills}
                onChange={handleChange}
                className="edit-input"
                placeholder="e.g. React, Node.js, Design"
                autoComplete="off"
              />
              <label>Skills (comma-separated)</label>
            </div>
          </div>
          <div className="form-group floating-label">
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              className="edit-input"
              rows={3}
              style={{ resize: 'vertical' }}
              autoComplete="off"
            />
            <label>Bio</label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <button
            type="submit"
            className={`edit-profile-btn${loading ? ' loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
      {showToast && <Toast message="Profile updated!" onClose={() => setShowToast(false)} />}
    </div>
  );
};

export default EditProfile; 