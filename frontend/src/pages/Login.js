import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../src/Login.css';

const if_live = true;
const API_URL = if_live 
    ? "https://taskhive-d0c8.onrender.com" 
    : "http://localhost:5001";

const FRONT_END_URL = if_live 
? "https://taskhive-frontend-6uz2diami-davnish11297s-projects.vercel.app" 
: "http://localhost:5001";

const Login = ({ setIsAuthenticated }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('Form submitted, sending API request');

        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, formData);
            console.log(response.data)
            const { token } = response.data;
            localStorage.setItem('token', token);
            setIsAuthenticated(true);
            navigate('/home');
        } catch (error) {
            console.error("Login error", error);
            setError('Error logging in. Please try again.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
            <div className="logo-container">
                <img className="logo" src={`${window.location.origin}/taskhive-logo.png`} alt="TaskHive Logo" />
            </div>
                {/* <h2>Login to TaskHive 🐝</h2> */}
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your email"
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter your password"
                            className="input-field"
                        />
                    </div>

                    <button type="submit" className="login-btn">
                        Login
                    </button>
                </form>
                <p className="register-link">
                    Don't have an account?  
                    <a href={`${FRONT_END_URL}/register`}>Register!</a>
                </p>
            </div>
        </div>
    );
};

export default Login;