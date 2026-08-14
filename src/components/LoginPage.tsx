import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Box, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { motion, AnimatePresence } from 'motion/react';

interface LoginPageProps {
  onLoginSuccess: (userName: string, email: string, isAdmin?: boolean, redirectTarget?: string) => void;
  onBack: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleStandardAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload: any = {
        email: cleanEmail,
        password,
      };
      if (mode === 'register' && username.trim()) {
        payload.username = username.trim();
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as any;

      if (res.ok && data.token) {
        const isAdmin = Boolean(data.user?.is_admin === 1 || data.isAdmin);
        const displayName = data.user?.username || data.user?.name || username.trim() || cleanEmail.split('@')[0];

        try {
          localStorage.setItem('wiki_auth_token', data.token);
          localStorage.setItem('etherium_auth_token', data.token);
          if (isAdmin) {
            localStorage.setItem('wiki_admin_token', data.token);
            localStorage.setItem('etherium_admin_token', data.token);
          }
        } catch {
          // Ignore localStorage errors
        }

        setSuccess(true);
        setSuccessMessage(mode === 'register' ? 'Account created successfully!' : 'Signed in successfully!');
        
        setTimeout(() => {
          onLoginSuccess(displayName, cleanEmail, isAdmin, isAdmin ? 'admin-panel' : 'home');
          setSuccess(false);
        }, 600);
      } else {
        setErrorMessage(data.error || (mode === 'register' ? 'Failed to create account.' : 'Invalid email or password.'));
      }
    } catch {
      setErrorMessage('Could not connect to the authentication server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setErrorMessage('Google Sign-In failed. No credential received.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const idToken = credentialResponse.credential;
      const res = await fetch('/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken }),
      });
      const data = await res.json() as any;

      let name = 'User';
      let emailVal = 'user@addonwiki.local';
      let isAdmin = false;

      if (data && data.user) {
        name = data.user.username || data.user.name || name;
        emailVal = data.user.email || emailVal;
        isAdmin = data.user.is_admin === 1;
      } else {
        const decoded: any = jwtDecode(idToken);
        name = decoded.name || decoded.email?.split('@')[0] || name;
        emailVal = decoded.email || emailVal;
      }

      if (data && data.token) {
        try {
          localStorage.setItem('wiki_auth_token', data.token);
          localStorage.setItem('etherium_auth_token', data.token);
          if (isAdmin) {
            localStorage.setItem('wiki_admin_token', data.token);
            localStorage.setItem('etherium_admin_token', data.token);
          }
        } catch {
          // Ignore localStorage errors
        }
      }

      setSuccess(true);
      setSuccessMessage('Signed in with Google!');
      setTimeout(() => {
        onLoginSuccess(name, emailVal, isAdmin, isAdmin ? 'admin-panel' : 'home');
        setSuccess(false);
      }, 600);
    } catch {
      setErrorMessage('Failed to complete Google authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#05070a] font-sans h-full min-h-[calc(100vh-64px)] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,transparent_70%)]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 w-full max-w-md bg-[#0b0f19]/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden my-6"
      >
        {/* Header/Branding */}
        <div className="p-6 sm:p-8 pb-4 text-center">
          <motion.div 
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            className="flex flex-col items-center gap-2 mb-2"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Box className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                Addon <span className="text-sky-400">Wiki</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1.5 mt-0.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Community & Knowledge Portal
              </p>
            </div>
          </motion.div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-[#070a12] p-1 rounded-2xl border border-slate-800/80 mt-4">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login'
                  ? 'bg-sky-500 text-black shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'register'
                  ? 'bg-sky-500 text-black shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 pt-2 flex flex-col justify-center relative">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h4 className="text-xl font-black text-white">{successMessage || 'Login Successful'}</h4>
                <p className="text-xs text-slate-400">
                  Redirecting to the portal...
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key={mode}
                initial={{ opacity: 0, x: mode === 'login' ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Information badge stating no admin is required */}
                <div className="px-3.5 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-2.5 text-emerald-300/90 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    No administrator is required. Open access for all members.
                  </span>
                </div>

                {errorMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{errorMessage}</span>
                  </motion.div>
                )}

                {/* Email/Password Form */}
                <form onSubmit={handleStandardAuth} className="space-y-3.5">
                  {mode === 'register' && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Display Name / Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Your display name"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-[#070a12] border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-[#070a12] border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pl-10 pr-10 py-2.5 bg-[#070a12] border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                          className="w-full pl-10 pr-4 py-2.5 bg-[#070a12] border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-black font-extrabold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : mode === 'register' ? (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Create Wiki Account</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <span className="relative px-3 bg-[#0b0f19] text-[10px] uppercase font-bold text-slate-500">
                    Or Continue With
                  </span>
                </div>

                {/* Google Sign-In Option */}
                <div className="w-full flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      setErrorMessage('Google Sign-In failed.');
                    }}
                    useOneTap={false}
                    theme="filled_black"
                    size="large"
                    shape="pill"
                    width="300"
                  />
                </div>

                {/* Navigation Back */}
                <div className="flex justify-center pt-2">
                  <button 
                    onClick={onBack} 
                    type="button"
                    className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Wiki Portal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
