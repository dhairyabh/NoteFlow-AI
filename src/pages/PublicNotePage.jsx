import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { notesAPI } from '../api';
import { motion } from 'framer-motion';
import { Brain, Calendar, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

const PublicNotePage = () => {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) fetchPublicNote(token);
    else {
      setError("Invalid share link.");
      setLoading(false);
    }
  }, [location]);

  const fetchPublicNote = async (token) => {
    try {
      const res = await notesAPI.getPublic(token);
      setNote(res.data);
    } catch (err) {
      setError("This note is private or no longer exists.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0f172a]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0f172a] p-6">
      <div className="glass-card p-10 rounded-3xl max-w-lg text-center">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <X size={40} />
        </div>
        <h1 className="text-3xl font-bold mb-4">Note Not Found</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">{error}</p>
        <Link to="/login" className="btn-primary inline-flex">Go to NoteFlow AI</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] py-20 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-12">
          <div className="space-y-6 flex-1">
            <Link to="/" className="flex items-center gap-2 group">
              <img src="/noteflow_logo.png" alt="Logo" className="w-8 h-8" />
              <span className="font-bold text-slate-400 group-hover:text-primary transition-colors">NoteFlow AI</span>
            </Link>
            
            <h1 className="text-6xl font-black tracking-tight leading-tight">{note.title || 'Untitled Note'}</h1>
            
            <div className="flex flex-wrap gap-2">
              {note.tags?.map(tag => (
                <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-widest">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 text-slate-400 text-sm font-medium mb-1">
              <Calendar size={14} />
              <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Publicly Shared Note</p>
          </div>
        </header>

        <article className="prose prose-slate dark:prose-invert max-w-none text-xl leading-relaxed whitespace-pre-wrap">
          {note.content}
        </article>

        {(note.aiSummary || (note.aiActionItems && note.aiActionItems.length > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-200 dark:border-slate-800">
            {note.aiSummary && (
              <div className="p-8 rounded-3xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 mb-4 text-primary">
                  <Sparkles size={20} />
                  <h3 className="font-bold uppercase tracking-widest text-xs">AI Summary</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic">{note.aiSummary}</p>
              </div>
            )}

            {note.aiActionItems?.length > 0 && (
              <div className="p-8 rounded-3xl bg-secondary/5 border border-secondary/10">
                <div className="flex items-center gap-2 mb-4 text-secondary">
                  <CheckCircle2 size={20} />
                  <h3 className="font-bold uppercase tracking-widest text-xs">Action Items</h3>
                </div>
                <ul className="space-y-3">
                  {note.aiActionItems.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                      <ChevronRight size={16} className="text-secondary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <footer className="pt-20 text-center">
          <div className="glass-card p-12 rounded-[3rem] bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10">
            <h2 className="text-3xl font-bold mb-4">Inspired by this note?</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
              NoteFlow AI helps you turn raw thoughts into organized, AI-powered action plans. Build your own workspace today.
            </p>
            <Link to="/signup" className="btn-primary inline-flex px-10 py-4 text-lg">
              Get Started for Free
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PublicNotePage;
