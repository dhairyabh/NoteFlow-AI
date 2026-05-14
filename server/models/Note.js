const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    title: { type: String, default: 'Untitled Note' },
    content: { type: String, default: '' },
    tags: { type: [String], default: [] },
    isArchived: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String, unique: true, sparse: true },
    aiSummary: { type: String },
    aiActionItems: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
