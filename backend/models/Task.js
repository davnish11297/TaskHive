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
    
    // New fields for difficulty scoring and categorization
    difficulty: {
        score: { type: Number, min: 1, max: 10, default: 5 }, // 1-10 difficulty scale
        level: { 
            type: String, 
            enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'], 
            default: 'INTERMEDIATE' 
        },
        factors: [{
            factor: { type: String }, // e.g., "complexity", "scope", "technical_requirements"
            weight: { type: Number, min: 0, max: 1 }, // weight of this factor
            score: { type: Number, min: 1, max: 10 } // individual factor score
        }]
    },
    
    // Time estimation
    timeEstimation: {
        estimatedHours: { type: Number, min: 0.5, default: 8 },
        estimatedDays: { type: Number, min: 1, default: 1 },
        confidence: { type: Number, min: 0, max: 100, default: 70 }, // confidence in estimation (%)
        breakdown: [{
            phase: { type: String }, // e.g., "planning", "development", "testing"
            hours: { type: Number, min: 0.5 },
            percentage: { type: Number, min: 0, max: 100 }
        }]
    },
    
    // Priority and suggestions
    priority: {
        score: { type: Number, min: 1, max: 10, default: 5 }, // 1-10 priority scale
        level: { 
            type: String, 
            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
            default: 'MEDIUM' 
        },
        factors: [{
            factor: { type: String }, // e.g., "deadline", "budget", "complexity"
            weight: { type: Number, min: 0, max: 1 },
            score: { type: Number, min: 1, max: 10 }
        }]
    },
    
    // Automatic categorization
    autoCategory: {
        primary: { type: String }, // automatically detected primary category
        secondary: { type: String }, // secondary category
        confidence: { type: Number, min: 0, max: 100 }, // confidence in categorization
        keywords: [{ type: String }] // keywords that led to categorization
    },
    
    // Task complexity indicators
    complexity: {
        technicalComplexity: { type: Number, min: 1, max: 10, default: 5 },
        scopeSize: { type: Number, min: 1, max: 10, default: 5 }, // small, medium, large
        integrationRequired: { type: Boolean, default: false },
        thirdPartyDependencies: [{ type: String }],
        skillRequirements: [{ type: String }]
    }
});

// Pre-save middleware to calculate difficulty, time estimation, and priority
TaskSchema.pre('save', function(next) {
    if (this.isModified('description') || this.isModified('title') || this.isModified('category') || this.isModified('tags')) {
        this.calculateDifficulty();
        this.estimateTime();
        this.calculatePriority();
        this.autoCategorize();
    }
    next();
});

// Method to calculate task difficulty
TaskSchema.methods.calculateDifficulty = function() {
    let totalScore = 0;
    let totalWeight = 0;
    
    // Factor 1: Technical complexity based on keywords
    const technicalKeywords = ['api', 'database', 'algorithm', 'optimization', 'scalability', 'security', 'testing'];
    const technicalScore = this.calculateKeywordScore(this.description + ' ' + this.title, technicalKeywords);
    this.difficulty.factors.push({
        factor: 'technical_complexity',
        weight: 0.3,
        score: technicalScore
    });
    
    // Factor 2: Scope size based on description length and keywords
    const scopeKeywords = ['large', 'comprehensive', 'complete', 'full', 'extensive', 'multiple', 'system'];
    const scopeScore = this.calculateKeywordScore(this.description + ' ' + this.title, scopeKeywords);
    this.difficulty.factors.push({
        factor: 'scope_size',
        weight: 0.25,
        score: scopeScore
    });
    
    // Factor 3: Integration requirements
    const integrationKeywords = ['integration', 'api', 'third-party', 'external', 'connect', 'sync'];
    const integrationScore = this.calculateKeywordScore(this.description + ' ' + this.title, integrationKeywords);
    this.difficulty.factors.push({
        factor: 'integration_requirements',
        weight: 0.2,
        score: integrationScore
    });
    
    // Factor 4: Skill requirements
    const skillKeywords = ['expert', 'senior', 'advanced', 'specialized', 'experience', 'proficiency'];
    const skillScore = this.calculateKeywordScore(this.description + ' ' + this.title, skillKeywords);
    this.difficulty.factors.push({
        factor: 'skill_requirements',
        weight: 0.25,
        score: skillScore
    });
    
    // Calculate weighted average
    this.difficulty.factors.forEach(factor => {
        totalScore += factor.score * factor.weight;
        totalWeight += factor.weight;
    });
    
    this.difficulty.score = Math.round(totalScore / totalWeight);
    
    // Set difficulty level
    if (this.difficulty.score <= 3) this.difficulty.level = 'BEGINNER';
    else if (this.difficulty.score <= 6) this.difficulty.level = 'INTERMEDIATE';
    else if (this.difficulty.score <= 8) this.difficulty.level = 'ADVANCED';
    else this.difficulty.level = 'EXPERT';
};

// Method to estimate time
TaskSchema.methods.estimateTime = function() {
    let baseHours = 8; // Base hours for a standard task
    
    // Adjust based on difficulty
    baseHours *= (this.difficulty.score / 5);
    
    // Adjust based on description length (more detailed = more time)
    const descriptionLength = this.description.length;
    if (descriptionLength > 1000) baseHours *= 1.5;
    else if (descriptionLength > 500) baseHours *= 1.2;
    
    // Adjust based on scope keywords
    const scopeKeywords = ['large', 'comprehensive', 'complete', 'full', 'extensive'];
    const scopeMultiplier = this.calculateKeywordMultiplier(this.description + ' ' + this.title, scopeKeywords);
    baseHours *= scopeMultiplier;
    
    this.timeEstimation.estimatedHours = Math.round(baseHours * 10) / 10; // Round to 1 decimal
    this.timeEstimation.estimatedDays = Math.ceil(this.timeEstimation.estimatedHours / 8);
    
    // Set confidence based on description quality
    this.timeEstimation.confidence = Math.min(90, Math.max(50, 
        this.description.length > 200 ? 80 : 
        this.description.length > 100 ? 70 : 60
    ));
    
    // Create time breakdown
    this.timeEstimation.breakdown = [
        { phase: 'Planning & Analysis', hours: this.timeEstimation.estimatedHours * 0.2, percentage: 20 },
        { phase: 'Development', hours: this.timeEstimation.estimatedHours * 0.6, percentage: 60 },
        { phase: 'Testing & Review', hours: this.timeEstimation.estimatedHours * 0.2, percentage: 20 }
    ];
};

// Method to calculate priority
TaskSchema.methods.calculatePriority = function() {
    let totalScore = 0;
    let totalWeight = 0;
    
    // Factor 1: Deadline urgency
    const daysUntilDeadline = Math.ceil((this.deadline - new Date()) / (1000 * 60 * 60 * 24));
    const deadlineScore = daysUntilDeadline <= 1 ? 10 : daysUntilDeadline <= 3 ? 8 : daysUntilDeadline <= 7 ? 6 : 4;
    this.priority.factors.push({
        factor: 'deadline_urgency',
        weight: 0.3,
        score: deadlineScore
    });
    
    // Factor 2: Budget attractiveness
    const budgetScore = this.budget > 1000 ? 9 : this.budget > 500 ? 7 : this.budget > 200 ? 5 : 3;
    this.priority.factors.push({
        factor: 'budget_attractiveness',
        weight: 0.25,
        score: budgetScore
    });
    
    // Factor 3: Task complexity (inverse relationship - simpler tasks might be higher priority)
    const complexityScore = 11 - this.difficulty.score; // Inverse relationship
    this.priority.factors.push({
        factor: 'task_complexity',
        weight: 0.2,
        score: complexityScore
    });
    
    // Factor 4: Category demand (based on common high-demand categories)
    const highDemandCategories = ['web-development', 'mobile-development', 'ui-ux-design', 'content-writing'];
    const categoryScore = highDemandCategories.includes(this.category.toLowerCase()) ? 8 : 5;
    this.priority.factors.push({
        factor: 'category_demand',
        weight: 0.25,
        score: categoryScore
    });
    
    // Calculate weighted average
    this.priority.factors.forEach(factor => {
        totalScore += factor.score * factor.weight;
        totalWeight += factor.weight;
    });
    
    this.priority.score = Math.round(totalScore / totalWeight);
    
    // Set priority level
    if (this.priority.score <= 3) this.priority.level = 'LOW';
    else if (this.priority.score <= 6) this.priority.level = 'MEDIUM';
    else if (this.priority.score <= 8) this.priority.level = 'HIGH';
    else this.priority.level = 'URGENT';
};

// Method to auto-categorize tasks
TaskSchema.methods.autoCategorize = function() {
    const categoryKeywords = {
        'web-development': ['website', 'web', 'frontend', 'backend', 'fullstack', 'react', 'angular', 'vue', 'node', 'php', 'html', 'css', 'javascript'],
        'mobile-development': ['mobile', 'app', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
        'ui-ux-design': ['design', 'ui', 'ux', 'user interface', 'user experience', 'wireframe', 'prototype', 'figma', 'sketch', 'photoshop'],
        'content-writing': ['content', 'writing', 'article', 'blog', 'copywriting', 'seo', 'marketing', 'social media'],
        'data-analysis': ['data', 'analysis', 'analytics', 'excel', 'sql', 'python', 'r', 'statistics', 'reporting'],
        'graphic-design': ['graphic', 'logo', 'branding', 'illustration', 'photoshop', 'illustrator', 'canva'],
        'video-editing': ['video', 'editing', 'animation', 'motion', 'premiere', 'after effects', 'final cut'],
        'translation': ['translation', 'language', 'localization', 'multilingual', 'interpretation'],
        'virtual-assistant': ['virtual assistant', 'admin', 'scheduling', 'email', 'customer service', 'support'],
        'research': ['research', 'survey', 'interview', 'study', 'analysis', 'report']
    };
    
    let bestCategory = this.category;
    let bestScore = 0;
    let keywords = [];
    
    const text = (this.description + ' ' + this.title).toLowerCase();
    
    Object.entries(categoryKeywords).forEach(([category, categoryWords]) => {
        let score = 0;
        const matchedKeywords = [];
        
        categoryWords.forEach(word => {
            if (text.includes(word.toLowerCase())) {
                score += 1;
                matchedKeywords.push(word);
            }
        });
        
        if (score > bestScore) {
            bestScore = score;
            bestCategory = category;
            keywords = matchedKeywords;
        }
    });
    
    this.autoCategory = {
        primary: bestCategory,
        secondary: this.category !== bestCategory ? this.category : null,
        confidence: Math.min(100, bestScore * 20), // Convert score to percentage
        keywords: keywords
    };
};

// Helper method to calculate keyword score
TaskSchema.methods.calculateKeywordScore = function(text, keywords) {
    const lowerText = text.toLowerCase();
    let score = 1;
    
    keywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
            score += 2;
        }
    });
    
    return Math.min(10, score);
};

// Helper method to calculate keyword multiplier
TaskSchema.methods.calculateKeywordMultiplier = function(text, keywords) {
    const lowerText = text.toLowerCase();
    let multiplier = 1;
    
    keywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
            multiplier += 0.3;
        }
    });
    
    return Math.min(2, multiplier);
};

module.exports = mongoose.model('Task', TaskSchema);