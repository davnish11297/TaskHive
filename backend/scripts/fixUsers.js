// Usage: node scripts/fixUsers.js
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskhive';

async function fixUsers() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const updates = [];
  const users = await User.find({});
  for (const user of users) {
    let changed = false;
    if (user.name === undefined) { user.name = 'No name provided'; changed = true; }
    if (user.bio === undefined) { user.bio = 'No bio provided'; changed = true; }
    if (user.location === undefined) { user.location = 'Not specified'; changed = true; }
    if (user.hourlyRate === undefined) { user.hourlyRate = 0; changed = true; }
    if (user.skills === undefined) { user.skills = []; changed = true; }
    if (changed) {
      updates.push(user.save());
      console.log(`Updated user ${user._id}`);
    }
  }
  await Promise.all(updates);
  console.log('All users updated.');
  mongoose.disconnect();
}

fixUsers().catch(err => { console.error(err); process.exit(1); }); 