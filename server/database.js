const mongoose = require('mongoose');

async function setupDatabase() {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
        console.warn('WARNING: MONGODB_URI is not defined in .env file.');
        console.warn('Please add MONGODB_URI to your .env file to connect to MongoDB Atlas.');
        // We return a mock object to prevent the server from crashing immediately,
        // but it won't be able to perform any DB operations.
        return null;
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB Atlas successfully');
        return mongoose.connection;
    } catch (err) {
        console.error('Error connecting to MongoDB Atlas:', err.message);
        throw err;
    }
}

module.exports = { setupDatabase };
