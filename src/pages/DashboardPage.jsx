import React, { useState, useEffect } from 'react';
import { statsAPI } from '../api';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Share2, 
  Brain, 
  Archive, 
  TrendingUp, 
  Zap,
  Tag as TagIcon
} from 'lucide-react';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await statsAPI.getStats();
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-32 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      ))}
    </div>
  );

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="glass-card p-6 rounded-3xl flex items-center gap-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black mt-1">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Productivity Insights</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">A data-driven view of your thinking process</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={FileText} label="Total Notes" value={stats.totalNotes} color="bg-primary" />
        <StatCard icon={Share2} label="Shared" value={stats.sharedNotes} color="bg-secondary" />
        <StatCard icon={Brain} label="AI Interactions" value={stats.totalAICalls} color="bg-purple-500" />
        <StatCard icon={Archive} label="Archived" value={stats.archivedNotes} color="bg-slate-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <div className="glass-card p-8 rounded-3xl">
          <div className="flex items-center gap-3 mb-10">
            <TrendingUp className="text-primary" size={24} />
            <h3 className="text-xl font-bold">Weekly Activity</h3>
          </div>
          
          {(() => {
            const maxCount = Math.max(...stats.weekly.map(d => d.count), 1);
            return (
              <div className="flex items-end justify-between gap-3" style={{ height: '220px' }}>
                {stats.weekly.map((day, i) => {
                  const pct = (day.count / maxCount) * 100;
                  // minimum 4px bar so empty days show a stub
                  const barH = day.count > 0 ? `${Math.max(pct, 8)}%` : '4px';
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                      <div className="relative w-full flex justify-center items-end h-full">
                        {day.count > 0 && (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {day.count}
                          </span>
                        )}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: barH }}
                          transition={{ duration: 0.6, delay: i * 0.07, ease: 'easeOut' }}
                          className={`w-full max-w-[36px] rounded-t-xl group-hover:scale-x-110 transition-transform cursor-pointer ${
                            day.count > 0
                              ? 'bg-gradient-to-t from-primary to-violet-400 shadow-lg shadow-primary/20'
                              : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                        {day.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        <div className="space-y-8">
          <div className="glass-card p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-8">
              <Zap className="text-secondary" size={24} />
              <h3 className="text-xl font-bold">AI Usage Breakdown</h3>
            </div>
            
            <div className="space-y-6">
              {['summary', 'actions', 'title'].map(type => {
                const val = stats.aiUsage?.[type] || 0;
                const pct = stats.totalAICalls ? (val / stats.totalAICalls * 100) : 0;
                return (
                  <div key={type}>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="capitalize">{type}</span>
                      <span className="text-slate-400">{val} calls</span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        className="h-full bg-secondary shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-8">
              <TagIcon className="text-primary" size={24} />
              <h3 className="text-xl font-bold">Top Focus Tags</h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {stats.topTags.map(t => (
                <div key={t.tag} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover:border-primary/30 transition-colors">
                  <span className="font-bold text-sm">{t.tag}</span>
                  <span className="text-xs text-slate-400 font-medium">({t.count})</span>
                </div>
              ))}
              {stats.topTags.length === 0 && <p className="text-slate-500 text-sm italic">No tags used yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
