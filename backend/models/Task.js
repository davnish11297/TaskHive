const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: String,
    description: { type: String, required: true },
    budget: { type: Number },
    status: { 
        type: String, 
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], 
        default: 'PENDING' },
    deadline: { type: Date, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    category: { type: String, required: true }, // Task category (e.g., "Design", "Development")
    tags: [{ type: String }], // Array of tags (e.g., ["React", "UI/UX", "Frontend"])
});

module.exports = mongoose.model('Task', TaskSchema);