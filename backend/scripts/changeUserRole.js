// Usage: node scripts/changeUserRole.js
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = 'mongodb+srv://sdavnish:davnish7@cluster0.dfy8i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function changeUserRole() {
  await mongoose.connect(MONGO_URI);
  
  // Change the user with ID '679f874fdb6d6bdbe51cc3ef' from freelancer to task_poster
  const userId = '679f874fdb6d6bdbe51cc3ef';
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 Current user:', user.name, 'Role:', user.role);
    
    user.role = 'task_poster';
    await user.save();
    
    console.log('✅ User role changed to task_poster');
    console.log('👤 Updated user:', user.name, 'Role:', user.role);
    
  } catch (error) {
    console.error('❌ Error changing user role:', error);
  }
  
  await mongoose.disconnect();
}

changeUserRole(); 