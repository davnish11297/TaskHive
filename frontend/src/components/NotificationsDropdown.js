import React, { useEffect, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import axios from 'axios';
import './NotificationsDropdown.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const NotificationsDropdown = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data);
      } catch (err) {
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      // Optionally show error
    }
  };

  return (
    <div className="notif-dropdown-root">
      <button className="notif-bell-btn" onClick={() => setOpen(o => !o)}>
        <FaBell size={22} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-title">Notifications</div>
          {loading ? (
            <div className="notif-loading">Loading...</div>
          ) : error ? (
            <div className="notif-error">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty">No notifications</div>
          ) : (
            <ul className="notif-list">
              {notifications.map(n => (
                <li key={n._id} className={n.read ? 'notif-read' : 'notif-unread'}
                    onClick={() => !n.read && handleMarkAsRead(n._id)}
                    style={{ cursor: n.read ? 'default' : 'pointer', opacity: n.read ? 0.7 : 1 }}>
                  <span className="notif-msg">{n.message}</span>
                  <span className="notif-date">{new Date(n.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown; 