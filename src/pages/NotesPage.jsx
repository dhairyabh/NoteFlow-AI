import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Calendar, Share2, FileText, ChevronRight, Hash, Clock, Sparkles, X } from 'lucide-react';
import { useToast } from '../App';
import { notesAPI, aiAPI } from '../api';
import { useNavigate } from 'react-router-dom';

// Strip HTML tags for card previews
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

const NotesPage = ({ archived }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResultIds, setAiResultIds] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, [archived]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await notesAPI.getAll(archived);
      setNotes(res.data);
    } catch (err) {
      console.error("Failed to fetch notes", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(n => {
    if (aiResultIds) return aiResultIds.includes(n.id);
    
    return n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           n.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           n.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) {
      showToast("Please enter a search query first", "info");
      return;
    }
    setAiSearching(true);
    try {
      const res = await aiAPI.searchIntent(searchQuery);
      setAiResultIds(res.data.relevantIds);
      if (res.data.relevantIds.length === 0) {
        showToast("AI couldn't find highly relevant matches", "info");
      } else {
        showToast(`AI found ${res.data.relevantIds.length} relevant notes`, "success");
      }
    } catch (err) {
      showToast("AI Search failed", "error");
    } finally {
      setAiSearching(false);
    }
  };

  const clearAiSearch = () => {
    setAiResultIds(null);
    setSearchQuery('');
  };

  const createNote = async () => {
    try {
      const res = await notesAPI.create({ title: 'New Masterpiece', content: '' });
      navigate(`/note/${res.data.id}`);
    } catch (err) {
      console.error("Failed to create note", err);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-5xl font-black tracking-tighter">
            {archived ? 'Archived' : 'My Workspace'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            {archived ? 'Preserved thoughts and records' : `${notes.length} intelligent notes active`}
          </p>
        </motion.div>

        {!archived && (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={createNote} 
            className="btn-primary group"
          >
            <div className="p-1 bg-white/20 rounded-lg group-hover:rotate-90 transition-transform">
              <Plus size={20} />
            </div>
            <span>New Work</span>
          </motion.button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative group flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="Search through your digital brain..."
            className="w-full pl-14 pr-6 py-5 rounded-[2rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm text-lg font-medium"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (aiResultIds) setAiResultIds(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {aiResultIds ? (
              <button 
                onClick={clearAiSearch}
                className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors"
                title="Clear AI Results"
              >
                <X size={20} />
              </button>
            ) : (
              <button 
                onClick={handleAiSearch}
                disabled={aiSearching}
                className={`p-3 rounded-2xl flex items-center gap-2 transition-all ${
                  aiSearching 
                  ? 'bg-primary/20 text-primary animate-pulse' 
                  : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                }`}
              >
                <Sparkles size={20} className={aiSearching ? 'animate-spin' : ''} />
                <span className="hidden sm:inline font-bold text-sm">
                  {aiSearching ? 'Searching...' : 'AI Search'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 rounded-[2.5rem] bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
        >
          <AnimatePresence>
            {filteredNotes.map((note) => (
              <motion.div
                key={note.id}
                variants={item}
                layout
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                onClick={() => navigate(`/note/${note.id}`)}
                className="glass-card p-8 rounded-[2.5rem] cursor-pointer group hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all relative overflow-hidden"
              >
                {/* Accent line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <FileText size={24} />
                  </div>
                  <div className="flex gap-2">
                    {note.isPublic && (
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-secondary px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20">
                        <Share2 size={12} /> Public
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-black mb-3 group-hover:text-primary transition-colors line-clamp-1 tracking-tight">
                  {note.title || 'Untitled Thought'}
                </h3>
                
                <p className="text-slate-500 dark:text-slate-400 text-base line-clamp-3 mb-6 leading-relaxed font-medium">
                  {stripHtml(note.content) || 'Write something amazing...'}
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {note.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200/50 dark:border-slate-700/50">
                      <Hash size={10} /> {tag}
                    </span>
                  ))}
                  {note.tags?.length > 3 && (
                    <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-primary/5 text-primary border border-primary/10">
                      +{note.tags.length - 3} more
                    </span>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <ChevronRight size={18} className="text-primary" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {!loading && filteredNotes.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-32 flex flex-col items-center glass-card rounded-[3rem]"
        >
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-300 mb-6 shadow-inner">
            <Search size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-400">Deep silence...</h2>
          <p className="text-slate-500 font-medium mt-2">No notes match your current search.</p>
          <button onClick={() => setSearchQuery('')} className="mt-6 text-primary font-bold hover:underline">Clear search filters</button>
        </motion.div>
      )}
    </div>
  );
};

export default NotesPage;
