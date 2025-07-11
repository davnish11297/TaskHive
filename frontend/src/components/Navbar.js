import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPlusCircle, FaSearch, FaUserCircle, FaLightbulb, FaBrain, FaBars, FaTimes, FaCaretDown } from 'react-icons/fa';
import '../Home.css';
import NotificationsDropdown from './NotificationsDropdown';
import { jwtDecode } from 'jwt-decode';
import { useUserProfile } from '../UserProfileContext';

const Navbar = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useUserProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFeaturesDropdownOpen, setIsFeaturesDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  let userRole = null;
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.role;
    } catch {}
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    if (setUser) setUser(null);
    if (setIsAuthenticated) setIsAuthenticated(false);
    navigate('/login');
  };

  const primaryNavLinks = [
    { label: 'Dashboard', path: '/home', icon: <FaSearch /> },
    { label: 'Browse Tasks', path: '/tasks' },
    ...(userRole === 'task_poster' ? [{ label: 'Post Task', path: '/tasks/create', icon: <FaPlusCircle /> }] : []),
  ];

  const featuresNavLinks = [
    { label: 'Recommendations', path: '/recommendations', icon: <FaLightbulb /> },
    { label: 'Smart Features', path: '/smart-features', icon: <FaBrain /> },
  ];

  const userNavLinks = [
    { label: 'My Tasks', path: '/my-tasks' },
    { label: 'My Bids', path: '/my-bids' },
    { label: 'Profile', path: '/profile' },
  ];

  // Profile image logic
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  let profilePic = user && user.profilePicture ? user.profilePicture : '/default-avatar.png';
  if (profilePic && !profilePic.startsWith('http') && profilePic !== '/default-avatar.png') {
    profilePic = API_URL + profilePic;
  }

  const isActive = (path) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFeaturesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="dashboard-navbar">
      <div className="dashboard-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
        <img src="/taskhive-logo.png" alt="TaskHive Logo" className="dashboard-logo-img" />
        <span className="dashboard-logo-text">TaskHive</span>
      </div>

      {/* Desktop Navigation */}
      <div className="dashboard-nav-links desktop-nav">
        {/* Primary Navigation */}
        {primaryNavLinks.map((link) => (
          <button
            key={link.label}
            className={`dashboard-nav-btn${isActive(link.path) ? ' active' : ''}`}
            onClick={() => navigate(link.path)}
          >
            {link.icon && <span style={{ marginRight: 6 }}>{link.icon}</span>}
            {link.label}
          </button>
        ))}

        {/* Features Dropdown */}
        <div className="nav-dropdown" ref={dropdownRef}>
          <button
            className={`dashboard-nav-btn dropdown-toggle${isFeaturesDropdownOpen ? ' active' : ''}`}
            onClick={() => setIsFeaturesDropdownOpen(!isFeaturesDropdownOpen)}
          >
            <FaLightbulb style={{ marginRight: 6 }} />
            Features
            <FaCaretDown style={{ marginLeft: 4, fontSize: '12px' }} />
          </button>
          {isFeaturesDropdownOpen && (
            <div className="dropdown-menu">
              {featuresNavLinks.map((link) => (
                <button
                  key={link.label}
                  className={`dropdown-item${isActive(link.path) ? ' active' : ''}`}
                  onClick={() => {
                    navigate(link.path);
                    setIsFeaturesDropdownOpen(false);
                  }}
                >
                  {link.icon && <span style={{ marginRight: 8 }}>{link.icon}</span>}
                  {link.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Navigation */}
        {userNavLinks.map((link) => (
          <button
            key={link.label}
            className={`dashboard-nav-btn${isActive(link.path) ? ' active' : ''}`}
            onClick={() => navigate(link.path)}
          >
            {link.icon && <span style={{ marginRight: 6 }}>{link.icon}</span>}
            {link.label}
          </button>
        ))}
      </div>

      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Right Side Items */}
      <div className="navbar-right navbar-icons-flex">
        <NotificationsDropdown />
        <div className="dashboard-profile-icon" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          {user && user.profilePicture ? (
            <img src={profilePic} alt="Profile" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e0e7ef' }} />
          ) : (
            <FaUserCircle size={32} />
          )}
        </div>
        <button className="dashboard-logout-btn" onClick={handleLogout} style={{ marginLeft: 18, background: '#fff', border: '1px solid #e0e7ef', borderRadius: 8, padding: '7px 18px', fontWeight: 500, color: '#1cb98a', cursor: 'pointer', transition: 'background 0.15s, color 0.15s' }}>Logout</button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-menu">
          <div className="mobile-nav-section">
            <h4>Main</h4>
            {primaryNavLinks.map((link) => (
              <button
                key={link.label}
                className={`mobile-nav-item${isActive(link.path) ? ' active' : ''}`}
                onClick={() => {
                  navigate(link.path);
                  setIsMobileMenuOpen(false);
                }}
              >
                {link.icon && <span style={{ marginRight: 8 }}>{link.icon}</span>}
                {link.label}
              </button>
            ))}
          </div>

          <div className="mobile-nav-section">
            <h4>Features</h4>
            {featuresNavLinks.map((link) => (
              <button
                key={link.label}
                className={`mobile-nav-item${isActive(link.path) ? ' active' : ''}`}
                onClick={() => {
                  navigate(link.path);
                  setIsMobileMenuOpen(false);
                }}
              >
                {link.icon && <span style={{ marginRight: 8 }}>{link.icon}</span>}
                {link.label}
              </button>
            ))}
          </div>

          <div className="mobile-nav-section">
            <h4>Account</h4>
            {userNavLinks.map((link) => (
              <button
                key={link.label}
                className={`mobile-nav-item${isActive(link.path) ? ' active' : ''}`}
                onClick={() => {
                  navigate(link.path);
                  setIsMobileMenuOpen(false);
                }}
              >
                {link.icon && <span style={{ marginRight: 8 }}>{link.icon}</span>}
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 