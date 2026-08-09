import React, { useState } from 'react';
import { 
  X, 
  User, 
  Crown, 
  Mail, 
  ShieldCheck, 
  Download, 
  LogOut, 
  Edit3, 
  Check, 
  Sparkles,
  FileCode,
  Key,
  Database
} from 'lucide-react';
import { downloadTemplateScript, downloadGlobalPageCreator } from '../templates/PageCreator';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: string | null;
  userEmail?: string | null;
  onLogout: () => void;
  onUpdateUserName?: (newName: string) => void;
  onOpenAdminPanel?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  user,
  userEmail = 'ruanpablolopesbritor@gmail.com',
  onLogout,
  onUpdateUserName,
  onOpenAdminPanel,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user || '');
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const displayEmail = userEmail || 'ruanpablolopesbritor@gmail.com';
  
  // Administrator condition: ruanpablolopesbritor@gmail.com or ruanpablolopesbritoruan@gmail.com or admin email
  const isAdmin = 
    displayEmail.toLowerCase().includes('ruanpablolopesbrito') ||
    displayEmail.toLowerCase().includes('admin') ||
    (user && user.toLowerCase().includes('admin'));

  const handleSaveName = () => {
    if (newName.trim() && onUpdateUserName) {
      onUpdateUserName(newName.trim());
      setIsEditingName(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-[#1e293b] rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#94a3b8] hover:text-white p-2 rounded-xl hover:bg-[#1e293b] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Account Management</h2>
            <p className="text-xs text-[#64748b]">Manage your Etherium Wiki profile & admin options</p>
          </div>
        </div>

        {/* Profile Card Header */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-black text-2xl text-black shadow-lg">
                  {(user || 'U').charAt(0).toUpperCase()}
                </div>
                {isAdmin && (
                  <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black p-1 rounded-full shadow-md" title="Administrator">
                    <Crown className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="bg-[#1e293b] border border-sky-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                      />
                      <button
                        onClick={handleSaveName}
                        className="p-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-base font-bold text-white">{user || 'Minecraft Explorer'}</h3>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-[#64748b] hover:text-sky-400 transition-colors p-1"
                        title="Edit Username"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                <p className="text-xs text-[#94a3b8] flex items-center gap-1.5 mt-0.5 font-mono">
                  <Mail className="w-3 h-3 text-sky-400" />
                  <span>{displayEmail}</span>
                </p>
              </div>
            </div>

            {/* Badge */}
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${
              isAdmin
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
            }`}>
              {isAdmin ? <Crown className="w-3 h-3 text-amber-400" /> : <ShieldCheck className="w-3 h-3 text-sky-400" />}
              <span>{isAdmin ? 'ADMINISTRATOR' : 'MEMBER'}</span>
            </span>
          </div>
        </div>

        {/* Administrator Options & Downloads Section */}
        {isAdmin && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Administrator Tools & Template JS Downloads</span>
            </h3>

            <div className="bg-[#111827] border border-amber-500/30 rounded-2xl p-4 space-y-3">
              <p className="text-xs text-[#cbd5e1] leading-relaxed">
                As the administrator account (<code className="text-amber-300 font-mono">ruanpablolopesbritor@gmail.com</code>), you can create new wiki pages and download standalone JavaScript/TypeScript template scripts to incorporate into the project source code.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {onOpenAdminPanel && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAdminPanel();
                    }}
                    className="p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer"
                  >
                    <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Open Admin Control Panel</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    downloadTemplateScript('Etherium Shadow Blade', 'items', 'aetheria:shadow_blade');
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2000);
                  }}
                  className="p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer"
                  title="Download JS script file template"
                >
                  <Download className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{copiedScript ? 'Downloaded JS Script!' : 'Download Template JS'}</span>
                </button>

                <button
                  onClick={() => downloadGlobalPageCreator()}
                  className="p-3 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer col-span-1 sm:col-span-2"
                  title="Download PageCreator.ts source file"
                >
                  <FileCode className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Download PageCreator.ts Source Class</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#1e293b]">
          <span className="text-[11px] text-[#64748b]">Logged in as {displayEmail}</span>

          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  );
};
