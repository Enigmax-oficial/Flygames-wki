import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface LoginPageProps {
  onLoginSuccess: (userName: string, email: string) => void;
  onBack: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack }) => {
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authMethod, setAuthMethod] = useState('Google Identity Services');

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
                Google Account Sign In
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
            <div className="space-y-6 py-4">
              <p className="text-xs text-[#94a3b8] text-center max-w-xs mx-auto">
                Sign in with your Google Account to access administrator tools and knowledge base features.
              </p>

              {/* Google Sign In Component via @react-oauth/google */}
              <div className="flex justify-center w-full my-2">
                <GoogleLogin
                  onSuccess={async (credentialResponse: CredentialResponse) => {
                    if (credentialResponse.credential) {
                      const idToken = credentialResponse.credential;
                      try {
                        // Send id_token to backend for verification
                        const res = await fetch('/auth/google', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id_token: idToken }),
                        });
                        const data = await res.json() as any;

                        let name = 'Google User';
                        let emailVal = 'user@gmail.com';

                        if (data && data.user) {
                          name = data.user.name || name;
                          emailVal = data.user.email || emailVal;
                        } else {
                          const decoded: any = jwtDecode(idToken);
                          name = decoded.name || decoded.email?.split('@')[0] || name;
                          emailVal = decoded.email || emailVal;
                        }

                        setAuthMethod('Google Identity Services');
                        setSuccess(true);
                        setTimeout(() => {
                          onLoginSuccess(name, emailVal);
                          setSuccess(false);
                        }, 800);
                      } catch {
                        try {
                          const decoded: any = jwtDecode(idToken);
                          const name = decoded.name || decoded.email?.split('@')[0] || 'Google User';
                          const emailVal = decoded.email || 'user@gmail.com';
                          setAuthMethod('Google Identity Services');
                          setSuccess(true);
                          setTimeout(() => {
                            onLoginSuccess(name, emailVal);
                            setSuccess(false);
                          }, 800);
                        } catch {
                          setErrorMessage('Google authentication processing failed');
                        }
                      }
                    }
                  }}
                  onError={() => {
                    setErrorMessage('Google Sign-In failed');
                  }}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  logo_alignment="left"
                  width="320"
                />
              </div>
            </div>
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



