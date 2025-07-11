import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import BrowseTasks from './pages/BrowseTasks';
import MyBids from './pages/MyBids';
import MyTasks from './pages/MyTasks';
import PostTask from './pages/PostTask';
import EditProfile from './pages/EditProfile';
import Recommendations from './pages/Recommendations';
import TaskFeed from './pages/TaskFeed';
import SmartFeatures from './pages/SmartFeatures';
import Calendar from './pages/Calendar';
import { UserProfileProvider } from './UserProfileContext';
import OtherUserProfile from './pages/OtherUserProfile';
import OnboardingTour from './components/OnboardingTour';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };

    window.addEventListener('storage', checkAuth); // Listen for storage changes

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  return (
    <>
      <OnboardingTour />
      <UserProfileProvider>
        <Router>
          {isAuthenticated && <Navbar setIsAuthenticated={setIsAuthenticated} />}
          <Routes>
            <Route path="/" element={<Navigate to={isAuthenticated ? "/home" : "/login"} />} />
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/profile/edit" element={isAuthenticated ? <EditProfile /> : <Navigate to="/login" />} />
            <Route path="/tasks" element={isAuthenticated ? <BrowseTasks /> : <Navigate to="/login" />} />
            <Route path="/tasks/create" element={isAuthenticated ? <PostTask /> : <Navigate to="/login" />} />
            <Route path="/my-bids" element={isAuthenticated ? <MyBids /> : <Navigate to="/login" />} />
            <Route path="/my-tasks" element={isAuthenticated ? <MyTasks /> : <Navigate to="/login" />} />
            <Route path="/recommendations" element={isAuthenticated ? <Recommendations /> : <Navigate to="/login" />} />
            <Route path="/task-feed" element={isAuthenticated ? <TaskFeed /> : <Navigate to="/login" />} />
            <Route path="/smart-features" element={isAuthenticated ? <SmartFeatures /> : <Navigate to="/login" />} />
            <Route path="/calendar" element={isAuthenticated ? <Calendar /> : <Navigate to="/login" />} />
            <Route path="/user/:id" element={<OtherUserProfile />} />
            <Route path="*" element={<h2>404 - Page Not Found</h2>} /> {/* Catch-all route */}
          </Routes>
        </Router>
      </UserProfileProvider>
    </>
  );
};

export default App;