import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, AlertCircle, ArrowLeft, Lock, User, Sparkles, Key, LogIn } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface LoginPageProps {
  onLoginSuccess: (userName: string, email: string, isAdmin?: boolean, redirectTarget?: string) => void;
  onBack: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack }) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authMethod, setAuthMethod] = useState('');

  const fillDefaultCredentials = () => {
    setUsernameInput('adm');
    setPasswordInput('admin');
    setErrorMessage('');
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    const u = usernameInput.trim();
    const p = passwordInput.trim();

    if (!u || !p) {
      setErrorMessage('Por favor, digite o nome de usuário e a senha.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json() as any;

      if (data.success) {
        setAuthMethod('Credenciais de Administrador');
        setSuccess(true);
        if (data.token) {
          try {
            localStorage.setItem('etherium_admin_token', data.token);
            localStorage.setItem('etherium_auth_token', data.token);
          } catch {}
        }
        sessionStorage.setItem('admin_auth_verified', 'true');
        sessionStorage.setItem('admin_initial_setup', 'true');

        const userName = data.user?.username || (u === 'adm' ? 'adm' : u);
        const userEmail = data.user?.email || (u === 'adm' ? 'adm@wiki.local' : `${u}@wiki.local`);

        setTimeout(() => {
          onLoginSuccess(userName, userEmail, true, 'admin-panel');
          setSuccess(false);
        }, 600);
      } else {
        setErrorMessage(data.message || 'Credenciais inválidas. Para o primeiro acesso use usuário: adm e senha: admin.');
      }
    } catch {
      setErrorMessage('Erro de conexão com o servidor de autenticação.');
    } finally {
      setIsLoading(false);
    }
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
              title="Voltar ao portal"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Acesso ao Painel & Sistema
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
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-lg font-bold text-white">Login Autorizado!</h4>
              <p className="text-xs text-slate-400">
                Redirecionando para o painel de criação de contas...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Initial credentials callout */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-amber-400 text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-4 h-4" />
                    <span>Primeiro Acesso ao Painel:</span>
                  </span>
                  <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">Inicial</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-[#0b0f19] px-2.5 py-1 rounded border border-slate-800">
                    <span className="text-slate-500 text-[10px] block font-sans">Usuário:</span>
                    <strong className="text-amber-300">adm</strong>
                  </div>
                  <div className="bg-[#0b0f19] px-2.5 py-1 rounded border border-slate-800">
                    <span className="text-slate-500 text-[10px] block font-sans">Senha:</span>
                    <strong className="text-amber-300">admin</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fillDefaultCredentials}
                  className="w-full py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preencher "adm" e "admin"</span>
                </button>
              </div>

              {/* Username/Password Form */}
              <form onSubmit={handlePasswordLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Usuário ou E-mail</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: adm"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0b0f19] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition font-mono placeholder:text-slate-600"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Senha</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Ex: admin"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0b0f19] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition font-mono tracking-widest placeholder:tracking-normal placeholder:text-slate-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold rounded-xl text-xs transition cursor-pointer disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Entrar no Sistema</span>
                    </>
                  )}
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-slate-600 text-[10px] uppercase font-bold tracking-wider">ou autentique com</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Google Sign In Component */}
              <div className="flex justify-center w-full">
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

                        if (data && data.token) {
                          try {
                            localStorage.setItem('etherium_auth_token', data.token);
                          } catch (e) {
                            console.warn('LocalStorage save token error', e);
                          }
                        }

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
                          onLoginSuccess(name, emailVal, false, 'home');
                          setSuccess(false);
                        }, 600);
                      } catch {
                        try {
                          const decoded: any = jwtDecode(idToken);
                          const name = decoded.name || decoded.email?.split('@')[0] || 'Google User';
                          const emailVal = decoded.email || 'user@gmail.com';
                          setAuthMethod('Google Identity Services');
                          setSuccess(true);
                          setTimeout(() => {
                            onLoginSuccess(name, emailVal, false, 'home');
                            setSuccess(false);
                          }, 600);
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
                  size="medium"
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
            ← Voltar para a Página Inicial
          </button>
        </div>
      </div>
    </div>
  );
};



