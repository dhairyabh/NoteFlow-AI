const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    type: { type: String, required: true }, // 'note_created', 'ai_call'
    date: { type: String, required: true }, // YYYY-MM-DD
    count: { type: Number, default: 1 },
});

activitySchema.index({ userId: 1, type: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Activity', activitySchema);
