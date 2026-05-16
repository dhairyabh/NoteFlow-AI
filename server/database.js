const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function setupDatabase() {
    const dbPath = path.join(__dirname, 'database.sqlite');
    
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Create Tables
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            groqKey TEXT,
            theme TEXT DEFAULT 'dark',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            title TEXT DEFAULT 'Untitled Note',
            content TEXT DEFAULT '',
            tags TEXT DEFAULT '[]',
            isArchived INTEGER DEFAULT 0,
            isPublic INTEGER DEFAULT 0,
            shareToken TEXT UNIQUE,
            aiSummary TEXT,
            aiActionItems TEXT DEFAULT '[]',
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT NOT NULL,
            type TEXT NOT NULL,
            date TEXT NOT NULL,
            count INTEGER DEFAULT 0,
            UNIQUE(userId, type, date),
            FOREIGN KEY (userId) REFERENCES users(id)
        );
    `);

    console.log('✅ SQLite Database initialized and connected');
    return db;
}

module.exports = { setupDatabase };
