import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPlusCircle, FaSearch, FaUserCircle, FaLightbulb, FaBrain, FaBars, FaTimes, FaCaretDown, FaCalendar, FaTasks, FaUser } from 'react-icons/fa';
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
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const accountDropdownRef = useRef(null);
  
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
  ];

  const featuresNavLinks = [
    { label: 'Calendar', path: '/calendar', icon: <FaCalendar /> },
    { label: 'Recommendations', path: '/recommendations', icon: <FaLightbulb /> },
    { label: 'Smart Features', path: '/smart-features', icon: <FaBrain /> },
  ];

  const accountNavLinks = [
    { label: 'My Tasks', path: '/my-tasks', icon: <FaTasks /> },
    { label: 'My Bids', path: '/my-bids' },
    { label: 'Profile', path: '/profile', icon: <FaUser /> },
  ];

  // Profile image logic
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  let profilePic = user && user.profilePicture ? user.profilePicture : '/default-avatar.png';
  if (profilePic && !profilePic.startsWith('http') && profilePic !== '/default-avatar.png') {
    profilePic = API_URL + profilePic;
  }

  const isActive = (path) => location.pathname === path;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFeaturesDropdownOpen(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
        setIsAccountDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="dashboard-navbar navbar">
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

        {/* Post Task Button (if task poster) */}
        {userRole === 'task_poster' && (
          <button
            className="dashboard-nav-btn post-task-btn"
            onClick={() => navigate('/tasks/create')}
          >
            <FaPlusCircle style={{ marginRight: 6 }} />
            Post Task
          </button>
        )}

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
        
        {/* Account Dropdown */}
        <div className="nav-dropdown account-dropdown" ref={accountDropdownRef}>
          <button
            className="dashboard-nav-btn dropdown-toggle account-toggle"
            onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
          >
            <div className="profile-pic-container">
              {user && user.profilePicture ? (
                <img src={profilePic} alt="Profile" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e0e7ef' }} />
              ) : (
                <FaUserCircle size={24} />
              )}
            </div>
            <FaCaretDown style={{ marginLeft: 4, fontSize: '12px' }} />
          </button>
          {isAccountDropdownOpen && (
            <div className="dropdown-menu account-menu">
              {accountNavLinks.map((link) => (
                <button
                  key={link.label}
                  className={`dropdown-item${isActive(link.path) ? ' active' : ''}`}
                  onClick={() => {
                    navigate(link.path);
                    setIsAccountDropdownOpen(false);
                  }}
                >
                  {link.icon && <span style={{ marginRight: 8 }}>{link.icon}</span>}
                  {link.label}
                </button>
              ))}
              <div className="dropdown-divider"></div>
              <button
                className="dropdown-item logout-item"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
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
            {userRole === 'task_poster' && (
              <button
                className="mobile-nav-item post-task-btn"
                onClick={() => {
                  navigate('/tasks/create');
                  setIsMobileMenuOpen(false);
                }}
              >
                <FaPlusCircle style={{ marginRight: 8 }} />
                Post Task
              </button>
            )}
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
            {accountNavLinks.map((link) => (
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
            <button
              className="mobile-nav-item logout-item"
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 