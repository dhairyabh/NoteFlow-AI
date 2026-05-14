// ============================================================
// db.js — NoteFlow AI | API Client Layer
// ============================================================

const API_BASE = 'http://localhost:5000/api';

const DB = {
    // --- Session ---
    getToken() { return localStorage.getItem('nf_token'); },
    setToken(token) { localStorage.setItem('nf_token', token); },
    logout() { localStorage.removeItem('nf_token'); },

    async request(path, options = {}) {
        const token = this.getToken();
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
        const data = await res.json();
        
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                this.logout();
                window.location.hash = '#/login';
            }
            throw new Error(data.message || 'API request failed');
        }
        return data;
    },

    // --- Auth ---
    async registerUser(name, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
        this.setToken(data.token);
        return data.user;
    },

    async loginUser(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        this.setToken(data.token);
        return data.user;
    },

    async getCurrentUser() {
        if (!this.getToken()) return null;
        try {
            return await this.request('/auth/me');
        } catch {
            return null;
        }
    },

    // --- AI (Backend Driven) ---
    async generateSummary(content) {
        const data = await this.request('/ai/summary', {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        await this.trackAIUsage();
        return data.summary;
    },

    async extractActionItems(content) {
        const data = await this.request('/ai/actions', {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        await this.trackAIUsage();
        return data.actions;
    },

    async suggestTitle(content) {
        const data = await this.request('/ai/suggest-title', {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        await this.trackAIUsage();
        return data.title;
    },

    // --- Notes ---
    async getNotes(userId) { // userId is handled by token now
        return await this.request('/notes');
    },

    async searchNotes(userId, query = '', filterTags = [], showArchived = false) {
        let notes = await this.request(`/notes?archived=${showArchived}`);
        if (query.trim()) {
            const q = query.toLowerCase();
            notes = notes.filter(n =>
                (n.title && n.title.toLowerCase().includes(q)) ||
                (n.content && n.content.toLowerCase().includes(q)) ||
                (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
            );
        }
        // Filtering by tags is handled client-side for simplicity, but could be API
        return notes;
    },

    async getNoteById(id) {
        // For simplicity, we filter from local state or fetch all
        // A real app would have GET /api/notes/:id
        const notes = await this.request('/notes');
        const notesArchived = await this.request('/notes?archived=true');
        return [...notes, ...notesArchived].find(n => n.id === id);
    },

    async getNoteByShareToken(token) {
        return await this.request(`/public/notes/${token}`);
    },

    async createNote(userId, opts = {}) {
        return await this.request('/notes', {
            method: 'POST',
            body: JSON.stringify(opts)
        });
    },

    async updateNote(noteId, updates) {
        return await this.request(`/notes/${noteId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },

    async deleteNote(noteId) {
        return await this.request(`/notes/${noteId}`, { method: 'DELETE' });
    },

    async generateShareToken(noteId) {
        const data = await this.request(`/notes/${noteId}/share`, { method: 'POST' });
        return data.shareToken;
    },

    async revokeShare(noteId) {
        return await this.request(`/notes/${noteId}/revoke`, { method: 'POST' });
    },

    // --- Stats ---
    async getStats() {
        return await this.request('/stats');
    },

    async trackAIUsage(userId, type) {
        return await this.request('/stats/ai-usage', { method: 'POST' });
    }
};
