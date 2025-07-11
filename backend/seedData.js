const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Task = require('./models/Task');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Connect to MongoDB
mongoose.connect('mongodb+srv://sdavnish:davnish7@cluster0.dfy8i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
});

// Test Users Data
const testUsers = [
    {
        name: 'john_developer',
        email: 'john@example.com',
        password: 'password123',
        role: 'freelancer',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        experience: 'intermediate',
        hourlyRate: 45
    },
    {
        name: 'sarah_designer',
        email: 'sarah@example.com',
        password: 'password123',
        role: 'freelancer',
        skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping'],
        experience: 'advanced',
        hourlyRate: 60
    },
    {
        name: 'mike_startup',
        email: 'mike@startup.com',
        password: 'password123',
        role: 'task_poster',
        company: 'TechStart Inc.'
    },
    {
        name: 'emma_agency',
        email: 'emma@agency.com',
        password: 'password123',
        role: 'task_poster',
        company: 'Digital Solutions Agency'
    },
    {
        name: 'alex_expert',
        email: 'alex@expert.com',
        password: 'password123',
        role: 'freelancer',
        skills: ['Python', 'Machine Learning', 'Data Science', 'AWS'],
        experience: 'expert',
        hourlyRate: 85
    },
    {
        name: 'lisa_beginner',
        email: 'lisa@beginner.com',
        password: 'password123',
        role: 'freelancer',
        skills: ['HTML', 'CSS', 'JavaScript'],
        experience: 'beginner',
        hourlyRate: 25
    }
];

// Test Tasks Data with Smart Features
const testTasks = [
    {
        title: 'E-commerce Website Development',
        description: 'Build a comprehensive e-commerce platform with React frontend, Node.js backend, MongoDB database, payment integration (Stripe), user authentication, admin dashboard, inventory management, order processing, customer reviews, analytics dashboard, and mobile responsiveness. The platform should handle multiple payment methods, shipping calculations, and real-time inventory updates.',
        budget: 3500,
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
        category: 'web-development',
        tags: ['react', 'node.js', 'mongodb', 'e-commerce', 'payment-integration'],
        location: 'Remote',
        postedBy: null, // Will be set to mike_startup
        difficulty: {
            score: 9,
            level: 'EXPERT',
            factors: [
                { factor: 'technical_complexity', weight: 0.3, score: 9 },
                { factor: 'scope_size', weight: 0.25, score: 9 },
                { factor: 'integration_requirements', weight: 0.2, score: 8 },
                { factor: 'skill_requirements', weight: 0.25, score: 9 }
            ]
        },
        timeEstimation: {
            estimatedHours: 160,
            estimatedDays: 20,
            confidence: 85,
            breakdown: [
                { phase: 'Planning & Analysis', hours: 32, percentage: 20 },
                { phase: 'Frontend Development', hours: 64, percentage: 40 },
                { phase: 'Backend Development', hours: 48, percentage: 30 },
                { phase: 'Testing & Deployment', hours: 16, percentage: 10 }
            ]
        },
        priority: {
            score: 9,
            level: 'URGENT',
            factors: [
                { factor: 'deadline_urgency', weight: 0.3, score: 8 },
                { factor: 'budget_attractiveness', weight: 0.25, score: 9 },
                { factor: 'task_complexity', weight: 0.2, score: 2 },
                { factor: 'category_demand', weight: 0.25, score: 9 }
            ]
        },
        autoCategory: {
            primary: 'web-development',
            secondary: 'e-commerce',
            confidence: 95,
            keywords: ['e-commerce', 'react', 'node.js', 'mongodb', 'payment', 'platform']
        }
    },
    {
        title: 'Mobile App UI/UX Design',
        description: 'Design a modern and intuitive mobile app interface for a fitness tracking application. Create wireframes, high-fidelity mockups, and interactive prototypes using Figma. The design should include user onboarding, dashboard, workout tracking, progress visualization, and social features. Focus on accessibility and user experience best practices.',
        budget: 1200,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        category: 'design',
        tags: ['ui-ux', 'mobile-design', 'figma', 'prototyping', 'fitness'],
        location: 'Remote',
        postedBy: null, // Will be set to emma_agency
        difficulty: {
            score: 6,
            level: 'INTERMEDIATE',
            factors: [
                { factor: 'technical_complexity', weight: 0.3, score: 5 },
                { factor: 'scope_size', weight: 0.25, score: 6 },
                { factor: 'integration_requirements', weight: 0.2, score: 4 },
                { factor: 'skill_requirements', weight: 0.25, score: 7 }
            ]
        },
        timeEstimation: {
            estimatedHours: 80,
            estimatedDays: 10,
            confidence: 90,
            breakdown: [
                { phase: 'Research & Analysis', hours: 16, percentage: 20 },
                { phase: 'Wireframing', hours: 24, percentage: 30 },
                { phase: 'Visual Design', hours: 32, percentage: 40 },
                { phase: 'Prototyping', hours: 8, percentage: 10 }
            ]
        },
        priority: {
            score: 7,
            level: 'HIGH',
            factors: [
                { factor: 'deadline_urgency', weight: 0.3, score: 7 },
                { factor: 'budget_attractiveness', weight: 0.25, score: 6 },
                { factor: 'task_complexity', weight: 0.2, score: 4 },
                { factor: 'category_demand', weight: 0.25, score: 8 }
            ]
        },
        autoCategory: {
            primary: 'design',
            secondary: 'mobile-design',
            confidence: 92,
            keywords: ['mobile', 'ui-ux', 'design', 'figma', 'fitness', 'app']
        }
    },
    {
        title: 'Simple Landing Page',
        description: 'Create a basic landing page for a local restaurant. The page should include a hero section, menu highlights, contact information, and a simple contact form. Use HTML, CSS, and basic JavaScript. The design should be responsive and load quickly.',
        budget: 300,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        category: 'web-development',
        tags: ['html', 'css', 'javascript', 'landing-page', 'responsive'],
        location: 'Remote',
        postedBy: null, // Will be set to mike_startup
        difficulty: {
            score: 2,
            level: 'BEGINNER',
            factors: [
                { factor: 'technical_complexity', weight: 0.3, score: 2 },
                { factor: 'scope_size', weight: 0.25, score: 2 },
                { factor: 'integration_requirements', weight: 0.2, score: 1 },
                { factor: 'skill_requirements', weight: 0.25, score: 2 }
            ]
        },
        timeEstimation: {
            estimatedHours: 20,
            estimatedDays: 3,
            confidence: 95,
            breakdown: [
                { phase: 'Design', hours: 4, percentage: 20 },
                { phase: 'Development', hours: 12, percentage: 60 },
                { phase: 'Testing', hours: 4, percentage: 20 }
            ]
        },
        priority: {
            score: 5,
            level: 'MEDIUM',
            factors: [
                { factor: 'deadline_urgency', weight: 0.3, score: 6 },
                { factor: 'budget_attractiveness', weight: 0.25, score: 4 },
                { factor: 'task_complexity', weight: 0.2, score: 8 },
                { factor: 'category_demand', weight: 0.25, score: 6 }
            ]
        },
        autoCategory: {
            primary: 'web-development',
            secondary: 'landing-page',
            confidence: 88,
            keywords: ['landing-page', 'html', 'css', 'restaurant', 'responsive']
        }
    },
    {
        title: 'Machine Learning Model Development',
        description: 'Develop a machine learning model for customer churn prediction using Python. The model should analyze customer behavior data and predict which customers are likely to leave. Use scikit-learn, pandas, and numpy. Include data preprocessing, feature engineering, model training, validation, and deployment considerations. Provide documentation and model performance metrics.',
        budget: 2500,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        category: 'data-science',
        tags: ['python', 'machine-learning', 'scikit-learn', 'pandas', 'data-analysis'],
        location: 'Remote',
        postedBy: null, // Will be set to emma_agency
        difficulty: {
            score: 8,
            level: 'ADVANCED',
            factors: [
                { factor: 'technical_complexity', weight: 0.3, score: 9 },
                { factor: 'scope_size', weight: 0.25, score: 7 },
                { factor: 'integration_requirements', weight: 0.2, score: 6 },
                { factor: 'skill_requirements', weight: 0.25, score: 8 }
            ]
        },
        timeEstimation: {
            estimatedHours: 120,
            estimatedDays: 15,
            confidence: 80,
            breakdown: [
                { phase: 'Data Analysis', hours: 24, percentage: 20 },
                { phase: 'Feature Engineering', hours: 36, percentage: 30 },
                { phase: 'Model Development', hours: 48, percentage: 40 },
                { phase: 'Testing & Documentation', hours: 12, percentage: 10 }
            ]
        },
        priority: {
            score: 8,
            level: 'HIGH',
            factors: [
                { factor: 'deadline_urgency', weight: 0.3, score: 6 },
                { factor: 'budget_attractiveness', weight: 0.25, score: 8 },
                { factor: 'task_complexity', weight: 0.2, score: 3 },
                { factor: 'category_demand', weight: 0.25, score: 9 }
            ]
        },
        autoCategory: {
            primary: 'data-science',
            secondary: 'machine-learning',
            confidence: 96,
            keywords: ['machine-learning', 'python', 'data-analysis', 'churn-prediction', 'scikit-learn']
        }
    },
    {
        title: 'WordPress Blog Setup',
        description: 'Set up a WordPress blog for a personal finance advisor. Install WordPress, configure a professional theme, set up essential plugins (SEO, security, backup), create sample content structure, and provide basic training on content management. The blog should be optimized for speed and SEO.',
        budget: 400,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
        category: 'web-development',
        tags: ['wordpress', 'blog', 'seo', 'content-management', 'setup'],
        location: 'Remote',
        postedBy: null, // Will be set to mike_startup
        difficulty: {
            score: 3,
            level: 'BEGINNER',
            factors: [
                { factor: 'technical_complexity', weight: 0.3, score: 3 },
                { factor: 'scope_size', weight: 0.25, score: 3 },
                { factor: 'integration_requirements', weight: 0.2, score: 2 },
                { factor: 'skill_requirements', weight: 0.25, score: 3 }
            ]
        },
        timeEstimation: {
            estimatedHours: 30,
            estimatedDays: 4,
            confidence: 92,
            breakdown: [
                { phase: 'Installation & Setup', hours: 8, percentage: 27 },
                { phase: 'Theme & Plugin Configuration', hours: 12, percentage: 40 },
                { phase: 'Content Structure', hours: 6, percentage: 20 },
                { phase: 'Training & Documentation', hours: 4, percentage: 13 }
            ]
        },
        priority: {
            score: 6,
            level: 'MEDIUM',
            factors: [
                { factor: 'deadline_urgency', weight: 0.3, score: 5 },
                { factor: 'budget_attractiveness', weight: 0.25, score: 5 },
                { factor: 'task_complexity', weight: 0.2, score: 7 },
                { factor: 'category_demand', weight: 0.25, score: 7 }
            ]
        },
        autoCategory: {
            primary: 'web-development',
            secondary: 'wordpress',
            confidence: 90,
            keywords: ['wordpress', 'blog', 'setup', 'seo', 'content-management']
        }
    },
    {
        title: 'API Integration for CRM System',
        description: 'Integrate third-party APIs (Salesforce, HubSpot, and payment gateways) into an existing CRM system. Develop RESTful APIs, handle authentication, implement error handling, create comprehensive documentation, and provide testing scenarios. The integration should support real-time data synchronization and webhook notifications.',
        budget: 1800,
        deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // 18 days
        category: 'software-development',
        tags: ['api-integration', 'crm', 'salesforce', 'hubspot', 'rest-api'],
        location: 'Remote',
        postedBy: null, // Will be set to emma_agency
        difficulty: {
            score: 7,
            level: 'ADVANCED',
            factors: [
                { factor: 'technical_complexity', weight: 0.3, score: 8 },
                { factor: 'scope_size', weight: 0.25, score: 6 },
                { factor: 'integration_requirements', weight: 0.2, score: 9 },
                { factor: 'skill_requirements', weight: 0.25, score: 7 }
            ]
        },
        timeEstimation: {
            estimatedHours: 100,
            estimatedDays: 12,
            confidence: 85,
            breakdown: [
                { phase: 'API Analysis', hours: 16, percentage: 16 },
                { phase: 'Development', hours: 60, percentage: 60 },
                { phase: 'Testing', hours: 16, percentage: 16 },
                { phase: 'Documentation', hours: 8, percentage: 8 }
            ]
        },
        priority: {
            score: 7,
            level: 'HIGH',
            factors: [
                { factor: 'deadline_urgency', weight: 0.3, score: 6 },
                { factor: 'budget_attractiveness', weight: 0.25, score: 7 },
                { factor: 'task_complexity', weight: 0.2, score: 4 },
                { factor: 'category_demand', weight: 0.25, score: 8 }
            ]
        },
        autoCategory: {
            primary: 'software-development',
            secondary: 'api-integration',
            confidence: 94,
            keywords: ['api', 'integration', 'crm', 'salesforce', 'hubspot', 'rest']
        }
    }
];

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Task.deleteMany({});
        console.log('✅ Cleared existing data');

        // Create users
        const createdUsers = [];
        for (const userData of testUsers) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = new User({
                ...userData,
                password: hashedPassword,
                isVerified: true,
                profilePicture: '/default-avatar.png'
            });
            const savedUser = await user.save();
            createdUsers.push(savedUser);
            console.log(`✅ Created user: ${userData.name}`);
        }

        // Create tasks and assign to users
        const taskPosters = createdUsers.filter(user => user.role === 'task_poster');
        console.log('Task posters found:', taskPosters.map(u => u.name));
        
        const mike = taskPosters.find(user => user.name === 'mike_startup');
        const emma = taskPosters.find(user => user.name === 'emma_agency');

        if (!mike || !emma) {
            console.log('Available users:', createdUsers.map(u => ({ name: u.name, role: u.role })));
            throw new Error('Task posters not found. Please check user creation.');
        }

        for (let i = 0; i < testTasks.length; i++) {
            const taskData = { ...testTasks[i] }; // Create a copy to avoid modifying original
            
            // Assign tasks to different posters
            if (i % 2 === 0) {
                taskData.postedBy = mike._id;
            } else {
                taskData.postedBy = emma._id;
            }

            const task = new Task(taskData);
            const savedTask = await task.save();
            console.log(`✅ Created task: ${taskData.title}`);
        }

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   👥 Users created: ${createdUsers.length}`);
        console.log(`   📋 Tasks created: ${testTasks.length}`);
        
        console.log('\n🔑 Test Login Credentials:');
        testUsers.forEach(user => {
            console.log(`   ${user.name}: ${user.password}`);
        });

        console.log('\n🚀 You can now test all the smart features with this data!');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the seeding
seedDatabase(); 