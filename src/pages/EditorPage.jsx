import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../App';
import { notesAPI, aiAPI } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Trash2, 
  Archive, 
  Share2, 
  Brain, 
  CheckCircle2, 
  Sparkles, 
  LayoutList,
  Check,
  ExternalLink,
  Save,
  Tag as TagIcon,
  ChevronRight
} from 'lucide-react';
import debounce from 'lodash/debounce';
import RichTextEditor from '../components/RichTextEditor';

// Strip HTML tags to get plain text for AI
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

const EditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const { showToast, showConfirm } = useToast();

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      const res = await notesAPI.getAll(false);
      const resArchived = await notesAPI.getAll(true);
      const all = [...res.data, ...resArchived.data];
      const found = all.find(n => n.id === id);
      if (found) setNote(found);
      else navigate('/notes');
    } catch (err) {
      console.error(err);
      navigate('/notes');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSave = useCallback(
    debounce(async (updates) => {
      setIsSaving(true);
      try {
        await notesAPI.update(id, updates);
      } catch (err) {
        console.error("Save failed", err);
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    [id]
  );

  const handleUpdate = (updates) => {
    setNote(prev => ({ ...prev, ...updates }));
    debouncedSave(updates);
  };

  const generateAI = async (type) => {
    const plainText = stripHtml(note.content);
    if (!plainText) {
      showToast("Please add some content to the note first!", "error");
      return;
    }
    setAiLoading(true);
    try {
      let result;
      if (type === 'summary') {
        const res = await aiAPI.summarize(plainText);
        result = { aiSummary: res.data.summary };
      } else if (type === 'actions') {
        const res = await aiAPI.extractActions(plainText);
        result = { aiActionItems: res.data.actions };
      } else if (type === 'title') {
        const res = await aiAPI.suggestTitle(plainText);
        result = { title: res.data.title };
      }
      setNote(prev => ({ ...prev, ...result }));
      await notesAPI.update(id, result);
    } catch (err) {
      console.error("AI Error", err);
      showToast("AI generation failed. Please try again.", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const toggleArchive = async () => {
    const isArchived = note.isArchived ? 0 : 1;
    handleUpdate({ isArchived });
    navigate('/notes');
  };

  const deleteNote = async () => {
    showConfirm("Are you sure you want to permanently delete this note? This action cannot be undone.", async () => {
      await notesAPI.delete(id);
      navigate('/notes');
      showToast("Note deleted successfully.", "success");
    });
  };

  const toggleShare = async () => {
    if (note.isPublic) {
      await notesAPI.revoke(id);
      setNote(prev => ({ ...prev, isPublic: 0, shareToken: null }));
    } else {
      const res = await notesAPI.share(id);
      setNote(prev => ({ ...prev, isPublic: 1, shareToken: res.data.shareToken }));
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
       <div className="animate-pulse text-primary font-black uppercase tracking-[0.2em]">Synchronizing...</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-12">
        <Link to="/notes" className="flex items-center gap-3 text-slate-500 hover:text-primary transition-all font-bold group">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-slate-800/50 group-hover:-translate-x-1 transition-transform">
            <ArrowLeft size={20} />
          </div>
          <span>Back</span>
        </Link>

        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.span 
                key="saving"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10"
              >
                <div className="w-2 h-2 bg-primary rounded-full animate-ping" /> Auto-Saving
              </motion.span>
            ) : (
              <motion.span 
                key="saved"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="text-[10px] font-black uppercase tracking-widest text-green-500 flex items-center gap-2 px-4 py-2 bg-green-500/5 rounded-full border border-green-500/10"
              >
                <Check size={14} /> Synced
              </motion.span>
            )}
          </AnimatePresence>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />

          <button onClick={toggleArchive} className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
            <Archive size={22} />
          </button>
          <button onClick={deleteNote} className="p-3 rounded-2xl hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20">
            <Trash2 size={22} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Title */}
          <textarea 
            placeholder="Untitled Masterpiece"
            rows={1}
            className="text-5xl font-black bg-transparent border-none outline-none w-full placeholder:text-slate-200 dark:placeholder:text-slate-800 tracking-tighter leading-tight resize-none overflow-hidden mb-4"
            value={note.title}
            onChange={(e) => {
              handleUpdate({ title: e.target.value });
              e.target.style.height = 'inherit';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
          />

          {/* Rich Text Editor */}
          <RichTextEditor 
            content={note.content}
            onChange={(html) => handleUpdate({ content: html })}
          />

          {/* Tags */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <TagIcon size={16} className="text-slate-400" />
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Organization Tags</label>
            </div>
            <input 
              type="text" 
              placeholder="E.g. Business, Personal, Vision (comma separated)"
              className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary w-full text-base font-bold transition-all"
              value={note.tags?.join(', ')}
              onChange={(e) => handleUpdate({ tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
            />
          </div>
        </motion.div>

        <aside className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 rounded-[2.5rem] border-primary/20 sticky top-8 max-h-[calc(100vh-6rem)] overflow-y-auto"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                <Brain size={20} />
              </div>
              <h3 className="text-xl font-black">AI Engine</h3>
            </div>

            <div className="space-y-3">
              {[
                { type: 'summary', label: 'Summarize Context', icon: Sparkles, color: 'hover:bg-primary' },
                { type: 'actions', label: 'Extract Action Plan', icon: CheckCircle2, color: 'hover:bg-secondary' },
                { type: 'title', label: 'Optimize Title', icon: LayoutList, color: 'hover:bg-purple-500' },
              ].map((btn) => (
                <button 
                  key={btn.type}
                  onClick={() => generateAI(btn.type)}
                  disabled={aiLoading}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 transition-all font-bold group border border-transparent ${btn.color} hover:text-white hover:scale-[1.02] active:scale-95 disabled:opacity-50`}
                >
                  <div className="flex items-center gap-3">
                    <btn.icon size={18} className="group-hover:rotate-12 transition-transform" />
                    <span>{btn.label}</span>
                  </div>
                  <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>

            <AnimatePresence>
              {aiLoading && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mt-6 p-6 rounded-3xl premium-gradient text-white relative overflow-hidden"
                >
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <Brain size={24} className="animate-bounce" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Processing Brainwaves</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4 mt-2">
              <AnimatePresence>
                {note.aiSummary && !aiLoading && (
                  <motion.div 
                    key="summary"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="p-6 rounded-3xl bg-primary/5 border border-primary/20 relative"
                  >
                    <div className="absolute top-4 right-4"><Sparkles size={12} className="text-primary animate-pulse" /></div>
                    <label className="text-[10px] font-black uppercase text-primary tracking-widest block mb-3">Analysis Result</label>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium italic">{note.aiSummary}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {note.aiActionItems?.length > 0 && !aiLoading && (
                  <motion.div 
                    key="actions"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="p-6 rounded-3xl bg-secondary/5 border border-secondary/20"
                  >
                    <label className="text-[10px] font-black uppercase text-secondary tracking-widest block mb-4">Master Action Plan</label>
                    <ul className="space-y-3">
                      {note.aiActionItems.map((item, i) => (
                        <li key={i} className="flex gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                          <div className="w-5 h-5 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                            <Check size={12} strokeWidth={4} />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-800 my-10" />

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Share2 size={18} />
                  <span className="font-black text-sm uppercase tracking-widest">Global Share</span>
                </div>
                <button 
                  onClick={toggleShare}
                  className={`w-12 h-6 rounded-full transition-all relative ${note.isPublic ? 'bg-secondary' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <motion.div 
                    animate={{ x: note.isPublic ? 24 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md" 
                  />
                </button>
              </div>

              {note.isPublic && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3"
                >
                  <div className="p-4 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl text-[11px] break-all text-slate-500 font-bold border border-slate-200/50 dark:border-slate-800/50">
                    {`${window.location.origin}/#/share?token=${note.shareToken}`}
                  </div>
                  <a 
                    href={`/#/share?token=${note.shareToken}`} 
                    target="_blank" 
                    className="flex items-center justify-center gap-2 w-full py-4 bg-secondary text-white text-sm font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-secondary/20"
                  >
                    <ExternalLink size={18} /> Open Public Link
                  </a>
                </motion.div>
              )}
            </div>
          </motion.div>
        </aside>
      </div>
    </div>
  );
};

export default EditorPage;
