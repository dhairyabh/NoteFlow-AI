// ============================================================
// app.js — NoteFlow AI | Application Core
// ============================================================

const App = {
    state: {
        currentUser: null,
        currentRoute: '#/notes',
        notes: [],
        currentNote: null,
        theme: 'dark',
        searchQuery: '',
        filterTags: [],
        isLoadingAI: false
    },

    async init() {
        // Theme initialization
        this.state.theme = localStorage.getItem('nf_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', this.state.theme);

        // Auth check
        this.state.currentUser = await DB.getCurrentUser();

        // Router listener
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();

        console.log("NoteFlow AI Initialized (Full-Stack)");
    },

    toggleTheme() {
        this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.state.theme);
        localStorage.setItem('nf_theme', this.state.theme);
        this.render();
    },

    handleRoute() {
        const hash = window.location.hash || '#/notes';
        this.state.currentRoute = hash;

        // Auth Guard
        const publicRoutes = ['#/login', '#/signup'];
        if (!this.state.currentUser && !publicRoutes.includes(hash)) {
            window.location.hash = '#/login';
            return;
        }
        if (this.state.currentUser && publicRoutes.includes(hash)) {
            window.location.hash = '#/notes';
            return;
        }

        this.render();
    },

    async render() {
        const root = document.getElementById('app-root');
        if (!root) return;

        // Clear previous content
        root.innerHTML = '';

        if (!this.state.currentUser) {
            this.renderAuth(root);
        } else {
            this.renderLayout(root);
        }
    },

    renderAuth(container) {
        const isSignup = this.state.currentRoute === '#/signup';
        container.innerHTML = `
            <div class="auth-container fade-in">
                <div class="card">
                    <div class="logo-container" style="justify-content: center;">
                        <img src="noteflow_logo.png" alt="NoteFlow Logo" onerror="this.src='https://cdn-icons-png.flaticon.com/512/5968/5968263.png'">
                        <span class="logo-text">NoteFlow AI</span>
                    </div>
                    <h2 style="text-align: center; margin-bottom: 1.5rem;">${isSignup ? 'Create Account' : 'Welcome Back'}</h2>
                    <form id="auth-form">
                        ${isSignup ? `
                            <div style="margin-bottom: 1rem;">
                                <label style="display:block; margin-bottom: 0.5rem; font-size: 0.875rem;">Full Name</label>
                                <input type="text" id="auth-name" placeholder="John Doe" required>
                            </div>
                        ` : ''}
                        <div style="margin-bottom: 1rem;">
                            <label style="display:block; margin-bottom: 0.5rem; font-size: 0.875rem;">Email Address</label>
                            <input type="email" id="auth-email" placeholder="email@example.com" required>
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display:block; margin-bottom: 0.5rem; font-size: 0.875rem;">Password</label>
                            <input type="password" id="auth-password" placeholder="••••••••" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%;">${isSignup ? 'Sign Up' : 'Sign In'}</button>
                    </form>
                    <p style="text-align: center; margin-top: 1.5rem; font-size: 0.875rem; color: var(--text-muted);">
                        ${isSignup ? 'Already have an account?' : "Don't have an account?"} 
                        <a href="${isSignup ? '#/login' : '#/signup'}" style="color: var(--primary); font-weight: 600;">${isSignup ? 'Login' : 'Create One'}</a>
                    </p>
                </div>
            </div>
        `;

        document.getElementById('auth-form').onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
            try {
                if (isSignup) {
                    const name = document.getElementById('auth-name').value;
                    await DB.registerUser(name, email, password);
                } else {
                    await DB.loginUser(email, password);
                }
                this.state.currentUser = DB.getCurrentUser();
                window.location.hash = '#/notes';
            } catch (err) {
                alert(err.message);
            }
        };
    },

    renderLayout(container) {
        container.innerHTML = `
            <aside class="sidebar">
                <div class="logo-container">
                    <img src="noteflow_logo.png" alt="Logo" onerror="this.src='https://cdn-icons-png.flaticon.com/512/5968/5968263.png'">
                    <span class="logo-text">NoteFlow AI</span>
                </div>
                
                <nav>
                    <a href="#/notes" class="nav-item ${this.state.currentRoute === '#/notes' ? 'active' : ''}">
                        <i class="fas fa-sticky-note"></i> All Notes
                    </a>
                    <a href="#/dashboard" class="nav-item ${this.state.currentRoute === '#/dashboard' ? 'active' : ''}">
                        <i class="fas fa-chart-pie"></i> Insights
                    </a>
                    <a href="#/archive" class="nav-item ${this.state.currentRoute === '#/archive' ? 'active' : ''}">
                        <i class="fas fa-archive"></i> Archive
                    </a>
                    <a href="#/settings" class="nav-item ${this.state.currentRoute === '#/settings' ? 'active' : ''}">
                        <i class="fas fa-cog"></i> Settings
                    </a>
                </nav>

                <div style="margin-top: auto;">
                    <div class="nav-item" onclick="App.toggleTheme()">
                        <i class="fas fa-${this.state.theme === 'light' ? 'moon' : 'sun'}"></i> 
                        ${this.state.theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    </div>
                    <div class="nav-item" onclick="App.logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </div>
                    <div style="padding: 1rem; border-top: 1px solid var(--border-color); margin-top: 1rem;">
                        <p style="font-size: 0.75rem; color: var(--text-muted);">Logged in as</p>
                        <p style="font-weight: 600; font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${this.state.currentUser.name}
                        </p>
                    </div>
                </div>
            </aside>

            <main class="main-content">
                <div id="page-content"></div>
            </main>
        `;

        this.renderPage();
    },

    renderPage() {
        const pageContent = document.getElementById('page-content');
        if (!pageContent) return;

        if (this.state.currentRoute.startsWith('#/note/')) {
            const noteId = this.state.currentRoute.split('/')[2];
            this.renderEditor(pageContent, noteId);
        } else {
            switch (this.state.currentRoute) {
                case '#/notes': this.renderNotesList(pageContent, false); break;
                case '#/archive': this.renderNotesList(pageContent, true); break;
                case '#/dashboard': this.renderDashboard(pageContent); break;
                case '#/settings': this.renderSettings(pageContent); break;
                default: window.location.hash = '#/notes';
            }
        }
    },

    // --- Page: Notes List ---
    async renderNotesList(container, archived = false) {
        container.innerHTML = `<div style="text-align:center; padding: 5rem;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i></div>`;
        const notes = await DB.searchNotes(this.state.currentUser.id, this.state.searchQuery, this.state.filterTags, archived);
        
        container.innerHTML = `
            <div class="fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h1>${archived ? 'Archived Notes' : 'My Notes'}</h1>
                    <button class="btn btn-primary" onclick="App.createNewNote()">
                        <i class="fas fa-plus"></i> New Note
                    </button>
                </div>

                <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                    <div style="flex: 1; position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
                        <input type="text" placeholder="Search notes..." style="padding-left: 2.5rem;" 
                               value="${this.state.searchQuery}" oninput="App.handleSearch(this.value)">
                    </div>
                </div>

                ${notes.length === 0 ? `
                    <div style="text-align: center; padding: 5rem 0; color: var(--text-muted);">
                        <i class="fas fa-notes-medical" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>No notes found. Create your first note to get started!</p>
                    </div>
                ` : `
                    <div class="notes-grid">
                        ${notes.map(note => `
                            <div class="card note-card fade-in" onclick="window.location.hash = '#/note/${note.id}'">
                                <h3 style="margin-bottom: 0.5rem; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">
                                    ${note.title || 'Untitled'}
                                </h3>
                                <p style="font-size: 0.875rem; color: var(--text-muted); height: 3em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                                    ${note.content || 'No content yet...'}
                                </p>
                                <div class="tags">
                                    ${note.tags.map(tag => `<span class="tag-pill">${tag}</span>`).join('')}
                                </div>
                                <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted);">
                                    <span><i class="far fa-clock"></i> ${new Date(note.updatedAt).toLocaleDateString()}</span>
                                    ${note.isPublic ? '<span><i class="fas fa-share-alt"></i> Public</span>' : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    },

    async createNewNote() {
        const note = await DB.createNote(this.state.currentUser.id);
        window.location.hash = `#/note/${note.id}`;
    },

    handleSearch(val) {
        this.state.searchQuery = val;
        // Debounce search in a real app, but for local it's fine
        this.renderPage();
    },

    // --- Page: Editor ---
    async renderEditor(container, noteId) {
        const note = await DB.getNoteById(noteId);
        if (!note) { window.location.hash = '#/notes'; return; }

        this.state.currentNote = note;

        container.innerHTML = `
            <div class="editor-container fade-in">
                <div class="main-editor">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <a href="#/notes" style="color: var(--text-muted); text-decoration: none;"><i class="fas fa-arrow-left"></i> Back</a>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-outline" onclick="App.archiveNote('${note.id}')">
                                <i class="fas fa-${note.isArchived ? 'box-open' : 'archive'}"></i>
                            </button>
                            <button class="btn btn-outline" style="color: var(--accent); border-color: var(--accent);" onclick="App.deleteNote('${note.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    <input type="text" class="note-editor-title" value="${note.title}" placeholder="Note Title" 
                           oninput="App.saveNote('${note.id}', {title: this.value})">
                    
                    <textarea class="note-editor-content" placeholder="Start writing your brilliant thoughts..." 
                              oninput="App.saveNote('${note.id}', {content: this.value})">${note.content}</textarea>
                    
                    <div style="margin-top: 2rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Tags (comma separated)</label>
                        <input type="text" value="${note.tags.join(', ')}" placeholder="productivity, ideas, meeting"
                               onchange="App.saveNote('${note.id}', {tags: this.value.split(',').map(t => t.trim()).filter(t => t)})">
                    </div>
                </div>

                <div class="ai-sidebar">
                    <div class="card" style="position: sticky; top: 1rem;">
                        <h3 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-robot" style="color: var(--primary);"></i> AI Assistant
                        </h3>

                        <div style="display: flex; flex-direction: column; gap: 1rem;">
                            <button class="btn btn-primary" onclick="App.generateAI('summary')" ${this.state.isLoadingAI ? 'disabled' : ''}>
                                <i class="fas fa-compress-alt"></i> Generate Summary
                            </button>
                            <button class="btn btn-outline" onclick="App.generateAI('actions')" ${this.state.isLoadingAI ? 'disabled' : ''}>
                                <i class="fas fa-tasks"></i> Extract Action Items
                            </button>
                            <button class="btn btn-outline" onclick="App.generateAI('title')" ${this.state.isLoadingAI ? 'disabled' : ''}>
                                <i class="fas fa-magic"></i> Suggest Title
                            </button>
                        </div>

                        ${this.state.isLoadingAI ? `
                            <div class="ai-panel shimmer" style="padding: 1.5rem; border-radius: var(--radius); margin-top: 1.5rem; text-align: center;">
                                <p>AI is thinking...</p>
                            </div>
                        ` : ''}

                        ${note.aiSummary ? `
                            <div class="ai-panel" style="padding: 1rem; border-radius: var(--radius); margin-top: 1.5rem;">
                                <h4 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--primary); margin-bottom: 0.5rem;">Summary</h4>
                                <p style="font-size: 0.875rem;">${note.aiSummary}</p>
                            </div>
                        ` : ''}

                        ${note.aiActionItems && note.aiActionItems.length > 0 ? `
                            <div class="ai-panel" style="padding: 1rem; border-radius: var(--radius); margin-top: 1.5rem;">
                                <h4 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--primary); margin-bottom: 0.5rem;">Action Items</h4>
                                <ul style="padding-left: 1.25rem; font-size: 0.875rem;">
                                    ${note.aiActionItems.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid var(--border-color);">

                        <div style="display: flex; flex-direction: column; gap: 1rem;">
                            <h4 style="font-size: 0.875rem; margin-bottom: 0.5rem;">Public Sharing</h4>
                            ${note.isPublic ? `
                                <div style="font-size: 0.75rem; background: var(--bg-color); padding: 0.5rem; border-radius: 4px; margin-bottom: 0.5rem; word-break: break-all;">
                                    ${window.location.origin}${window.location.pathname.replace('index.html', '')}share.html?token=${note.shareToken}
                                </div>
                                <button class="btn btn-outline" style="color: var(--accent); border-color: var(--accent);" onclick="App.revokeShare('${note.id}')">
                                    Revoke Access
                                </button>
                            ` : `
                                <button class="btn btn-outline" onclick="App.generateShareLink('${note.id}')">
                                    Generate Share Link
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    saveNote(id, updates) {
        // Simple auto-save implementation
        if (this._saveTimeout) clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => {
            DB.updateNote(id, updates);
            // Don't re-render entire page to avoid cursor jump, just update state
            this.state.currentNote = { ...this.state.currentNote, ...updates };
        }, 500);
    },

    async archiveNote(id) {
        const note = await DB.getNoteById(id);
        await DB.updateNote(id, { isArchived: !note.isArchived ? 1 : 0 });
        window.location.hash = '#/notes';
    },

    async deleteNote(id) {
        if (confirm('Are you sure you want to delete this note?')) {
            await DB.deleteNote(id);
            window.location.hash = '#/notes';
        }
    },

    async generateAI(type) {
        const note = this.state.currentNote;
        if (!note.content && type !== 'title') {
            alert('Please add some content to the note first.');
            return;
        }

        this.state.isLoadingAI = true;
        this.renderPage();

        try {
            if (type === 'summary') {
                const summary = await DB.generateSummary(note.content);
                await DB.updateNote(note.id, { aiSummary: summary });
            } else if (type === 'actions') {
                const items = await DB.extractActionItems(note.content);
                await DB.updateNote(note.id, { aiActionItems: items });
            } else if (type === 'title') {
                const title = await DB.suggestTitle(note.content);
                await DB.updateNote(note.id, { title: title });
            }
        } catch (err) {
            alert(err.message);
        } finally {
            this.state.isLoadingAI = false;
            this.renderPage();
        }
    },

    async generateShareLink(id) {
        await DB.generateShareToken(id);
        this.renderPage();
    },

    async revokeShare(id) {
        await DB.revokeShare(id);
        this.renderPage();
    },

    async renderDashboard(container) {
        container.innerHTML = `<div style="text-align:center; padding: 5rem;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i></div>`;
        
        try {
            const stats = await DB.getStats();

            container.innerHTML = `
                <div class="fade-in">
                    <h1 style="margin-bottom: 2rem;">Productivity Insights</h1>

                    <div class="stats-grid">
                        <div class="card stat-card">
                            <div class="stat-value">${stats.totalNotes}</div>
                            <div class="stat-label">Active Notes</div>
                        </div>
                        <div class="card stat-card">
                            <div class="stat-value">${stats.sharedNotes}</div>
                            <div class="stat-label">Publicly Shared</div>
                        </div>
                        <div class="card stat-card">
                            <div class="stat-value">${stats.totalAICalls}</div>
                            <div class="stat-label">AI Interactions</div>
                        </div>
                        <div class="card stat-card">
                            <div class="stat-value">${stats.archivedNotes}</div>
                            <div class="stat-label">Archived</div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
                        <div class="card">
                            <h3 style="margin-bottom: 1.5rem;">Weekly Activity</h3>
                            <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 150px; padding-top: 1rem;">
                                ${stats.weekly.map(day => `
                                    <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                                        <div style="width: 20px; background: var(--primary); border-radius: 4px 4px 0 0; height: ${Math.min(day.count * 20, 120)}px; transition: height 0.5s ease;"></div>
                                        <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">${day.day}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="card">
                            <h3 style="margin-bottom: 1.5rem;">AI Usage Breakdown</h3>
                            <div style="display: flex; flex-direction: column; gap: 1rem;">
                                ${['summary', 'actions', 'title'].map(type => {
                                    const val = (stats.aiUsage && stats.aiUsage[type]) || 0;
                                    const pct = stats.totalAICalls ? (val / stats.totalAICalls * 100) : 0;
                                    return `
                                        <div>
                                            <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.25rem;">
                                                <span style="text-transform: capitalize;">${type}</span>
                                                <span>${val} calls</span>
                                            </div>
                                            <div style="height: 8px; background: var(--bg-color); border-radius: 4px; overflow: hidden;">
                                                <div style="height: 100%; background: var(--secondary); width: ${pct}%;"></div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <h3 style="margin-bottom: 1.5rem;">Top Tags</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
                            ${(stats.topTags || []).map(t => `
                                <div style="background: var(--sidebar-active); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.875rem; border: 1px solid var(--border-color);">
                                    <strong>${t.tag}</strong> <span style="color: var(--text-muted); margin-left: 0.5rem;">${t.count}</span>
                                </div>
                            `).join('')}
                            ${(!stats.topTags || stats.topTags.length === 0) ? '<p style="color: var(--text-muted);">No tags used yet.</p>' : ''}
                        </div>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `
                <div style="text-align:center; padding: 5rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--accent); margin-bottom: 1rem;"></i>
                    <p>Failed to load insights. Please try again.</p>
                    <button class="btn btn-primary" style="margin-top: 1rem;" onclick="App.renderPage()">Retry</button>
                </div>
            `;
        }
    },

    // --- Page: Settings ---
    renderSettings(container) {
        container.innerHTML = `
            <div class="fade-in" style="max-width: 600px;">
                <h1 style="margin-bottom: 2rem;">Settings</h1>
                
                <div class="card" style="margin-bottom: 2rem;">
                    <h3 style="margin-bottom: 1rem;"><i class="fas fa-brain"></i> AI Engine</h3>
                    <p style="color: var(--text-muted); font-size: 0.875rem;">
                        NoteFlow AI is powered by **Llama 3.3 (70B)**. 
                        AI features are currently active and ready to use.
                    </p>
                </div>

                <div class="card">
                    <h3 style="margin-bottom: 1rem;"><i class="fas fa-user-circle"></i> Account</h3>
                    <p style="margin-bottom: 0.5rem;"><strong>Name:</strong> ${this.state.currentUser.name}</p>
                    <p style="margin-bottom: 1.5rem;"><strong>Email:</strong> ${this.state.currentUser.email}</p>
                    <button class="btn btn-outline" style="color: var(--accent); border-color: var(--accent);" onclick="App.logout()">
                        Sign Out of All Devices
                    </button>
                </div>
            </div>
        `;
    },

    saveSettings() {
        // No longer needed for API key, but kept for future settings
        alert('Settings saved successfully!');
    },

    logout() {
        DB.logout();
        this.state.currentUser = null;
        window.location.hash = '#/login';
    }
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
