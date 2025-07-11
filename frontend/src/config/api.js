// API Configuration
const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost';

export const API_URL = isProduction 
  ? "https://taskhive-d0c8.onrender.com"
  : "http://localhost:5001";

export const FRONTEND_URL = isProduction
  ? "https://taskhive-frontend-6uz2diami-davnish11297s-projects.vercel.app"
  : "http://localhost:3000"; 