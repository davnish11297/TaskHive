import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from './config/api';

const UserProfileContext = createContext();

export function UserProfileProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching profile with token:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('✅ Profile fetched successfully:', res.data);
      setUser(res.data);
    } catch (err) {
      console.error('❌ Error fetching profile:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile on mount only if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  // Update user profile in context
  const updateUser = (newUser) => {
    setUser(newUser);
  };

  // Refresh profile function
  const refreshProfile = () => {
    fetchProfile();
  };

  // Login function to trigger profile fetch
  const login = () => {
    fetchProfile();
  };

  return (
    <UserProfileContext.Provider value={{ user, setUser: updateUser, loading, error, refreshProfile, login }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
} 