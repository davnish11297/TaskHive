// Usage: node scripts/findAndFixUser.js
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = 'mongodb+srv://sdavnish:davnish7@cluster0.dfy8i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function findAndFixUser() {
  await mongoose.connect(MONGO_URI);
  
  console.log('🔍 Searching for users in database...');
  
  try {
    // Find all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users in database:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id}, Name: ${user.name}, Role: ${user.role}, Email: ${user.email}`);
    });
    
    // Check if the JWT user ID exists
    const jwtUserId = '679f874fdb6d6bdbe51cc3ef';
    const jwtUser = await User.findById(jwtUserId);
    
    if (jwtUser) {
      console.log(`\n✅ JWT user ID (${jwtUserId}) exists in database`);
      console.log(`👤 User: ${jwtUser.name}, Role: ${jwtUser.role}`);
    } else {
      console.log(`\n❌ JWT user ID (${jwtUserId}) does NOT exist in database`);
      console.log('💡 You need to either:');
      console.log('   1. Log in with the correct user credentials, or');
      console.log('   2. Update the JWT to use an existing user ID');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  await mongoose.disconnect();
}

findAndFixUser(); 