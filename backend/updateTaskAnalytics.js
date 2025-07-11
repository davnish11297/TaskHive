const mongoose = require('mongoose');
const Task = require('./models/Task');

// Connect to MongoDB
mongoose.connect('mongodb+srv://sdavnish:davnish7@cluster0.dfy8i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
});

async function updateAllTaskAnalytics() {
    try {
        console.log('🔄 Starting task analytics update...');
        
        // Get all tasks
        const tasks = await Task.find({});
        console.log(`📋 Found ${tasks.length} tasks to update`);
        
        if (tasks.length === 0) {
            console.log('✅ No tasks found to update');
            return;
        }
        
        let updatedCount = 0;
        let errorCount = 0;
        
        for (const task of tasks) {
            try {
                console.log(`\n🔄 Updating task: "${task.title}" (ID: ${task._id})`);
                
                // Check if task already has analytics fields
                const hasAnalytics = task.difficulty && 
                                   task.difficulty.score && 
                                   task.timeEstimation && 
                                   task.timeEstimation.estimatedHours &&
                                   task.priority &&
                                   task.autoCategory;
                
                if (hasAnalytics) {
                    console.log(`   ⏭️  Task already has analytics - skipping`);
                    continue;
                }
                
                // Initialize analytics fields if they don't exist
                if (!task.difficulty) {
                    task.difficulty = {
                        score: 5,
                        level: 'INTERMEDIATE',
                        factors: []
                    };
                }
                
                if (!task.timeEstimation) {
                    task.timeEstimation = {
                        estimatedHours: 8,
                        estimatedDays: 1,
                        confidence: 70,
                        breakdown: []
                    };
                }
                
                if (!task.priority) {
                    task.priority = {
                        score: 5,
                        level: 'MEDIUM',
                        factors: []
                    };
                }
                
                if (!task.autoCategory) {
                    task.autoCategory = {
                        primary: task.category || 'General',
                        secondary: null,
                        confidence: 60,
                        keywords: task.tags || []
                    };
                }
                
                if (!task.complexity) {
                    task.complexity = {
                        technicalComplexity: 5,
                        scopeSize: 5,
                        integrationRequired: false,
                        thirdPartyDependencies: [],
                        skillRequirements: []
                    };
                }
                
                // Trigger the pre-save middleware to calculate analytics
                task.calculateDifficulty();
                task.estimateTime();
                task.calculatePriority();
                task.autoCategorize();
                
                // Save the task
                await task.save();
                
                console.log(`   ✅ Updated successfully`);
                console.log(`      Difficulty: ${task.difficulty.score}/10 (${task.difficulty.level})`);
                console.log(`      Time: ${task.timeEstimation.estimatedHours}h (${task.timeEstimation.estimatedDays} days)`);
                console.log(`      Priority: ${task.priority.score}/10 (${task.priority.level})`);
                console.log(`      Category: ${task.autoCategory.primary} (${task.autoCategory.confidence}% confidence)`);
                
                updatedCount++;
                
            } catch (error) {
                console.error(`   ❌ Error updating task ${task._id}:`, error.message);
                errorCount++;
            }
        }
        
        console.log(`\n🎉 Task analytics update completed!`);
        console.log(`   ✅ Successfully updated: ${updatedCount} tasks`);
        console.log(`   ❌ Errors: ${errorCount} tasks`);
        console.log(`   📊 Total processed: ${tasks.length} tasks`);
        
    } catch (error) {
        console.error('❌ Error in update process:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the update
updateAllTaskAnalytics(); 