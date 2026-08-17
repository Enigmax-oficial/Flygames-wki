import React, { useState, useEffect } from 'react';
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
  ShieldCheck, 
  KeyRound, 
  Send, 
  RefreshCw, 
  CheckCheck,
  Settings,
  Sliders,
  Volume2,
  VolumeX,
  Globe,
  Database,
  ChevronRight,
  Shield,
  Laptop,
  Smartphone
} from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { motion, AnimatePresence } from 'motion/react';
import { ImageCropper } from './ImageCropper';

const PRESET_AVATARS = [
  {
    id: 'steve',
    name: 'Steve',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'alex',
    name: 'Alex',
    url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'creeper',
    name: 'Creeper',
    url: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'enderman',
    name: 'Ender Mage',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'redstone',
    name: 'Redstone Mech',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'gold_apple',
    name: 'Gold Apple',
    url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=150&auto=format&fit=crop&q=80'
  }
];

interface LoginPageProps {
  onLoginSuccess: (userName: string, email: string, isAdmin?: boolean, redirectTarget?: string, avatarUrl?: string) => void;
  onBack: () => void;
  initialVerificationId?: string | null;
  onNavigate?: (pageId: string, params?: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLoginSuccess, 
  onBack, 
  initialVerificationId, 
  onNavigate 
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'verify_email' | 'set_google_password'>(initialVerificationId ? 'verify_email' : 'login');
  
  // Standard Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Image Cropping states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Email Verification Code
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationUserId, setVerificationUserId] = useState('');

  // Quick Settings state in the panel
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('etherium_sound_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const [activeTheme, setActiveTheme] = useState(() => {
    try {
      return localStorage.getItem('etherium_theme') || 'cyber';
    } catch {
      return 'cyber';
    }
  });

  const [activeLang, setActiveLang] = useState(() => {
    try {
      return localStorage.getItem('etherium_language') || 'en';
    } catch {
      return 'en';
    }
  });

  // Google user temp state for setting password
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    name: string;
    email: string;
    isAdmin: boolean;
    token?: string;
    avatarUrl?: string | null;
  } | null>(null);
  const [googlePassword, setGooglePassword] = useState('');
  const [confirmGooglePassword, setConfirmGooglePassword] = useState('');
  const [showGooglePassword, setShowGooglePassword] = useState(false);

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (initialVerificationId) {
      setMode('verify_email');
      setVerificationUserId(initialVerificationId);

      fetch(`/api/auth/verification-info?id=${encodeURIComponent(initialVerificationId)}`)
        .then((res) => res.json())
        .then((data: any) => {
          if (data.success && data.email) {
            setEmail(data.email);
            if (data.username) setUsername(data.username);
          }
        })
        .catch(() => {});
    }
  }, [initialVerificationId]);

  useEffect(() => {
    return () => {
      if (mode === 'verify_email' && email) {
        fetch('/api/auth/cancel-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }).catch(() => {});
      }
    };
  }, [mode, email]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem('etherium_sound_enabled', String(next));
    } catch {}
  };

  const handleOpenFullScreenSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    } else {
      window.history.pushState(null, '', '/settings');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setErrorMessage('Please enter a username.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          username: cleanUsername,
          password,
          avatar_url: avatarUrl || undefined,
        }),
      });

      const data = await res.json().catch(() => ({})) as any;

      if (res.ok && data.success) {
        setVerificationUserId(data.userId || '');
        if (data.userId && onNavigate) {
          onNavigate('login', { verificationId: data.userId });
        }
        setMode('verify_email');
        setResendCooldown(60);
        setSuccessMessage(data.message || 'Verification code sent to your email!');
      } else {
        setErrorMessage(data.error || 'Failed to dispatch verification email.');
      }
    } catch {
      setErrorMessage('Connection error. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanCode = verificationCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode,
          userId: verificationUserId,
        }),
      });

      const data = await res.json().catch(() => ({})) as any;

      if (res.ok && data.success) {
        if (data.token) {
          try {
            localStorage.setItem('wiki_auth_token', data.token);
            localStorage.setItem('etherium_auth_token', data.token);
            if (data.user?.is_admin === 1) {
              localStorage.setItem('wiki_admin_token', data.token);
              localStorage.setItem('etherium_admin_token', data.token);
            }
          } catch {}
        }

        setSuccess(true);
        setSuccessMessage('Email verified successfully! Welcome to Addon Wiki.');
        setTimeout(() => {
          onLoginSuccess(
            data.user?.username || username || email.split('@')[0],
            email.trim().toLowerCase(),
            data.user?.is_admin === 1,
            data.user?.is_admin === 1 ? 'admin-panel' : 'home',
            data.user?.avatar_url || avatarUrl
          );
          setSuccess(false);
        }, 600);
      } else {
        setErrorMessage(data.error || 'Invalid or expired verification code.');
      }
    } catch {
      setErrorMessage('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({})) as any;

      if (res.ok && data.success) {
        setResendCooldown(60);
        setSuccessMessage('A fresh verification code has been dispatched.');
      } else {
        setErrorMessage(data.error || 'Failed to resend code.');
      }
    } catch {
      setErrorMessage('Network error while resending verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      const data = await res.json().catch(() => ({})) as any;

      if (res.ok && data.token) {
        const isAdmin = Boolean(data.user?.is_admin === 1 || data.isAdmin);
        const displayName = data.user?.username || data.user?.name || cleanEmail.split('@')[0];

        try {
          localStorage.setItem('wiki_auth_token', data.token);
          localStorage.setItem('etherium_auth_token', data.token);
          if (isAdmin) {
            localStorage.setItem('wiki_admin_token', data.token);
            localStorage.setItem('etherium_admin_token', data.token);
          }
        } catch {}

        setSuccess(true);
        setSuccessMessage('Signed in successfully!');
        
        setTimeout(() => {
          onLoginSuccess(displayName, cleanEmail, isAdmin, isAdmin ? 'admin-panel' : 'home', data.user?.avatar_url);
          setSuccess(false);
        }, 600);
      } else {
        setErrorMessage(data.error || 'Invalid email or password.');
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
      let googleAvatar: string | null = null;

      if (data && data.user) {
        name = data.user.username || data.user.name || name;
        emailVal = data.user.email || emailVal;
        isAdmin = data.user.is_admin === 1;
        googleAvatar = data.user.avatar_url || null;
      } else {
        const decoded: any = jwtDecode(idToken);
        name = decoded.name || decoded.email?.split('@')[0] || name;
        emailVal = decoded.email || emailVal;
        googleAvatar = decoded.picture || null;
      }

      if (googleAvatar) {
        try {
          localStorage.setItem('etherium_google_avatar', googleAvatar);
        } catch {}
      }

      if (data && data.token) {
        try {
          localStorage.setItem('wiki_auth_token', data.token);
          localStorage.setItem('etherium_auth_token', data.token);
          if (isAdmin) {
            localStorage.setItem('wiki_admin_token', data.token);
            localStorage.setItem('etherium_admin_token', data.token);
          }
        } catch {}
      }

      if (data?.requiresPasswordSetup) {
        setPendingGoogleUser({
          name,
          email: emailVal,
          isAdmin,
          token: data.token,
          avatarUrl: data.user?.avatar_url || googleAvatar,
        });
        setMode('set_google_password');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setSuccessMessage('Signed in with Google!');
      setTimeout(() => {
        onLoginSuccess(name, emailVal, isAdmin, isAdmin ? 'admin-panel' : 'home', data.user?.avatar_url || googleAvatar);
        setSuccess(false);
      }, 600);
    } catch {
      setErrorMessage('Failed to complete Google authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetGooglePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogleUser) return;
    setErrorMessage('');

    if (!googlePassword || googlePassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (googlePassword !== confirmGooglePassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingGoogleUser.email,
          password: googlePassword,
          username: pendingGoogleUser.name,
        }),
      });

      const data = await res.json().catch(() => ({})) as any;

      if (res.ok && data.success) {
        if (data.token) {
          try {
            localStorage.setItem('wiki_auth_token', data.token);
            localStorage.setItem('etherium_auth_token', data.token);
            if (pendingGoogleUser.isAdmin) {
              localStorage.setItem('wiki_admin_token', data.token);
              localStorage.setItem('etherium_admin_token', data.token);
            }
          } catch {}
        }

        setSuccess(true);
        setSuccessMessage('Password saved to database! Signed in successfully.');
        setTimeout(() => {
          onLoginSuccess(
            pendingGoogleUser.name,
            pendingGoogleUser.email,
            pendingGoogleUser.isAdmin,
            pendingGoogleUser.isAdmin ? 'admin-panel' : 'home',
            data.user?.avatar_url || pendingGoogleUser.avatarUrl
          );
          setSuccess(false);
        }, 600);
      } else {
        setErrorMessage(data.error || 'Failed to save password to database.');
      }
    } catch {
      setErrorMessage('Connection error while saving password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-[#05070a] font-sans h-full min-h-[calc(100vh-64px)] relative overflow-hidden">
      {selectedImage && (
        <ImageCropper
          imageSrc={selectedImage}
          onCropComplete={(croppedBase64) => {
            setAvatarUrl(croppedBase64);
            setSelectedImage(null);
          }}
          onCancel={() => setSelectedImage(null)}
        />
      )}

      {/* Atmospheric Background Ambient Grid */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_40%,#0284c7_0%,transparent_60%)]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_50%_50%,#6366f1_0%,transparent_70%)]" />
      </div>

      <div className="z-10 w-full max-w-md my-6 space-y-4">
        {/* Main Authentication Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-[#0b0f19]/95 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Brand Header */}
          <div className="p-6 pb-3 text-center border-b border-slate-800/50 bg-[#0d1322]/50">
            <div className="flex flex-col items-center gap-2 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/25">
                <Box className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                  Addon <span className="text-sky-400">Wiki</span>
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Minecraft Portal Authentication
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            {(mode === 'login' || mode === 'register') && (
              <div className="flex items-center bg-[#070a12] p-1 rounded-2xl border border-slate-800/80 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                    setSuccessMessage('');
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
                    setSuccessMessage('');
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
            )}
          </div>

          {/* Form Content */}
          <div className="p-6 pt-4 flex flex-col justify-center relative">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-8 text-center space-y-3"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-black text-white">{successMessage || 'Signed In Successfully'}</h4>
                  <p className="text-xs text-slate-400">Loading portal workspace...</p>
                </motion.div>
              ) : mode === 'verify_email' ? (
                /* EMAIL VERIFICATION */
                <motion.div
                  key="verify_email"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-500/20 text-center space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/30">
                      <Mail className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Check Your Email Inbox</h3>
                    <p className="text-xs text-slate-400">
                      We dispatched a 6-digit code to <span className="text-sky-300 font-mono font-bold">{email}</span>.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleVerifyCodeSubmit} className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        6-Digit Security Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center font-mono text-xl tracking-[0.4em] py-3 bg-[#070a12] border border-sky-500/40 rounded-xl text-white focus:outline-none focus:border-sky-400 transition"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || verificationCode.length < 6}
                      className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-black font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                      <span>Verify & Complete Registration</span>
                    </button>
                  </form>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-slate-400 hover:text-white font-bold cursor-pointer"
                    >
                      Edit Email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0 || isLoading}
                      className="text-sky-400 hover:text-sky-300 font-bold disabled:text-slate-600 cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </motion.div>
              ) : mode === 'set_google_password' ? (
                /* GOOGLE PASSWORD SETUP */
                <motion.div
                  key="set_google_password"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-center space-y-1">
                    <h3 className="text-sm font-bold text-white">Create Wiki Password</h3>
                    <p className="text-xs text-slate-400">
                      Set a password for your account <span className="text-sky-300 font-bold">{pendingGoogleUser?.email}</span> to enable direct logins.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleSetGooglePassword} className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type={showGooglePassword ? 'text' : 'password'}
                          value={googlePassword}
                          onChange={(e) => setGooglePassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className="w-full pl-10 pr-10 py-2.5 bg-[#070a12] border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGooglePassword(!showGooglePassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showGooglePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type={showGooglePassword ? 'text' : 'password'}
                          value={confirmGooglePassword}
                          onChange={(e) => setConfirmGooglePassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className="w-full pl-10 pr-4 py-2.5 bg-[#070a12] border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-black font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-sky-500/20"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Save Password & Sign In'}
                    </button>
                  </form>
                </motion.div>
              ) : (
                /* LOGIN / REGISTER FORM */
                <motion.div
                  key="auth_form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {errorMessage && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {successMessage && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  <form onSubmit={mode === 'register' ? handleRegisterSubmit : handleLoginSubmit} className="space-y-3">
                    {mode === 'register' && (
                      <>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Wiki Username
                          </label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              type="text"
                              placeholder="EnderCrafter"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              required
                              className="w-full pl-10 pr-4 py-2.5 bg-[#070a12] border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition placeholder:text-slate-600"
                            />
                          </div>
                        </div>

                        {/* Avatar Presets for Register */}
                        <div className="space-y-1 pt-1">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Choose Voxel Avatar
                          </label>
                          <div className="grid grid-cols-6 gap-1.5">
                            {PRESET_AVATARS.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setAvatarUrl(p.url)}
                                className={`p-1 rounded-xl border transition cursor-pointer overflow-hidden ${
                                  avatarUrl === p.url
                                    ? 'bg-sky-500/20 border-sky-400 ring-2 ring-sky-500/40'
                                    : 'bg-[#070a12] border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                <img src={p.url} alt={p.name} className="w-full h-8 object-cover rounded-lg" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="email"
                          placeholder="crafter@minecraft.local"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-10 pr-4 py-2.5 bg-[#070a12] border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition placeholder:text-slate-600"
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
                          className="w-full pl-10 pr-10 py-2.5 bg-[#070a12] border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition placeholder:text-slate-600"
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
                            className="w-full pl-10 pr-4 py-2.5 bg-[#070a12] border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition placeholder:text-slate-600"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-2 py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-black font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-sky-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : mode === 'register' ? (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Continue & Verify Email</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>Sign In</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Google OAuth Section */}
                  <div className="relative flex items-center justify-center my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-800" />
                    </div>
                    <span className="relative px-3 bg-[#0b0f19] text-[10px] uppercase font-bold text-slate-500">
                      Or One-Tap Google
                    </span>
                  </div>

                  <div className="w-full flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setErrorMessage('Google Sign-In failed.')}
                      useOneTap={false}
                      theme="filled_black"
                      size="large"
                      shape="pill"
                      width="320"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Small Settings Panel with Quick Controls & Full Screen Trigger */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0b0f19]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Main Preferences & Engine</h3>
                <p className="text-[10px] text-slate-400">Quick settings before portal sign-in</p>
              </div>
            </div>

            {/* Cloudflare D1 Connection Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>D1 Online</span>
            </div>
          </div>

          {/* Quick Setting Controls Row */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition cursor-pointer ${
                soundEnabled
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                  : 'bg-[#070a12] border-slate-800 text-slate-400'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                <span>Sound FX</span>
              </span>
              <span className="text-[10px] uppercase font-mono">{soundEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Language Chip */}
            <button
              type="button"
              onClick={handleOpenFullScreenSettings}
              className="p-2.5 rounded-xl border border-slate-800 bg-[#070a12] hover:bg-[#111827] flex items-center justify-between text-xs font-bold text-slate-300 transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Lang</span>
              </span>
              <span className="text-[10px] text-sky-400 uppercase font-mono">English</span>
            </button>
          </div>

          {/* Button to Open Full-Screen Settings */}
          <button
            type="button"
            onClick={handleOpenFullScreenSettings}
            className="w-full py-2.5 px-3 bg-[#111827] hover:bg-[#1e293b] text-sky-400 hover:text-sky-300 border border-sky-500/30 hover:border-sky-500/60 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer group shadow-sm active:scale-98"
          >
            <Settings className="w-4 h-4 text-sky-400 group-hover:rotate-45 transition-transform duration-300" />
            <span>Open Full Settings Page</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>

        {/* Back to Wiki Portal Link */}
        <div className="flex justify-center pt-1">
          <button 
            onClick={onBack} 
            type="button"
            className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Addon Wiki Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
