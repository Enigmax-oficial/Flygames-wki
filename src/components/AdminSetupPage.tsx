import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

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
      setError('Por favor, informe um e-mail válido para o administrador.');
      return;
    }

    if (!newAdminPassword || newAdminPassword.length < 6) {
      setError('A senha do administrador deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newAdminPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
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
        setError(data.error || 'Falha ao criar conta de administrador.');
      }
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#0b0f19] font-sans h-full min-h-[calc(100vh-64px)]">
      <div className="w-full max-w-md bg-[#111827] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[#1f293d]/50 border-b border-slate-800 flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToLogin}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Configuração Inicial do Administrador</h3>
            <p className="text-xs text-slate-400">
              Primeiro Acesso • Uso Único
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-lg font-bold text-white">Administrador Criado com Sucesso!</h4>
              <p className="text-xs text-slate-400">
                Redirecionando para o sistema...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 space-y-1">
                <p className="font-bold">Credenciais de Instalação:</p>
                <p className="text-[11px] text-amber-200/80">
                  Enter the default username and password (<code className="bg-black/30 px-1 py-0.5 rounded font-mono">adm</code> / <code className="bg-black/30 px-1 py-0.5 rounded font-mono">admin</code>) to authorize the creation of the permanent account. This page can only be used once.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                    Usuário Padrão
                  </label>
                  <input
                    type="text"
                    value={bootstrapUsername}
                    onChange={(e) => setBootstrapUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                    Senha Padrão
                  </label>
                  <input
                    type="password"
                    value={bootstrapPassword}
                    onChange={(e) => setBootstrapPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>E-mail do Novo Administrador</span>
                  </label>
                  <input
                    type="email"
                    placeholder="ex: admin@seuemail.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0b0f19] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 font-mono placeholder:text-slate-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Senha (mínimo 6 caracteres)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0b0f19] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 font-mono tracking-widest placeholder:tracking-normal placeholder:text-slate-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Confirmar Senha</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0b0f19] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 font-mono tracking-widest placeholder:tracking-normal placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs transition cursor-pointer disabled:opacity-50 shadow-md flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Criando Administrador...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Criar Conta de Administrador</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
