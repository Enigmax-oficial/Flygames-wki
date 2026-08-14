import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminSetupPageProps {
  onSetupComplete: (email: string) => void;
  onBackToLogin: () => void;
}

export const AdminSetupPage: React.FC<AdminSetupPageProps> = ({ onSetupComplete, onBackToLogin }) => {
  const [bootstrapUsername, setBootstrapUsername] = useState('adm');
  const [bootstrapPassword, setBootstrapPassword] = useState('admin');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (bootstrapUsername.trim() !== 'adm' || bootstrapPassword.trim() !== 'admin') {
      setError('Bootstrap credentials invalid. Use user "adm" and password "admin".');
      return;
    }

    if (!newAdminEmail || !newAdminEmail.includes('@')) {
      setError('Please enter a valid email for the administrator.');
      return;
    }

    if (!newAdminPassword || newAdminPassword.length < 6) {
      setError('The administrator password must be at least 6 characters long.');
      return;
    }

    if (newAdminPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/auth/admin/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: bootstrapUsername,
          password: bootstrapPassword,
          email: newAdminEmail,
          adminPassword: newAdminPassword
        }),
      });
      const data = await res.json() as any;

      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSetupComplete(newAdminEmail);
        }, 1000);
      } else {
        setError(data.error || 'Failed to create administrator account.');
      }
    } catch {
      setError('Connection error with the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#05070a] font-sans h-full min-h-[calc(100vh-64px)] relative overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#f59e0b_0%,transparent_70%)] opacity-20" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 w-full max-w-md bg-[#0b0f19]/80 backdrop-blur-xl border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 pb-4 text-center">
          <motion.div 
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            className="flex flex-col items-center gap-3 mb-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">
                Master <span className="text-amber-500">Initialization</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                First Time Setup
              </p>
            </div>
          </motion.div>
        </div>

        {/* Form Body */}
        <div className="p-8 pt-0 space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}

          {success ? (
            <div className="py-12 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-xl font-black text-white uppercase tracking-tight">Account Created</h4>
              <p className="text-sm text-slate-400">
                Granting administrative privileges...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                <p className="text-[11px] text-amber-200/60 leading-relaxed text-center italic">
                  Complete the form below to create your permanent administrator account. This access will be used to manage the entire wiki database.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      placeholder="admin@domain.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:border-amber-500 transition-all font-mono placeholder:text-slate-700"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Secure Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:border-amber-500 transition-all font-mono tracking-widest placeholder:tracking-normal placeholder:text-slate-700"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:border-amber-500 transition-all font-mono tracking-widest placeholder:tracking-normal placeholder:text-slate-700"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-black font-black rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50 shadow-xl shadow-amber-500/10 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Initialize System
                    </>
                  )}
                </button>
              </div>

              <div className="flex justify-center">
                <button 
                  type="button"
                  onClick={onBackToLogin} 
                  className="text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Cancel Setup
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>

  );
};
