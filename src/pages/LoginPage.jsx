import React, { useState } from 'react';
import { authAPI } from '../api';
import { GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Brain, Sparkles, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const LoginPage = ({ isSignup, onLogin }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignup) {
        const res = await authAPI.register(formData);
        localStorage.setItem('nf_token', res.data.token);
      } else {
        const res = await authAPI.login({ email: formData.email, password: formData.password });
        localStorage.setItem('nf_token', res.data.token);
      }
      onLogin();
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.googleLogin(credentialResponse.credential);
      localStorage.setItem('nf_token', res.data.token);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.message || 'Google Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 glass-card rounded-[3rem] overflow-hidden shadow-2xl"
      >
        {/* Left Side: Illustration & Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 premium-gradient text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8">
              <img src="/noteflow_logo.png" alt="Logo" className="w-10 h-10" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter leading-tight">
              Future of <br /> <span className="shimmer-text">Note Taking</span>
            </h1>
            <p className="mt-6 text-white/80 text-lg font-medium leading-relaxed max-w-sm">
              Experience an AI-driven workspace that organizes your thoughts, 
              summarizes meetings, and extracts action items instantly.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <Sparkles size={24} className="mb-2" />
              <p className="text-sm font-bold">Llama 3 Power</p>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <ShieldCheck size={24} className="mb-2" />
              <p className="text-sm font-bold">Secured Logic</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-10 md:p-16 flex flex-col justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl">
          <div className="mb-10 lg:hidden text-center">
            <img src="/noteflow_logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-black tracking-tight">NoteFlow AI</h2>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight mb-2">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {isSignup ? 'Join 5,000+ power users today' : 'Continue your productive flow'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold rounded-2xl flex items-center gap-3"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignup && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    required
                    className="input-field pl-14"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  required
                  className="input-field pl-14"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  required
                  className="input-field pl-14"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-5 rounded-[1.5rem] group mt-4 overflow-hidden relative"
            >
              <motion.div
                className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500"
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isSignup ? 'Get Started' : 'Sign In Now'}</span>
                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-4 text-slate-400 font-black tracking-widest">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Login Failed')}
              useOneTap
              theme="filled_blue"
              shape="pill"
              text={isSignup ? "signup_with" : "signin_with"}
              width="100%"
            />
          </div>

          <div className="mt-10 text-center">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {isSignup ? 'Already have an account?' : 'New to NoteFlow?'} 
              <Link to={isSignup ? "/login" : "/signup"} className="text-primary font-black ml-2 hover:underline">
                {isSignup ? 'Sign In' : 'Create Account'}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
