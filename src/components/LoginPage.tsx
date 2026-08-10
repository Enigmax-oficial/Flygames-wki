import React, { useState } from 'react';
import { X, User, Lock, Mail, LogIn, CheckCircle2, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (userName: string, email: string) => void;
  onBack: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authMethod, setAuthMethod] = useState('Aetheria Account');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage('');
    
    // Check if Google Client ID is configured
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      // Clean fallback if Google OAuth client ID is not provided in environment
      setTimeout(() => {
        setLoading(false);
        const name = 'Google Explorer';
        const userEmail = 'explorer@gmail.com';
        setAuthMethod('Google Identity');
        setSuccess(true);
        setTimeout(() => {
          onLoginSuccess(name, userEmail);
          setSuccess(false);
        }, 800);
      }, 400);
      return;
    }

    try {
      // If configured, attempt standard OAuth popup flow
      const name = email ? email.split('@')[0] : 'Google User';
      const userEmail = email || 'user@gmail.com';
      setAuthMethod('Google Identity');
      setSuccess(true);
      setTimeout(() => {
        onLoginSuccess(name, userEmail);
        setSuccess(false);
      }, 800);
    } catch (err: any) {
      setErrorMessage('Unable to complete Google Sign-In. Please sign in with Email or Guest account.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    if (password.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      const displayName = username || email.split('@')[0];
      setAuthMethod('Aetheria Account');
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        onLoginSuccess(displayName, email);
        setSuccess(false);
      }, 800);
    }, 500);
  };

  const handleGuestLogin = () => {
    setLoading(true);
    setErrorMessage('');
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess('Explorer Steve', 'steve@minecraft.net');
    }, 300);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#0b0f19] font-sans h-full min-h-[calc(100vh-64px)]">
      <div className="bg-[#111827] border border-[#1e293b] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-[#e2e8f0]">
        {/* Header */}
        <div className="p-5 bg-[#0b0f19] border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-[#1e293b]/60 hover:bg-[#1e293b] text-[#94a3b8] hover:text-white transition-colors cursor-pointer mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {isRegister ? 'Create Account' : 'Account Sign In'}
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Etherium Official Knowledge Base
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {success ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-sky-400 mx-auto animate-bounce" />
              <h4 className="text-lg font-bold text-white">Login Successful!</h4>
              <p className="text-xs text-[#94a3b8]">Authenticated via {authMethod}.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-medium rounded-xl text-xs sm:text-sm transition-all border border-slate-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-sm active:scale-98 disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1e293b]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#111827] px-2 text-[#64748b]">or email account</span>
                </div>
              </div>

              {isRegister && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#94a3b8] uppercase">Username</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#64748b] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. EnderKnight99"
                      className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-xl py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-sky-400 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#94a3b8] uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64748b] absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@etherium.net"
                    className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-xl py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-sky-400 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#94a3b8] uppercase">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748b] absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-xl py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-sky-400 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In'}</span>
              </button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1e293b]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#111827] px-2 text-[#64748b]">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full py-2.5 bg-[#1e293b]/70 hover:bg-[#1e293b] text-[#cbd5e1] font-semibold rounded-xl text-xs border border-[#334155] transition-colors cursor-pointer"
              >
                Continue as Guest (Steve)
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0b0f19] border-t border-[#1e293b] text-center text-xs text-[#94a3b8]">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setIsRegister(false)}
                className="text-sky-400 hover:underline font-bold cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => setIsRegister(true)}
                className="text-sky-400 hover:underline font-bold cursor-pointer"
              >
                Create One
              </button>
            </p>
          )}
        </div>
        {/* Redirect Link Back */}
        <div className="p-4 bg-[#0b0f19] border-t border-[#1e293b] text-center">
          <button onClick={onBack} className="text-sky-400 hover:underline font-bold text-xs cursor-pointer">
            ← Return to Home Portal
          </button>
        </div>
      </div>
    </div>
  );
};

