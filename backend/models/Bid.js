const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bidAmount: { type: Number, required: true },
    estimatedCompletion: { type: Date, required: true },
    message: { type: String },
    status: { 
        type: String, 
        enum: ['PENDING', 'ACCEPTED', 'REJECTED'], 
        default: 'PENDING' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Bid', bidSchema);