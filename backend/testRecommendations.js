const axios = require('axios');

const API_URL = 'http://localhost:5001';

async function testRecommendations() {
    try {
        // First, login as a freelancer to get a token
        console.log('🔐 Logging in as john_developer...');
        const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
            email: 'john@example.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        
        // Test task recommendations
        console.log('\n📋 Testing task recommendations...');
        const recommendationsResponse = await axios.get(`${API_URL}/api/tasks/recommendations/tasks`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Recommendations API response:');
        console.log('Total recommendations:', recommendationsResponse.data.totalFound);
        console.log('User skills:', recommendationsResponse.data.userSkills);
        console.log('Recommendations:', recommendationsResponse.data.recommendations.length);
        
        if (recommendationsResponse.data.recommendations.length > 0) {
            console.log('\n📝 Sample recommendation:');
            const sample = recommendationsResponse.data.recommendations[0];
            console.log('- Title:', sample.title);
            console.log('- Category:', sample.category);
            console.log('- Budget:', sample.budget);
            console.log('- Tags:', sample.tags);
        }
        
        // Test priority-based recommendations
        console.log('\n🎯 Testing priority-based recommendations...');
        const priorityResponse = await axios.get(`${API_URL}/api/tasks/recommendations/priority`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Priority recommendations API response:');
        console.log('Total priority recommendations:', priorityResponse.data.totalFound);
        
    } catch (error) {
        console.error('❌ Error testing recommendations:', error.response?.data || error.message);
    }
}

testRecommendations(); 