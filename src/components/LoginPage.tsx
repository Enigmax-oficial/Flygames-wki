import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft, 
  Box, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { motion, AnimatePresence } from 'motion/react';

interface LoginPageProps {
  onLoginSuccess: (userName: string, email: string, isAdmin?: boolean, redirectTarget?: string) => void;
  onBack: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack }) => {
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasAdmin, setHasAdmin] = useState<boolean>(true);

  React.useEffect(() => {
    fetch('/api/admin/status')
      .then(res => res.json())
      .then((data: any) => {
        if (data.success) {
          setHasAdmin(data.hasAdmin);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#05070a] font-sans h-full min-h-[calc(100vh-64px)] relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,transparent_70%)]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 w-full max-w-md bg-[#0b0f19]/80 backdrop-blur-xl border border-slate-800/50 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header/Branding */}
        <div className="p-8 pb-4 text-center">
          <motion.div 
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            className="flex flex-col items-center gap-3 mb-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Box className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                Etherium <span className="text-sky-400">Wiki</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Knowledge Access
              </p>
            </div>
          </motion.div>
        </div>

        {/* Login Component */}
        <div className="p-8 pt-0 flex flex-col justify-center relative">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 text-center space-y-4"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                </div>
                <h4 className="text-2xl font-black text-white">Login Successful</h4>
                <p className="text-sm text-slate-400">
                  Redirecting to portal...
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">System Login</h3>
                  <p className="text-xs text-slate-500">
                    Sign in to access restricted data and tools.
                  </p>
                </div>

                {errorMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center gap-3"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="font-medium">{errorMessage}</span>
                  </motion.div>
                )}

                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-full flex justify-center">
                      <GoogleLogin
                        onSuccess={async (credentialResponse: CredentialResponse) => {
                          if (credentialResponse.credential) {
                            const idToken = credentialResponse.credential;
                            try {
                              const res = await fetch('/auth/google', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id_token: idToken }),
                              });
                              const data = await res.json() as any;

                              let name = 'Google User';
                              let emailVal = 'user@gmail.com';
                              let isAdmin = false;

                              if (data && data.user) {
                                name = data.user.name || name;
                                emailVal = data.user.email || emailVal;
                                isAdmin = data.user.is_admin === 1;
                              } else {
                                const decoded: any = jwtDecode(idToken);
                                name = decoded.name || decoded.email?.split('@')[0] || name;
                                emailVal = decoded.email || emailVal;
                              }

                              if (data && data.token) {
                                try {
                                  localStorage.setItem('etherium_auth_token', data.token);
                                  if (isAdmin) {
                                    localStorage.setItem('etherium_admin_token', data.token);
                                  }
                                } catch (e) {
                                  console.warn('LocalStorage save token error', e);
                                }
                              }

                              setSuccess(true);
                              setTimeout(() => {
                                onLoginSuccess(name, emailVal, isAdmin, isAdmin ? 'admin-panel' : 'home');
                                setSuccess(false);
                              }, 600);
                            } catch (err) {
                              setErrorMessage('Failed to process authentication.');
                            }
                          }
                        }}
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

                    {!hasAdmin && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">Administrator Required</h4>
                            <p className="text-[10px] text-amber-200/50">Initial setup detected.</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            window.history.pushState(null, '', '/admin-setup');
                            window.dispatchEvent(new Event('popstate'));
                          }}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                        >
                          Initialize Master Account
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button onClick={onBack} className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-2 text-xs font-bold">
                    <ArrowLeft className="w-3 h-3" />
                    Back to Portal
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



