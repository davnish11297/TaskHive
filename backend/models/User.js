const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ['task_poster', 'freelancer'], default: 'freelancer' }
});

module.exports = mongoose.model('User', UserSchema);