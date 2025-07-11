// API Configuration
const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost';

export const API_URL = isProduction 
  ? "https://taskhive-d0c8.onrender.com"
  : "http://localhost:5001";

export const FRONTEND_URL = isProduction
  ? "https://taskhive-frontend-6uz2diami-davnish11297s-projects.vercel.app"
  : "http://localhost:3000";

// API Endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  VERIFY_EMAIL: '/api/auth/verify-email',
  
  // Tasks
  TASKS: '/api/tasks',
  TASK_ANALYTICS: '/api/tasks/analytics',
  TASK_RECOMMENDATIONS: '/api/tasks/recommendations',
  
  // Bids
  BIDS: '/api/bids',
  
  // Users
  USER_PROFILE: '/api/user/profile',
  USER_PUBLIC: '/api/user',
  
  // Notifications
  NOTIFICATIONS: '/api/notifications',
  
  // Chat
  CHAT_TASK: (taskId) => `/api/chat/task/${taskId}`,
  CHAT_MESSAGE: (taskId) => `/api/chat/task/${taskId}/message`,
  CHAT_READ: (taskId) => `/api/chat/task/${taskId}/read`,
  CHAT_USER: '/api/chat/user',
  
  // Progress
  PROGRESS_TASK: (taskId) => `/api/progress/task/${taskId}`,
  PROGRESS_MILESTONE: (taskId, milestoneIndex) => `/api/progress/task/${taskId}/milestone/${milestoneIndex}`,
  PROGRESS_USER: '/api/progress/user',
  
  // Ratings
  RATINGS_TASK: (taskId) => `/api/ratings/task/${taskId}`,
  RATINGS_USER: (userId) => `/api/ratings/user/${userId}`,
  RATINGS_HELPFUL: (ratingId) => `/api/ratings/${ratingId}/helpful`,
  RATINGS_MY: '/api/ratings/my-ratings',
  
  // Files
  FILES_UPLOAD: '/api/files/upload',
  FILES_UPLOAD_MULTIPLE: '/api/files/upload-multiple',
  FILES_INFO: (filename) => `/api/files/${filename}`,
  FILES_DELETE: (filename) => `/api/files/${filename}`,
}; 