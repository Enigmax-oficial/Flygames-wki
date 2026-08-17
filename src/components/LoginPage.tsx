import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles, 
  Send, 
  RefreshCw, 
  CheckCheck,
  Copy,
  Check,
  ArrowRight,
  Upload,
  Camera,
  ShieldCheck,
  Edit2
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

type AuthPageStep = 
  | 'initial_email'        // 1. Initial Screen: Google Login at Top + Standard Email Input
  | 'login_password'       // Existing User: Enter password for recognized email
  | 'register_name'        // Account Creation Step 1: User's Name / Username
  | 'register_password'    // Account Creation Step 2: Set & Confirm Password
  | 'register_avatar'      // Account Creation Final Step: Profile Picture Selection & Customization
  | 'verify_email'         // Resulting Page: Unique User Code + 6-digit Email Verification
  | 'set_google_password'; // Google User Password setup if needed

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
  // Navigation step state
  const [currentStep, setCurrentStep] = useState<AuthPageStep>(
    initialVerificationId ? 'verify_email' : 'initial_email'
  );

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0].url);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Recognized user state from email check
  const [existingAccountDetails, setExistingAccountDetails] = useState<{
    username?: string;
    avatarUrl?: string;
  } | null>(null);
  
  // Image Cropping & Upload states
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email Verification Code
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationUserId, setVerificationUserId] = useState(initialVerificationId || '');

  // Google user temporary state for setting password
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

  // Status & Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle URL verification code if opened via link like /login/account/:id
  useEffect(() => {
    if (initialVerificationId) {
      setCurrentStep('verify_email');
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

  // Cancel pending verification on unmount if not completed
  useEffect(() => {
    return () => {
      if (currentStep === 'verify_email' && email) {
        fetch('/api/auth/cancel-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }).catch(() => {});
      }
    };
  }, [currentStep, email]);

  // Cooldown countdown for resending verification email
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // -------------------------------------------------------------
  // 1. INITIAL SCREEN: EMAIL CAPTURE & ROUTING
  // -------------------------------------------------------------
  const handleInitialEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json().catch(() => ({})) as any;

      if (data.exists) {
        // Registered User -> Route to dedicated password login screen
        setExistingAccountDetails({
          username: data.username,
          avatarUrl: data.avatarUrl,
        });
        setCurrentStep('login_password');
      } else {
        // New User -> Route directly to Account Creation Step 1 (Username) with pre-filled email
        // Auto-suggest a default username based on the email prefix if not already set
        if (!username) {
          const suggested = cleanEmail.split('@')[0];
          setUsername(suggested.charAt(0).toUpperCase() + suggested.slice(1));
        }
        setCurrentStep('register_name');
      }
    } catch {
      // If check fails due to network, default directly to account creation step 1
      setCurrentStep('register_name');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // EXISTING USER: LOGIN SUBMISSION
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
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

  // -------------------------------------------------------------
  // 2. ACCOUNT CREATION FLOW (MULTI-PAGE ONBOARDING)
  // -------------------------------------------------------------
  
  // Step 1: User's Name / Username -> Move to Step 2 (Password)
  const handleProceedToPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanUsername = username.trim();
    if (!cleanUsername || cleanUsername.length < 2) {
      setErrorMessage('Please enter a display name or username (at least 2 characters).');
      return;
    }
    setCurrentStep('register_password');
  };

  // Step 2: Set Password -> Move to Final Step 3 (Profile Picture Customization)
  const handleProceedToAvatar = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please check and re-enter.');
      return;
    }
    setCurrentStep('register_avatar');
  };

  // Final Step 3: Profile Customization -> Submit Account Creation & Dispatch Code
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    setIsLoading(true);

    try {
      const randomFallbackId = Array.from(crypto.getRandomValues(new Uint8Array(10)))
        .map(b => b.toString(36))
        .join('')
        .replace(/[^a-z0-9]/gi, '')
        .substring(0, 16);

      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          username: cleanUsername,
          password,
          forRegistration: true,
          avatar_url: avatarUrl || undefined,
        }),
      });

      const data = await res.json().catch(() => ({})) as any;

      if (res.ok && (data.success || data.userId)) {
        const uniqueUserCode = data.userId || randomFallbackId;
        setVerificationUserId(uniqueUserCode);

        // Update URL to match pattern: login/account/uniqueCode
        const generatedAccountPath = `/login/account/${uniqueUserCode}`;
        window.history.pushState(null, '', generatedAccountPath);
        window.dispatchEvent(new Event('popstate'));

        if (onNavigate) {
          onNavigate('login', { verificationId: uniqueUserCode });
        }

        setCurrentStep('verify_email');
        setResendCooldown(60);
        setSuccessMessage(data.message || 'Verification code sent to your email!');
      } else {
        setErrorMessage(data.error || 'Failed to dispatch verification email. Please check your email.');
      }
    } catch {
      setErrorMessage('Connection error. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // RESULTING PAGE: VERIFY EMAIL CODE
  // -------------------------------------------------------------
  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanCode = verificationCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setErrorMessage('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode,
          userId: verificationUserId,
          username: username.trim(),
          password,
          avatarUrl: avatarUrl || undefined,
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
        setSuccessMessage('Account verified successfully! Welcome to Addon Wiki.');
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
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          username: username.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({})) as any;

      if (res.ok && data.success) {
        setResendCooldown(60);
        setSuccessMessage('A fresh verification code has been dispatched to your email.');
      } else {
        setErrorMessage(data.error || 'Failed to resend verification code.');
      }
    } catch {
      setErrorMessage('Network error while resending verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // GOOGLE AUTHENTICATION
  // -------------------------------------------------------------
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
        setCurrentStep('set_google_password');
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
        setSuccessMessage('Password saved! Signed in successfully.');
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
        setErrorMessage(data.error || 'Failed to save password.');
      }
    } catch {
      setErrorMessage('Connection error while saving password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!verificationUserId) return;
    navigator.clipboard.writeText(`login/account/${verificationUserId}`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImageForCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-[#05070a] font-sans h-full min-h-[calc(100vh-64px)] relative overflow-hidden">
      {/* Image Cropper Modal */}
      {selectedImageForCrop && (
        <ImageCropper
          imageSrc={selectedImageForCrop}
          onCropComplete={(croppedBase64) => {
            setAvatarUrl(croppedBase64);
            setSelectedImageForCrop(null);
          }}
          onCancel={() => setSelectedImageForCrop(null)}
        />
      )}

      {/* Atmospheric Background Ambient Lighting */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle_at_50%_50%,#0284c7_0%,transparent_70%)]" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-[radial-gradient(circle_at_50%_50%,#3b82f6_0%,transparent_70%)]" />
      </div>

      <div className="z-10 w-full max-w-md my-auto space-y-4">
        {/* Main Authentication Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-[#0b0f19]/95 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header Brand */}
          <div className="p-6 pb-4 text-center border-b border-slate-800/50 bg-[#0d1322]/50">
            <div className="flex flex-col items-center gap-2">
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
          </div>

          {/* Form Content Pages */}
          <div className="p-6 pt-5 flex flex-col justify-center relative">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div 
                  key="success_screen"
                  initial={{ opacity: 0, scale: 0.92 }}
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
              ) : currentStep === 'initial_email' ? (
                // =========================================================
                // 1. INITIAL SCREEN: GOOGLE AT TOP + STANDARD EMAIL INPUT
                // =========================================================
                <motion.div
                  key="initial_email_screen"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="space-y-5"
                >
                  {/* "Log in with Google" Button at the TOP */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center">
                      Fast One-Click Sign In
                    </div>
                    <div className="flex justify-center w-full min-h-[44px]">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setErrorMessage('Google Sign-In was unsuccessful.')}
                        theme="filled_black"
                        shape="pill"
                        size="large"
                        width="100%"
                        text="continue_with"
                      />
                    </div>
                  </div>

                  {/* Clean Divider */}
                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-slate-800 w-full" />
                    <span className="bg-[#0b0f19] px-3 text-[11px] text-slate-500 font-medium whitespace-nowrap">
                      or continue with email
                    </span>
                    <div className="border-t border-slate-800 w-full" />
                  </div>

                  {/* Error / Alert */}
                  {errorMessage && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Standard Email Input Form */}
                  <form onSubmit={handleInitialEmailSubmit} className="space-y-4">
                    <div className="space-y-1.5">
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
                          autoFocus
                          className="w-full pl-10 pr-4 py-3 bg-[#070a12] border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !email}
                      className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-black font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-sky-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Continue</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : currentStep === 'login_password' ? (
                // =========================================================
                // EXISTING USER: PASSWORD LOGIN PAGE
                // =========================================================
                <motion.div
                  key="login_password_screen"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-4"
                >
                  {/* Account Badge / Selected Email with Change option */}
                  <div className="p-3 bg-[#070a12] border border-slate-800/80 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 truncate">
                      {existingAccountDetails?.avatarUrl ? (
                        <img 
                          src={existingAccountDetails.avatarUrl} 
                          alt="Avatar" 
                          className="w-8 h-8 rounded-lg object-cover border border-sky-500/30 shrink-0" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">
                          {existingAccountDetails?.username || 'Existing Account'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{email}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setCurrentStep('initial_email');
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Change</span>
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Enter Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoFocus
                          minLength={6}
                          className="w-full pl-10 pr-10 py-3 bg-[#070a12] border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition placeholder:text-slate-600"
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

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setCurrentStep('initial_email');
                        }}
                        className="py-3 px-4 bg-[#070a12] hover:bg-[#111827] border border-slate-800 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-black font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-sky-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <LogIn className="w-4 h-4" />
                            <span>Sign In</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : currentStep === 'register_name' ? (
                // =========================================================
                // ACCOUNT CREATION STEP 1: USER'S NAME / USERNAME
                // =========================================================
                <motion.div
                  key="register_name_page"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-4"
                >
                  {/* Account Header */}
                  <div className="space-y-1 text-center">
                    <h3 className="text-base font-black text-white tracking-tight">Create your account</h3>
                    <p className="text-xs text-slate-400">
                      Creating account for <span className="text-sky-300 font-medium">{email}</span>
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleProceedToPassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Display Name / Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="e.g. AlexCrafter"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          autoFocus
                          minLength={2}
                          className="w-full pl-10 pr-4 py-3 bg-[#070a12] border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setCurrentStep('initial_email');
                        }}
                        className="py-3 px-4 bg-[#070a12] hover:bg-[#111827] border border-slate-800 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 text-black font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-sky-500/20 active:scale-[0.98] flex items-center justify-center gap-1.5"
                      >
                        <span>Continue to Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : currentStep === 'register_password' ? (
                // =========================================================
                // ACCOUNT CREATION STEP 2: SET PASSWORD
                // =========================================================
                <motion.div
                  key="register_password_page"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-4"
                >
                  <div className="space-y-1 text-center">
                    <h3 className="text-base font-black text-white tracking-tight">Set your password</h3>
                    <p className="text-xs text-slate-400">
                      Choose a password with at least 6 characters.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleProceedToAvatar} className="space-y-3.5">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="At least 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoFocus
                          minLength={6}
                          className="w-full pl-10 pr-10 py-3 bg-[#070a12] border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition placeholder:text-slate-600"
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

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                          className="w-full pl-10 pr-4 py-3 bg-[#070a12] border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setCurrentStep('register_name');
                        }}
                        className="py-3 px-4 bg-[#070a12] hover:bg-[#111827] border border-slate-800 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 text-black font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-sky-500/20 active:scale-[0.98] flex items-center justify-center gap-1.5"
                      >
                        <span>Next: Profile Picture</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : currentStep === 'register_avatar' ? (
                // =========================================================
                // ACCOUNT CREATION FINAL STEP: PROFILE CUSTOMIZATION
                // =========================================================
                <motion.div
                  key="register_avatar_page"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-4"
                >
                  <div className="space-y-1 text-center">
                    <h3 className="text-base font-black text-white tracking-tight">Customize your avatar</h3>
                    <p className="text-xs text-slate-400">
                      Pick a voxel avatar or upload a custom photo.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleCompleteRegistration} className="space-y-4">
                    {/* Active Selected Avatar Showcase */}
                    <div className="flex flex-col items-center justify-center py-2">
                      <div className="relative group">
                        <img 
                          src={avatarUrl} 
                          alt="Selected Avatar" 
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-sky-400 shadow-xl shadow-sky-500/20 ring-4 ring-sky-500/20" 
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-1.5 -right-1.5 p-2 bg-sky-500 hover:bg-sky-400 text-black rounded-xl shadow-md transition cursor-pointer"
                          title="Upload Custom Photo"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[11px] font-bold text-white mt-2 flex items-center gap-1.5">
                        <span>{username}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 font-mono text-[10px]">{email}</span>
                      </div>
                    </div>

                    {/* Voxel Presets Selector */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                        <span>Voxel Presets</span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload Photo</span>
                        </button>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        accept="image/*" 
                        className="hidden" 
                      />
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

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setCurrentStep('register_password');
                        }}
                        className="py-3 px-4 bg-[#070a12] hover:bg-[#111827] border border-slate-800 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-black font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-sky-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Complete & Send Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : currentStep === 'verify_email' ? (
                // =========================================================
                // RESULTING PAGE: UNIQUE USER CODE & EMAIL VERIFICATION
                // =========================================================
                <motion.div
                  key="verify_email_page"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Unique User Code Card */}
                  <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 text-center space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/30">
                      <Mail className="w-5 h-5" />
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="text-sm font-bold text-white">Account Created & Code Sent</h3>
                      <p className="text-xs text-slate-400">
                        We sent a 6-digit code to <span className="text-sky-300 font-mono font-bold">{email}</span>.
                      </p>
                    </div>

                    {/* Unique Generated Code Badge */}
                    {verificationUserId && (
                      <div className="pt-2 border-t border-sky-500/20">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                          Generated Account Link / ID
                        </div>
                        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#070a12] border border-sky-500/30 text-xs font-mono text-sky-300">
                          <span className="truncate select-all">
                            login/account/<span className="text-emerald-400 font-bold">{verificationUserId}</span>
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyCode}
                            className="p-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 hover:text-white transition cursor-pointer shrink-0"
                            title="Copy Account Code Link"
                          >
                            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

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

                  <form onSubmit={handleVerifyCodeSubmit} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center">
                        6-Digit Security Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center font-mono text-2xl tracking-[0.35em] py-3 bg-[#070a12] border border-sky-500/40 rounded-xl text-white focus:outline-none focus:border-sky-400 transition"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || verificationCode.length < 6}
                      className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-black font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-sky-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                      <span>Verify & Complete Registration</span>
                    </button>
                  </form>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setCurrentStep('initial_email');
                      }}
                      className="text-slate-400 hover:text-white font-bold cursor-pointer"
                    >
                      Change Email
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
              ) : currentStep === 'set_google_password' ? (
                // =========================================================
                // GOOGLE ACCOUNT PASSWORD SETUP
                // =========================================================
                <motion.div
                  key="set_google_password_page"
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
              ) : null}
            </AnimatePresence>
          </div>

          {/* Footer Back to Portal button */}
          <div className="p-4 bg-[#070a12] border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portal</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
