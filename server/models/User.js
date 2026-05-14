const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    groqKey: { type: String },
    theme: { type: String, default: 'dark' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
