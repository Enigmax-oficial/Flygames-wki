import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, AlertCircle, ArrowLeft, Lock, User, Sparkles, Key, LogIn, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface LoginPageProps {
  onLoginSuccess: (userName: string, email: string, isAdmin?: boolean, redirectTarget?: string) => void;
  onBack: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack }) => {
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#0b0f19] font-sans h-full min-h-[calc(100vh-64px)]">
      <div className="bg-[#111827] border border-[#1e293b] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-[#e2e8f0]">
        {/* Header */}
        <div className="p-5 bg-[#0b0f19] border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-[#1e293b]/60 hover:bg-[#1e293b] text-[#94a3b8] hover:text-white transition-colors cursor-pointer mr-1"
              title="Voltar ao portal"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Acesso ao Sistema
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Etherium Official Knowledge Base
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6 text-center">
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {success ? (
            <div className="py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-lg font-bold text-white">Login Realizado com Sucesso!</h4>
              <p className="text-xs text-slate-400">
                Redirecionando para o portal...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-base font-bold text-white">Entre com sua conta Google</h4>
                <p className="text-xs text-slate-400">
                  Autenticação segura via Google Workspace / Identity Services.
                </p>
              </div>

              {/* Google Sign In Component */}
              <div className="flex justify-center w-full py-4">
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

                        if (data && data.user) {
                          name = data.user.name || name;
                          emailVal = data.user.email || emailVal;
                        } else {
                          const decoded: any = jwtDecode(idToken);
                          name = decoded.name || decoded.email?.split('@')[0] || name;
                          emailVal = decoded.email || emailVal;
                        }

                        // Verify if email is registered as an admin in database
                        try {
                          const checkRes = await fetch('/api/admin/verify-google', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: emailVal })
                          });
                          const checkData = await checkRes.json() as any;
                          if (!checkRes.ok || !checkData.success) {
                            setErrorMessage(checkData.error || 'E-mail não autorizado. Apenas administradores cadastrados podem acessar.');
                            return;
                          }
                        } catch {
                          setErrorMessage('Erro ao verificar autorização de administrador.');
                          return;
                        }

                        if (data && data.token) {
                          try {
                            localStorage.setItem('etherium_auth_token', data.token);
                          } catch (e) {
                            console.warn('LocalStorage save token error', e);
                          }
                        }

                        setSuccess(true);
                        setTimeout(() => {
                          onLoginSuccess(name, emailVal, true, 'home');
                          setSuccess(false);
                        }, 600);
                      } catch {
                        try {
                          const decoded: any = jwtDecode(idToken);
                          const name = decoded.name || decoded.email?.split('@')[0] || 'Google User';
                          const emailVal = decoded.email || 'user@gmail.com';

                          // Verify admin database
                          const checkRes = await fetch('/api/admin/verify-google', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: emailVal })
                          });
                          const checkData = await checkRes.json() as any;
                          if (!checkRes.ok || !checkData.success) {
                            setErrorMessage(checkData.error || 'E-mail não autorizado. Apenas administradores cadastrados podem acessar.');
                            return;
                          }

                          setSuccess(true);
                          setTimeout(() => {
                            onLoginSuccess(name, emailVal, true, 'home');
                            setSuccess(false);
                          }, 600);
                        } catch {
                          setErrorMessage('Falha ao processar autenticação Google.');
                        }
                      }
                    }
                  }}
                  onError={() => {
                    setErrorMessage('Falha no login com Google.');
                  }}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  logo_alignment="left"
                  width="340"
                />
              </div>
            </div>
          )}
        </div>

        {/* Redirect Link Back */}
        <div className="p-4 bg-[#0b0f19] border-t border-[#1e293b] text-center">
          <button onClick={onBack} className="text-sky-400 hover:underline font-bold text-xs cursor-pointer">
            ← Voltar para a Página Inicial
          </button>
        </div>
      </div>
    </div>
  );
};



