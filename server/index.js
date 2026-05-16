require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const { setupDatabase } = require('./database');
const path = require('path');

// Mongoose Models
const User = require('./models/User');
const Note = require('./models/Note');
const Activity = require('./models/Activity');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'noteflow_secret_key_123';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

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
        const user = await User.create({
            id,
            name,
            email: email.toLowerCase(),
            password: hashedPassword
        });
        const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id, name, email: user.email } });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, groqKey: user.groqKey } });
    } catch (err) {
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
        const { name, email, sub: googleId } = ticket.getPayload();

        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            const id = uuidv4();
            const hashedPassword = await bcrypt.hash(uuidv4(), 10);
            user = await User.create({
                id,
                name,
                email: email.toLowerCase(),
                password: hashedPassword
            });
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
        const user = await User.findOne({ id: req.user.id }, 'id name email groqKey theme');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/auth/settings', authenticateToken, async (req, res) => {
    const { groqKey, theme } = req.body;
    try {
        await User.findOneAndUpdate(
            { id: req.user.id },
            { $set: { groqKey, theme } },
            { omitUndefined: true }
        );
        res.json({ message: 'Settings updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Notes Routes ---
app.get('/api/notes', authenticateToken, async (req, res) => {
    const { archived } = req.query;
    const isArchived = archived === 'true';
    try {
        const notes = await Note.find({ userId: req.user.id, isArchived })
            .sort({ updatedAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/notes', authenticateToken, async (req, res) => {
    const id = uuidv4();
    const { title = 'Untitled Note', content = '', tags = [] } = req.body;
    try {
        const note = await Note.create({
            id,
            userId: req.user.id,
            title,
            content,
            tags
        });
        
        // Track activity
        const today = new Date().toISOString().split('T')[0];
        await Activity.findOneAndUpdate(
            { userId: req.user.id, type: 'note_created', date: today },
            { $inc: { count: 1 } },
            { upsert: true, new: true }
        );

        res.status(201).json(note);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/notes/:id', authenticateToken, async (req, res) => {
    const { title, content, tags, isArchived, isPublic, aiSummary, aiActionItems } = req.body;
    try {
        await Note.findOneAndUpdate(
            { id: req.params.id, userId: req.user.id },
            { 
                $set: { 
                    title, 
                    content, 
                    tags, 
                    isArchived, 
                    isPublic, 
                    aiSummary, 
                    aiActionItems 
                } 
            },
            { omitUndefined: true }
        );
        res.json({ message: 'Note updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        await Note.deleteOne({ id: req.params.id, userId: req.user.id });
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Sharing ---
app.post('/api/notes/:id/share', authenticateToken, async (req, res) => {
    const shareToken = uuidv4() + uuidv4();
    try {
        await Note.findOneAndUpdate(
            { id: req.params.id, userId: req.user.id },
            { $set: { isPublic: true, shareToken } }
        );
        res.json({ shareToken });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/notes/:id/revoke', authenticateToken, async (req, res) => {
    try {
        await Note.findOneAndUpdate(
            { id: req.params.id, userId: req.user.id },
            { $set: { isPublic: false, shareToken: null } }
        );
        res.json({ message: 'Share revoked' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/public/notes/:token', async (req, res) => {
    try {
        const note = await Note.findOne({ shareToken: req.params.token, isPublic: true });
        if (!note) return res.status(404).json({ message: 'Note not found' });
        res.json(note);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Stats ---
app.get('/api/stats', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const totalNotes = await Note.countDocuments({ userId, isArchived: false });
        const archivedNotes = await Note.countDocuments({ userId, isArchived: true });
        const sharedNotes = await Note.countDocuments({ userId, isPublic: true });
        
        // Top Tags
        const allNotes = await Note.find({ userId }, 'tags');
        const tagCount = {};
        allNotes.forEach(n => {
            if (n.tags) {
                n.tags.forEach(tag => {
                    const t = tag.trim();
                    if (t) tagCount[t] = (tagCount[t] || 0) + 1;
                });
            }
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
            
            const acts = await Activity.find({ userId, date: dateStr });
            const totalCount = acts.reduce((sum, act) => sum + act.count, 0);
            
            weekly.push({ day: dayName, count: totalCount, date: dateStr });
        }

        // AI Usage Breakdown (Dynamic)
        const aiStats = await Activity.aggregate([
            { $match: { userId, type: { $regex: /^ai_/ } } },
            { $group: { _id: '$type', total: { $sum: '$count' } } }
        ]);
        
        const aiUsage = { summary: 0, actions: 0, title: 0 };
        let totalAICalls = 0;
        
        aiStats.forEach(stat => {
            if (stat._id === 'ai_summary') aiUsage.summary = stat.total;
            if (stat._id === 'ai_actions') aiUsage.actions = stat.total;
            if (stat._id === 'ai_title') aiUsage.title = stat.total;
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
        const notes = await Note.find({ userId: req.user.id }, 'id title content tags aiSummary');
        
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
    const { feature } = req.body;
    const type = feature || 'ai_call';
    const today = new Date().toISOString().split('T')[0];
    try {
        await Activity.findOneAndUpdate(
            { userId: req.user.id, type, date: today },
            { $inc: { count: 1 } },
            { upsert: true, new: true }
        );
        res.json({ message: 'AI usage tracked' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start Server only if not in production/vercel
if (require.main === module) {
    setupDatabase().then(() => {
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
