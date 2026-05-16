require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const { setupDatabase } = require('./database');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'noteflow_secret_key_123';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);
let db;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// --- Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();
        
        await db.run(
            'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
            [id, name, email.toLowerCase(), hashedPassword]
        );
        
        const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id, name, email: email.toLowerCase() } });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, groqKey: user.groqKey } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        const { name, email } = ticket.getPayload();

        let user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);

        if (!user) {
            const id = uuidv4();
            const hashedPassword = await bcrypt.hash(uuidv4(), 10);
            await db.run(
                'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
                [id, name, email.toLowerCase(), hashedPassword]
            );
            user = { id, name, email: email.toLowerCase() };
        }

        const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token: jwtToken, user: { id: user.id, name: user.name, email: user.email, groqKey: user.groqKey } });
    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(400).json({ message: 'Google authentication failed' });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await db.get('SELECT id, name, email, groqKey, theme FROM users WHERE id = ?', [req.user.id]);
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/auth/settings', authenticateToken, async (req, res) => {
    const { groqKey, theme } = req.body;
    try {
        await db.run(
            'UPDATE users SET groqKey = COALESCE(?, groqKey), theme = COALESCE(?, theme) WHERE id = ?',
            [groqKey, theme, req.user.id]
        );
        res.json({ message: 'Settings updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Notes Routes ---
app.get('/api/notes', authenticateToken, async (req, res) => {
    const { archived } = req.query;
    const isArchived = archived === 'true' ? 1 : 0;
    try {
        const notes = await db.all(
            'SELECT * FROM notes WHERE userId = ? AND isArchived = ? ORDER BY updatedAt DESC',
            [req.user.id, isArchived]
        );
        // Parse JSON fields
        notes.forEach(n => {
            n.tags = JSON.parse(n.tags || '[]');
            n.aiActionItems = JSON.parse(n.aiActionItems || '[]');
            n.isArchived = !!n.isArchived;
            n.isPublic = !!n.isPublic;
        });
        res.json(notes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/notes', authenticateToken, async (req, res) => {
    const id = uuidv4();
    const { title = 'Untitled Note', content = '', tags = [] } = req.body;
    try {
        await db.run(
            'INSERT INTO notes (id, userId, title, content, tags) VALUES (?, ?, ?, ?, ?)',
            [id, req.user.id, title, content, JSON.stringify(tags)]
        );
        
        // Track activity
        const today = new Date().toISOString().split('T')[0];
        await db.run(
            'INSERT INTO activity (userId, type, date, count) VALUES (?, ?, ?, 1) ON CONFLICT(userId, type, date) DO UPDATE SET count = count + 1',
            [req.user.id, 'note_created', today]
        );

        const note = await db.get('SELECT * FROM notes WHERE id = ?', [id]);
        note.tags = JSON.parse(note.tags);
        note.aiActionItems = JSON.parse(note.aiActionItems);
        res.status(201).json(note);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/notes/:id', authenticateToken, async (req, res) => {
    const { title, content, tags, isArchived, isPublic, aiSummary, aiActionItems } = req.body;
    try {
        await db.run(
            `UPDATE notes SET 
                title = COALESCE(?, title),
                content = COALESCE(?, content),
                tags = COALESCE(?, tags),
                isArchived = COALESCE(?, isArchived),
                isPublic = COALESCE(?, isPublic),
                aiSummary = COALESCE(?, aiSummary),
                aiActionItems = COALESCE(?, aiActionItems),
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ? AND userId = ?`,
            [
                title, 
                content, 
                tags ? JSON.stringify(tags) : null, 
                isArchived !== undefined ? (isArchived ? 1 : 0) : null,
                isPublic !== undefined ? (isPublic ? 1 : 0) : null,
                aiSummary,
                aiActionItems ? JSON.stringify(aiActionItems) : null,
                req.params.id,
                req.user.id
            ]
        );
        res.json({ message: 'Note updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        await db.run('DELETE FROM notes WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Sharing ---
app.post('/api/notes/:id/share', authenticateToken, async (req, res) => {
    const shareToken = uuidv4() + uuidv4();
    try {
        await db.run(
            'UPDATE notes SET isPublic = 1, shareToken = ? WHERE id = ? AND userId = ?',
            [shareToken, req.params.id, req.user.id]
        );
        res.json({ shareToken });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/notes/:id/revoke', authenticateToken, async (req, res) => {
    try {
        await db.run(
            'UPDATE notes SET isPublic = 0, shareToken = NULL WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Share revoked' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/public/notes/:token', async (req, res) => {
    try {
        const note = await db.get('SELECT * FROM notes WHERE shareToken = ? AND isPublic = 1', [req.params.token]);
        if (!note) return res.status(404).json({ message: 'Note not found' });
        note.tags = JSON.parse(note.tags || '[]');
        note.aiActionItems = JSON.parse(note.aiActionItems || '[]');
        res.json(note);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Stats ---
app.get('/api/stats', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const totalNotes = (await db.get('SELECT COUNT(*) as count FROM notes WHERE userId = ? AND isArchived = 0', [userId])).count;
        const archivedNotes = (await db.get('SELECT COUNT(*) as count FROM notes WHERE userId = ? AND isArchived = 1', [userId])).count;
        const sharedNotes = (await db.get('SELECT COUNT(*) as count FROM notes WHERE userId = ? AND isPublic = 1', [userId])).count;
        
        // Top Tags
        const allNotes = await db.all('SELECT tags FROM notes WHERE userId = ?', [userId]);
        const tagCount = {};
        allNotes.forEach(n => {
            const tags = JSON.parse(n.tags || '[]');
            tags.forEach(tag => {
                const t = tag.trim();
                if (t) tagCount[t] = (tagCount[t] || 0) + 1;
            });
        });
        const topTags = Object.entries(tagCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count }));

        // Weekly activity
        const weekly = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('en', { weekday: 'short' });
            const act = await db.get('SELECT SUM(count) as count FROM activity WHERE userId = ? AND date = ?', [userId, dateStr]);
            weekly.push({ day: dayName, count: act ? (act.count || 0) : 0, date: dateStr });
        }

        // AI Usage Breakdown (Dynamic)
        const aiStats = await db.all(
            "SELECT type, SUM(count) as total FROM activity WHERE userId = ? AND type LIKE 'ai_%' GROUP BY type",
            [userId]
        );
        
        const aiUsage = { summary: 0, actions: 0, title: 0 };
        let totalAICalls = 0;
        
        aiStats.forEach(stat => {
            if (stat.type === 'ai_summary') aiUsage.summary = stat.total;
            if (stat.type === 'ai_actions') aiUsage.actions = stat.total;
            if (stat.type === 'ai_title') aiUsage.title = stat.total;
            totalAICalls += stat.total;
        });

        res.json({ totalNotes, archivedNotes, sharedNotes, weekly, aiUsage, totalAICalls, topTags });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- AI Features ---
const callGroq = async (messages, maxTokens = 500) => {
    if (!GROQ_API_KEY) throw new Error('Groq API Key not configured on server');

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            max_tokens: maxTokens,
            temperature: 0.7
        })
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Groq API Error');
    }

    const data = await res.json();
    return data.choices[0].message.content.trim();
};

app.post('/api/ai/summary', authenticateToken, async (req, res) => {
    const { content } = req.body;
    try {
        const summary = await callGroq([
            { role: 'system', content: 'Summarize the following note in 2-3 concise sentences. Be professional and direct.' },
            { role: 'user', content }
        ]);
        res.json({ summary });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/ai/actions', authenticateToken, async (req, res) => {
    const { content } = req.body;
    try {
        const result = await callGroq([
            { role: 'system', content: 'Extract actionable tasks as a JSON array of strings. Return ONLY the array.' },
            { role: 'user', content }
        ]);
        const match = result.match(/\[.*\]/s);
        const actions = match ? JSON.parse(match[0]) : [];
        res.json({ actions });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/ai/suggest-title', authenticateToken, async (req, res) => {
    const { content } = req.body;
    try {
        const title = await callGroq([
            { role: 'system', content: 'Suggest a short, catchy title (4-6 words) for this note. Return ONLY the title text.' },
            { role: 'user', content }
        ]);
        res.json({ title: title.replace(/["']/g, '') });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/ai/search-intent', authenticateToken, async (req, res) => {
    const { query } = req.body;
    try {
        const notes = await db.all('SELECT id, title, content, tags, aiSummary FROM notes WHERE userId = ?', [req.user.id]);
        if (notes.length === 0) return res.json({ relevantIds: [] });

        const noteContext = notes.map(n => ({
            id: n.id,
            title: n.title,
            summary: n.aiSummary || n.content.replace(/<[^>]*>/g, ' ').substring(0, 150)
        }));

        const result = await callGroq([
            { role: 'system', content: `You are an AI search engine. Analyze the query and return a simple JSON array of IDs for relevant notes. If no notes match, return []. ONLY return the JSON array.` },
            { role: 'user', content: `Query: "${query}"\n\nNotes Data: ${JSON.stringify(noteContext)}` }
        ], 1000);

        const jsonMatch = result.match(/\[.*\]/s);
        const relevantIds = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        res.json({ relevantIds: Array.isArray(relevantIds) ? relevantIds : [] });
    } catch (err) {
        console.error("AI Search Error:", err);
        res.status(500).json({ message: 'AI Search is currently unavailable.' });
    }
});

app.post('/api/stats/ai-usage', authenticateToken, async (req, res) => {
    const { feature } = req.body; // e.g., 'ai_summary', 'ai_actions', 'ai_title'
    const type = feature || 'ai_call';
    const today = new Date().toISOString().split('T')[0];
    try {
        await db.run(
            'INSERT INTO activity (userId, type, date, count) VALUES (?, ?, ?, 1) ON CONFLICT(userId, type, date) DO UPDATE SET count = count + 1',
            [req.user.id, type, today]
        );
        res.json({ message: 'AI usage tracked' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

if (require.main === module) {
    setupDatabase().then(async (database) => {
        db = database;
        if (!process.env.GROQ_API_KEY) {
            console.warn('⚠️ WARNING: GROQ_API_KEY is missing from .env');
        } else {
            console.log('✅ Groq AI Configuration detected');
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    }).catch(err => {
        console.error('❌ Failed to start server:', err);
    });
}

module.exports = app;
