import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import '../Home.css';
import { FaEye } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const MyBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchBids = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const decoded = jwtDecode(token);
        setUserId(decoded.id || decoded.userId);
        // 1. Fetch all tasks
        const tasksRes = await axios.get(`${API_URL}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tasks = tasksRes.data.tasks || [];
        // 2. For each task, fetch its bids
        const allBids = [];
        await Promise.all(tasks.map(async (task) => {
          try {
            const bidsRes = await axios.get(`${API_URL}/api/tasks/${task._id}/bids`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const taskBids = bidsRes.data || [];
            // 3. Filter for bids by the current user
            taskBids.forEach(bid => {
              if (bid.bidder && (bid.bidder._id === decoded.id || bid.bidder._id === decoded.userId)) {
                allBids.push({ ...bid, task });
              }
            });
          } catch (err) {
            // Ignore errors for tasks with no bids
          }
        }));
        setBids(allBids);
      } catch (err) {
        setError('Failed to fetch bids.');
      } finally {
        setLoading(false);
      }
    };
    fetchBids();
  }, []);

  return (
    <div className="browse-root">
      <section className="browse-header">
        <h1>My Bids</h1>
        <p>View and manage all your bids on tasks.</p>
      </section>
      <section className="browse-tasks-grid">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : bids.length === 0 ? (
          <div className="dashboard-no-tasks" style={{width: '100%'}}>
            You have not placed any bids yet.
          </div>
        ) : (
          <div style={{width: '100%'}}>
            <table className="bids-table" style={{width: '100%', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24, borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{textAlign: 'left', background: '#f6fafd'}}>
                  <th style={{padding: '12px 8px'}}>Task</th>
                  <th style={{padding: '12px 8px'}}>Bid Amount</th>
                  <th style={{padding: '12px 8px'}}>Status</th>
                  <th style={{padding: '12px 8px'}}>Date</th>
                  <th style={{padding: '12px 8px'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bids.map((bid, i) => (
                  <tr key={bid._id || i} style={{borderTop: '1px solid #f0f0f0'}}>
                    <td style={{padding: '12px 8px'}}>{bid.task.title}</td>
                    <td style={{padding: '12px 8px'}}>${bid.bidAmount}</td>
                    <td style={{padding: '12px 8px', textTransform: 'capitalize'}}>{bid.status || 'Pending'}</td>
                    <td style={{padding: '12px 8px'}}>{bid.createdAt ? new Date(bid.createdAt).toLocaleDateString() : ''}</td>
                    <td style={{padding: '12px 8px'}}>
                      <a href={`/tasks`} className="browse-view-details" style={{textDecoration: 'none', display: 'inline-flex', alignItems: 'center'}}>
                        <FaEye style={{marginRight: 6}} /> View Task
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default MyBids; 