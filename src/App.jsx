import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { authAPI } from './api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  StickyNote, 
  LayoutDashboard, 
  Archive, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  Plus,
  Menu,
  X,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

// Pages
import LoginPage from './pages/LoginPage';
import NotesPage from './pages/NotesPage';
import EditorPage from './pages/EditorPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import PublicNotePage from './pages/PublicNotePage';

export const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('nf_theme') || 'dark');
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null); // { message, onConfirm, onCancel }

  useEffect(() => {
    checkAuth();
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('nf_theme', theme);
  }, [theme]);

  const checkAuth = async () => {
    const token = localStorage.getItem('nf_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authAPI.me();
      setUser(res.data);
    } catch (err) {
      localStorage.removeItem('nf_token');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmModal({
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f172a]">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mb-8"
      >
        <img src="/noteflow_logo.png" alt="Logo" className="w-16 h-16" />
      </motion.div>
      <div className="w-48 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full bg-primary"
        />
      </div>
    </div>
  );

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      <Router>
        <div className="bg-mesh" />
        <div className="blob top-0 left-0 from-primary" />
        <div className="blob bottom-0 right-0 from-secondary" />
        
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/login" element={!user ? <LoginPage onLogin={checkAuth} /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <LoginPage isSignup onLogin={checkAuth} /> : <Navigate to="/" />} />
            <Route path="/share" element={<PublicNotePage />} />
            
            <Route path="/*" element={
              user ? (
                <Layout user={user} theme={theme} toggleTheme={toggleTheme} onLogout={() => {
                  localStorage.removeItem('nf_token');
                  setUser(null);
                }}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/notes" />} />
                    <Route path="/notes" element={<PageWrapper><NotesPage /></PageWrapper>} />
                    <Route path="/archive" element={<PageWrapper><NotesPage archived /></PageWrapper>} />
                    <Route path="/note/:id" element={<PageWrapper><EditorPage /></PageWrapper>} />
                    <Route path="/dashboard" element={<PageWrapper><DashboardPage /></PageWrapper>} />
                    <Route path="/settings" element={<PageWrapper><SettingsPage user={user} theme={theme} toggleTheme={toggleTheme} /></PageWrapper>} />
                  </Routes>
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            } />
          </Routes>
        </AnimatePresence>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {confirmModal && (
            <div className="modal-overlay">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="modal-content"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
                    <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-2xl font-black mb-3">Wait a moment!</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 leading-relaxed">
                    {confirmModal.message}
                  </p>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <button 
                      onClick={confirmModal.onCancel}
                      className="px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmModal.onConfirm}
                      className="px-6 py-4 rounded-2xl bg-red-500 text-white font-black shadow-lg shadow-red-500/20 hover:scale-[1.05] active:scale-95 transition-all"
                    >
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Toast Container */}
        <div className="toast-container">
          <AnimatePresence>
            {toasts.map(toast => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                className={`toast-item ${toast.type}`}
              >
                {toast.type === 'success' && <CheckCircle2 className="text-green-500" size={20} />}
                {toast.type === 'error' && <AlertCircle className="text-red-500" size={20} />}
                {toast.type === 'info' && <Info className="text-primary" size={20} />}
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{toast.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Router>
    </ToastContext.Provider>
  );
};

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

const Layout = ({ children, user, theme, toggleTheme, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        onClick={() => setMobileMenuOpen(false)}
        className={`nav-item group ${isActive ? 'active' : ''}`}
      >
        <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-primary text-white shadow-lg' : 'group-hover:bg-primary/10'}`}>
          <Icon size={20} />
        </div>
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 glass-sidebar px-8 pt-8 pb-6 flex flex-col transition-all duration-500 overflow-y-auto
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-4 mb-12 px-2">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="w-12 h-12 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50"
          >
            <img src="/noteflow_logo.png" alt="Logo" className="w-full h-full object-contain" />
          </motion.div>
          <span className="text-2xl font-black tracking-tighter text-slate-800 dark:text-white">
            NoteFlow <span className="text-primary italic">AI</span>
          </span>
        </div>

        <nav className="flex-1 space-y-3">
          <NavItem to="/notes" icon={StickyNote} label="All Notes" />
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Insights" />
          <NavItem to="/archive" icon={Archive} label="Archive" />
          <NavItem to="/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="mt-auto space-y-2 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold"
          >
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all font-bold"
          >
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-red-500/20">
              <LogOut size={20} />
            </div>
            <span>Logout</span>
          </button>

          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Authenticated</p>
            <p className="text-sm font-black truncate text-slate-800 dark:text-white">{user.name}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-80 min-h-screen relative">
        <div className="p-8 lg:p-12 max-w-[1400px] mx-auto">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <img src="/noteflow_logo.png" alt="Logo" className="w-10 h-10" />
              <span className="font-black text-xl">NoteFlow AI</span>
            </div>
            <button onClick={() => setMobileMenuOpen(true)} className="p-3 rounded-2xl glass-card">
              <Menu size={24} />
            </button>
          </div>
          
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-md lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
