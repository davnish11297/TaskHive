const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    bio: String,
    isVerified: { type: Boolean, default: false },
    profilePicture: { type: String, default: "/default-avatar.png" },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    role: { type: String, enum: ['task_poster', 'freelancer'], default: 'freelancer' },
    hourlyRate: Number,
    location: String,
    skills: [String],
});

module.exports = mongoose.model('User', UserSchema);