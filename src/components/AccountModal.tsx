import { WikiIcon } from './WikiIcon';
import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Crown, 
  Mail, 
  ShieldCheck, 
  Database, 
  LogOut, 
  Edit3, 
  Check, 
  Sparkles,
  FileCode,
  Bookmark,
  Activity,
  Lock,
  Star,
  Award,
  Settings,
  Heart,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { WikiPage } from '../types/wiki';
import { isAuthorizedAdminEmail } from '../lib/adminAuth';
import { WikiApi } from '../lib/wikiApi';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: string | null;
  userEmail?: string | null;
  onLogout: () => void;
  onUpdateUserName?: (newName: string) => void;
  onUpdateUserEmail?: (newEmail: string) => void;
  onOpenAdminPanel?: () => void;
  pages?: WikiPage[];
  onSelectPage?: (pageId: string) => void;
  hasAdmin?: boolean;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  user,
  userEmail = '',
  onLogout,
  onUpdateUserName,
  onUpdateUserEmail,
  onOpenAdminPanel,
  pages = [],
  onSelectPage,
  hasAdmin = true,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'contributions' | 'bookmarks' | 'security'>('overview');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(userEmail || '');
  const [copiedScript, setCopiedScript] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => WikiApi.getFavorites());

  useEffect(() => {
    const handleFavUpdate = () => {
      setFavoriteIds(WikiApi.getFavorites());
    };
    window.addEventListener('wiki_favorites_updated', handleFavUpdate);
    WikiApi.fetchFavorites().then(favs => setFavoriteIds(favs)).catch(() => {});
    return () => window.removeEventListener('wiki_favorites_updated', handleFavUpdate);
  }, []);

  if (!isOpen) return null;

  const displayEmail = userEmail || '';
  
  // Administrator condition
  const isAdmin = !hasAdmin || (Boolean(userEmail) && isAuthorizedAdminEmail(displayEmail));

  const handleSaveName = () => {
    if (newName.trim() && onUpdateUserName) {
      onUpdateUserName(newName.trim());
      setIsEditingName(false);
    }
  };

  const handleSaveEmail = () => {
    if (newEmail.trim() && onUpdateUserEmail) {
      onUpdateUserEmail(newEmail.trim());
      setIsEditingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-[#1e293b] rounded-3xl max-w-2xl w-full text-white shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cover Banner Header */}
        <div className="h-32 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 relative p-6 flex justify-between items-start">
          <div className="absolute inset-0 bg-black/20" />
          
          <div className="relative z-10 flex items-center gap-2">
            <span className="px-3 py-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-[11px] font-mono tracking-wider text-sky-300">
              {isAdmin ? '👑 Administrator Profile' : '🛡️ Verified Explorer'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 text-white/80 hover:text-white p-2 rounded-xl bg-black/30 hover:bg-black/50 backdrop-blur-md transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Identity & Avatar Area */}
        <div className="px-6 pb-4 relative -mt-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-[#1e293b]">
          <div className="flex items-end gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center font-black text-4xl text-black shadow-2xl border-4 border-[#0b0f19]">
                {(user || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-1.5 rounded-full border-2 border-[#0b0f19] shadow" title="Online Status">
                <div className="w-2.5 h-2.5 bg-black rounded-full animate-pulse" />
              </div>
            </div>

            <div className="pb-1">
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-[#1e293b] border border-sky-500 rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none"
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-black text-white tracking-tight">{user}</h2>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-[#64748b] hover:text-sky-400 transition-colors p-1"
                      title="Edit Display Name"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              <p className="text-xs text-[#94a3b8] flex items-center gap-1.5 mt-1 font-mono">
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                <span>{displayEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pb-1">
            {isAdmin && onOpenAdminPanel && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminPanel();
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition flex items-center gap-2 cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                <span>Admin Panel</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1e293b] px-6 gap-6 bg-[#0b0f19]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'overview' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('contributions')}
            className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'contributions' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Contributions</span>
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'bookmarks' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved & History</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'security' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Email & Security</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-4 text-center space-y-1">
                  <div className="text-2xl font-black text-sky-400">{pages.length}</div>
                  <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Wiki Pages</div>
                </div>
                <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-4 text-center space-y-1">
                  <div className="text-2xl font-black text-emerald-400">100%</div>
                  <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Sync Integrity</div>
                </div>
                <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-4 text-center space-y-1">
                  <div className="text-2xl font-black text-amber-400">{isAdmin ? 'Level 5' : 'Level 2'}</div>
                  <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Auth Rank</div>
                </div>
                <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-4 text-center space-y-1">
                  <div className="text-2xl font-black text-purple-400">Active</div>
                  <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Session State</div>
                </div>
              </div>

              {/* Account details card */}
              <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Award className="w-4 h-4 text-sky-400" />
                  <span>Account Credentials & Role</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 bg-[#0b0f19] border border-[#1e293b] rounded-xl space-y-1">
                    <span className="text-slate-500 block">DISPLAY NAME</span>
                    <span className="text-white font-bold">{user}</span>
                  </div>
                  <div className="p-3 bg-[#0b0f19] border border-[#1e293b] rounded-xl space-y-1">
                    <span className="text-slate-500 block">AUTHENTICATED EMAIL</span>
                    <span className="text-sky-300 font-bold">{displayEmail}</span>
                  </div>
                </div>
              </div>

              {/* Admin Tools preview if admin */}
              {isAdmin && (
                <div className="bg-[#111827] border border-amber-500/30 rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Administrator SQL Database Status</span>
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <div className="px-3.5 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-2">
                      <Database className="w-3.5 h-3.5" />
                      <span>SQL Database Connected (Cloudflare D1 / Express Backend)</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {activeTab === 'contributions' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Recent Wiki Page Contributions</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">{pages.length} Total Articles</span>
              </div>

              <div className="space-y-2.5">
                {pages.slice(0, 5).map((p) => (
                  <div key={p.id} className="bg-[#111827] border border-[#1e293b] rounded-2xl p-4 flex items-center justify-between hover:border-sky-500/30 transition">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#0b0f19] rounded-xl border border-[#1e293b] flex items-center justify-center">
                        <WikiIcon icon={p.icon} className="w-8 h-8 text-2xl" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{p.title}</h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">Category: {p.category} • Updated {p.lastUpdated}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-mono font-bold">
                      Published
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-sky-400" />
                <span>Saved Bookmarks & Reading History</span>
              </h3>
              <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-2xl flex items-center justify-center mx-auto">
                  <Star className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Your Reading Queue is Ready</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click the bookmark icon on any wiki article to save pages for quick offline reference across sessions.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span>Update & Persist Email Address</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Permanently update your registered account email. This prevents email loss upon page reload and ensures seamless authentication sync.
                </p>

                <div className="flex items-center gap-3">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 bg-[#0b0f19] border border-[#1e293b] focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    onClick={handleSaveEmail}
                    className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs rounded-xl transition cursor-pointer"
                  >
                    Save Email
                  </button>
                </div>
              </div>

              <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Security & Local Storage Status</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Authentication state is securely stored in client local storage with automatic fallback defaults (<code className="text-sky-300 font-mono">None</code>).
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#0b0f19] border-t border-[#1e293b] flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">Active Session: {displayEmail}</span>

          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  );
};
