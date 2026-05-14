import React from 'react';
import { motion } from 'framer-motion';
import { User, Brain, Shield, Bell, Moon, Sun } from 'lucide-react';

const SettingsPage = ({ user, theme, toggleTheme }) => {
  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your account and workspace preferences</p>
      </div>

      <div className="space-y-6">
        <section className="glass-card p-8 rounded-3xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <User size={20} />
            </div>
            <h3 className="text-xl font-bold">Profile Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">Full Name</label>
              <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl font-semibold">{user.name}</div>
            </div>
            <div>
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">Email Address</label>
              <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl font-semibold">{user.email}</div>
            </div>
          </div>
        </section>

        <section className="glass-card p-8 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Brain size={20} />
            </div>
            <h3 className="text-xl font-bold">AI Workspace Engine</h3>
          </div>

          <div className="p-6 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-500 text-white rounded-lg">
                <Shield size={16} />
              </div>
              <div>
                <h4 className="font-bold text-purple-600 dark:text-purple-400">Enterprise AI Active</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Your workspace is currently utilizing **Llama 3.3 (70B)** with dedicated server-side compute. 
                  All AI features are available and protected by backend security layers.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card p-8 rounded-3xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <Bell size={20} />
            </div>
            <h3 className="text-xl font-bold">Preferences</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl">
              <div className="flex items-center gap-3">
                {theme === 'light' ? <Sun size={18} className="text-slate-400" /> : <Moon size={18} className="text-slate-400" />}
                <span className="font-semibold">Dark Mode Interface</span>
              </div>
              <button 
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${theme === 'dark' ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl opacity-50">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-slate-400" />
                <span className="font-semibold">Email Notifications</span>
              </div>
              <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 rounded-full relative p-1">
                <div className="w-4 h-4 bg-white rounded-full absolute left-1" />
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-4">
          <button className="btn-outline opacity-50 cursor-not-allowed">Reset to Defaults</button>
          <button className="btn-primary px-8">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
