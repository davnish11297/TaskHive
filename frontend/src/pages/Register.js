import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../src/Register.css';
import { API_URL, FRONTEND_URL } from '../config/api';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'freelancer',
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

        try {
            const response = await axios.post(`${API_URL}/api/auth/register`, formData);
            const { token } = response.data;
            localStorage.setItem('token', token);
            navigate('/home');
        } catch (error) {
            setError('Error registering user. Please try again.');
        }
    };

    return (
        <div className="register-container">
            <div className="register-form">
                <div className="logo-container">
                    <img className="logo" src={`${window.location.origin}/taskhive-logo.png`} alt="TaskHive Logo" />
                </div>
                {/* <h2>Register to TaskHive 🐝</h2> */}
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Enter your name"
                            className="input-field"
                        />
                    </div>

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

                    <div className="input-group">
                        <label htmlFor="role">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="input-field"
                        >
                            <option value="freelancer">Freelancer</option>
                            <option value="task_poster">Task Poster</option>
                        </select>
                    </div>

                    <button type="submit" className="register-btn">
                        Register
                    </button>
                </form>
                <p className="register-link">
                    Already have an account?  
                    <a href={`${FRONTEND_URL}/login`}>Login!</a>
                </p>
            </div>
        </div>
    );
};

export default Register;