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
  Bookmark, 
  Activity, 
  Lock, 
  Star, 
  Award, 
  Settings, 
  Trash2, 
  ChevronRight, 
  AlertTriangle,
  ExternalLink,
  Shield,
  Clock,
  KeyRound,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { WikiPage } from '../types/wiki';
import { WikiIcon } from './WikiIcon';
import { WikiApi } from '../lib/wikiApi';
import { MINECRAFT_AVATARS } from '../utils/minecraftAvatars';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: string | null;
  userEmail?: string | null;
  userAvatar?: string | null;
  onLogout: () => void;
  onUpdateUserName?: (newName: string) => void;
  onUpdateUserEmail?: (newEmail: string) => void;
  onUpdateUserAvatar?: (newAvatar: string | null) => void;
  onOpenAdminPanel?: () => void;
  pages?: WikiPage[];
  onSelectPage?: (pageId: string) => void;
  isCurrentUserAdmin?: boolean;
  isSqlConnected?: boolean;
  hasAdmin?: boolean;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  user,
  userEmail = '',
  userAvatar = null,
  onLogout,
  onUpdateUserName,
  onUpdateUserEmail,
  onUpdateUserAvatar,
  onOpenAdminPanel,
  pages = [],
  onSelectPage,
  isCurrentUserAdmin = false,
  isSqlConnected = false,
  hasAdmin = true,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'avatar' | 'contributions' | 'bookmarks' | 'security'>('overview');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(userEmail || '');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [nameSaveFeedback, setNameSaveFeedback] = useState(false);
  const [emailSaveFeedback, setEmailSaveFeedback] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => WikiApi.getFavorites());
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem('etherium_google_avatar');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    setNewName(user || '');
  }, [user]);

  useEffect(() => {
    setNewEmail(userEmail || '');
  }, [userEmail]);

  useEffect(() => {
    const handleFavUpdate = () => {
      setFavoriteIds(WikiApi.getFavorites());
    };
    window.addEventListener('wiki_favorites_updated', handleFavUpdate);
    WikiApi.fetchFavorites().then(favs => setFavoriteIds(favs)).catch(() => {});
    return () => window.removeEventListener('wiki_favorites_updated', handleFavUpdate);
  }, []);

  // Close modal on Escape if logout confirm isn't open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLogoutConfirm) {
          setShowLogoutConfirm(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showLogoutConfirm, onClose]);

  if (!isOpen) return null;

  const displayEmail = userEmail || 'No email registered';
  const isAdmin = Boolean(user) && Boolean(isCurrentUserAdmin);

  const handleSaveName = () => {
    if (newName.trim() && onUpdateUserName) {
      onUpdateUserName(newName.trim());
      setIsEditingName(false);
      setNameSaveFeedback(true);
      setTimeout(() => setNameSaveFeedback(false), 2500);
    }
  };

  const handleSaveEmail = () => {
    if (newEmail.trim() && onUpdateUserEmail) {
      onUpdateUserEmail(newEmail.trim());
      setIsEditingEmail(false);
      setEmailSaveFeedback(true);
      setTimeout(() => setEmailSaveFeedback(false), 2500);
    }
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onClose();
    onLogout();
  };

  const bookmarkedPages = pages.filter(p => favoriteIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Main Account Settings Card */}
      <div className="bg-[#0b0f19] border border-[#1e293b] rounded-3xl max-w-2xl w-full text-white shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cover Banner Header */}
        <div className="h-32 sm:h-36 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-700 relative p-4 sm:p-6 flex justify-between items-start shrink-0">
          <div className="absolute inset-0 bg-black/20" />
          
          <div className="relative z-10 flex items-center gap-2">
            <span className={`px-3 py-1 backdrop-blur-md border rounded-full text-[11px] font-mono tracking-wider font-bold shadow-sm flex items-center gap-1.5 ${
              isAdmin 
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-300' 
                : 'bg-sky-500/20 border-sky-400/30 text-sky-200'
            }`}>
              {isAdmin ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : <Shield className="w-3.5 h-3.5 text-sky-300" />}
              <span>{isAdmin ? 'Administrator Account' : 'Verified Member'}</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 text-white/80 hover:text-white p-2 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md transition-all cursor-pointer border border-white/10"
            aria-label="Close Account Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Identity Bar */}
        <div className="px-4 sm:px-6 pb-4 relative -mt-12 sm:-mt-14 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-[#1e293b] shrink-0">
          <div className="flex items-end gap-3.5 sm:gap-4">
            {/* Avatar with status and quick change click */}
            <div className="relative group">
              <div 
                onClick={() => setActiveTab('avatar')}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center font-black text-3xl sm:text-4xl text-black shadow-2xl border-4 border-[#0b0f19] overflow-hidden cursor-pointer hover:ring-2 hover:ring-sky-400 transition"
                title="Click to customize avatar"
              >
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (user || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-1.5 rounded-full border-2 border-[#0b0f19] shadow" title="Online Session Active">
                <div className="w-2.5 h-2.5 bg-black rounded-full animate-pulse" />
              </div>
            </div>

            {/* Display Name & Email */}
            <div className="pb-1 min-w-0">
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-[#1e293b] border border-sky-500 rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none max-w-[160px] sm:max-w-[200px]"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') setIsEditingName(false);
                      }}
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 cursor-pointer"
                      title="Save name"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="p-1.5 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate max-w-[180px] sm:max-w-[260px]">
                      {user}
                    </h2>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-[#64748b] hover:text-sky-400 transition-colors p-1"
                      title="Edit Display Name"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {nameSaveFeedback && (
                      <span className="text-[10px] text-emerald-400 font-bold animate-in fade-in flex items-center gap-1">
                        <Check className="w-3 h-3" /> Saved
                      </span>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-[#94a3b8] flex items-center gap-1.5 mt-0.5 font-mono truncate max-w-[240px] sm:max-w-[320px]">
                <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">{displayEmail}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2 pb-1 w-full sm:w-auto justify-end">
            {isAdmin && onOpenAdminPanel && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminPanel();
                }}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.25)] transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs - Responsive Scrollable */}
        <div className="flex border-b border-[#1e293b] px-4 sm:px-6 gap-2 sm:gap-6 bg-[#0b0f19] overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'overview' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          
          <button
            onClick={() => setActiveTab('avatar')}
            className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'avatar' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Avatar & Photo</span>
          </button>

          <button
            onClick={() => setActiveTab('contributions')}
            className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'contributions' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Contributions</span>
          </button>

          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'bookmarks' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved ({favoriteIds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'security' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Account Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-3.5 sm:p-4 text-center space-y-1">
                  <div className="text-xl sm:text-2xl font-black text-sky-400">{pages.length}</div>
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-400 tracking-wider">Wiki Articles</div>
                </div>
                <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-3.5 sm:p-4 text-center space-y-1">
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">100%</div>
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-400 tracking-wider">D1 Synced</div>
                </div>
                <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-3.5 sm:p-4 text-center space-y-1">
                  <div className="text-xl sm:text-2xl font-black text-amber-400">{isAdmin ? 'Admin' : 'Member'}</div>
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-400 tracking-wider">Role Rank</div>
                </div>
                <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-3.5 sm:p-4 text-center space-y-1">
                  <div className="text-xl sm:text-2xl font-black text-purple-400">{favoriteIds.length}</div>
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-400 tracking-wider">Saved Pages</div>
                </div>
              </div>

              {/* Account Credentials Card */}
              <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-4 sm:p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Award className="w-4 h-4 text-sky-400" />
                  <span>Profile Identity & Rank</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-[#0b0f19] border border-[#1e293b] rounded-xl space-y-1">
                    <span className="text-slate-500 block text-[10px]">USERNAME / DISPLAY NAME</span>
                    <span className="text-white font-bold">{user}</span>
                  </div>
                  <div className="p-3 bg-[#0b0f19] border border-[#1e293b] rounded-xl space-y-1">
                    <span className="text-slate-500 block text-[10px]">AUTHENTICATED EMAIL</span>
                    <span className="text-sky-300 font-bold truncate block">{displayEmail}</span>
                  </div>
                  <div className="p-3 bg-[#0b0f19] border border-[#1e293b] rounded-xl space-y-1">
                    <span className="text-slate-500 block text-[10px]">ACCESS PERMISSION</span>
                    <span className="text-emerald-400 font-bold">{isAdmin ? 'Full Administrator Access' : 'Standard Read / Bookmark Access'}</span>
                  </div>
                  <div className="p-3 bg-[#0b0f19] border border-[#1e293b] rounded-xl space-y-1">
                    <span className="text-slate-500 block text-[10px]">SESSION STORAGE</span>
                    <span className="text-purple-300 font-bold">Cloudflare D1 & Local Auth</span>
                  </div>
                </div>
              </div>

              {/* Admin Panel Quick Access Banner */}
              {isAdmin && (
                <div className="bg-gradient-to-r from-amber-950/30 via-[#111827] to-amber-950/20 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>Administrator Control Panel Available</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Manage wiki pages, categories, database tables, user roles, and live analytics.
                    </p>
                  </div>
                  {onOpenAdminPanel && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAdminPanel();
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Open Admin Panel</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: AVATAR & PHOTO CUSTOMIZATION */}
          {activeTab === 'avatar' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-sky-400" />
                    <span>Customize Profile Avatar</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select a Minecraft-themed voxel preset avatar, use your Google Account photo, or specify a custom image URL.
                  </p>
                </div>

                {/* Google Avatar Option (if present) */}
                {googleAvatarUrl && (
                  <div className="p-3 bg-[#0b0f19] border border-sky-500/20 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={googleAvatarUrl} 
                        alt="Google avatar" 
                        className="w-10 h-10 rounded-xl object-cover border border-[#1e293b]" 
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">Google Account Photo</span>
                        <span className="text-[11px] text-slate-400">Linked to your Google Account login</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpdateUserAvatar && onUpdateUserAvatar(googleAvatarUrl)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        userAvatar === googleAvatarUrl 
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                          : 'bg-[#1e293b] hover:bg-[#2d3748] text-white border border-[#334155]'
                      }`}
                    >
                      {userAvatar === googleAvatarUrl ? 'Active' : 'Use Google Photo'}
                    </button>
                  </div>
                )}

                {/* Preset Avatars Grid */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Minecraft Avatar Skins</span>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-1 bg-[#070a12] border border-[#1e293b] rounded-2xl">
                    {MINECRAFT_AVATARS.map((preset) => {
                      const isSelected = userAvatar === preset.url;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => onUpdateUserAvatar && onUpdateUserAvatar(preset.url)}
                          className={`relative group p-1.5 rounded-xl bg-[#0b0f19] border transition flex flex-col items-center gap-1 cursor-pointer ${
                            isSelected 
                              ? 'border-sky-500 bg-sky-950/40 shadow-[0_0_12px_rgba(14,165,233,0.2)] ring-2 ring-sky-400' 
                              : 'border-[#1e293b] hover:border-slate-600'
                          }`}
                          title={preset.name}
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden relative flex items-center justify-center">
                            <img 
                              src={preset.url} 
                              alt={preset.name} 
                              className="w-full h-full object-contain transition duration-200 group-hover:scale-110" 
                              style={{ imageRendering: 'pixelated' }}
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-sky-500/20 flex items-center justify-center">
                                <div className="bg-sky-500 text-black rounded-full p-0.5 shadow">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 truncate w-full text-center group-hover:text-white transition-colors">
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom URL Input */}
                <div className="space-y-2 pt-2 border-t border-[#1e293b]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Or Enter Direct Image URL</span>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/custom_avatar.png"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      className="flex-1 bg-[#0b0f19] border border-[#1e293b] focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-600 font-mono"
                    />
                    <button
                      onClick={() => {
                        if (customAvatarUrl.trim() && onUpdateUserAvatar) {
                          onUpdateUserAvatar(customAvatarUrl.trim());
                          setCustomAvatarUrl('');
                        }
                      }}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs rounded-xl transition cursor-pointer shrink-0"
                    >
                      Apply URL
                    </button>
                  </div>
                </div>

                {/* Remove Custom Avatar button */}
                {userAvatar && (
                  <div className="flex justify-end pt-2 border-t border-[#1e293b]">
                    <button
                      onClick={() => {
                        if (onUpdateUserAvatar) {
                          onUpdateUserAvatar(null);
                          setCustomAvatarUrl('');
                        }
                      }}
                      className="text-slate-400 hover:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Custom Avatar (Reset to Default / Initials)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONTRIBUTIONS */}
          {activeTab === 'contributions' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Recent Wiki Articles & Additions</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">{pages.length} Total Articles</span>
              </div>

              {pages.length === 0 ? (
                <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-8 text-center text-slate-500 text-xs italic">
                  No wiki articles published yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pages.slice(0, 6).map((p) => (
                    <div 
                      key={p.id} 
                      onClick={() => {
                        if (onSelectPage) {
                          onClose();
                          onSelectPage(p.id);
                        }
                      }}
                      className="bg-[#111827] border border-[#1e293b] rounded-2xl p-3 sm:p-4 flex items-center justify-between hover:border-sky-500/40 hover:bg-[#151e30] transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-[#0b0f19] rounded-xl border border-[#1e293b] flex items-center justify-center shrink-0">
                          <WikiIcon icon={p.icon} className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300 transition-colors truncate">
                            {p.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                            {p.category} • Updated {p.lastUpdated || 'recently'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-mono font-bold hidden sm:inline">
                          Published
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SAVED BOOKMARKS */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-sky-400" />
                  <span>Saved Bookmarks & Reading List</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">{favoriteIds.length} Saved</span>
              </div>

              {bookmarkedPages.length === 0 ? (
                <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 sm:p-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-2xl flex items-center justify-center mx-auto">
                    <Star className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">No Saved Pages Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click the star / bookmark icon on any wiki article while reading to add it to your personal favorites queue.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {bookmarkedPages.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        if (onSelectPage) {
                          onClose();
                          onSelectPage(p.id);
                        }
                      }}
                      className="bg-[#111827] border border-[#1e293b] rounded-2xl p-3 sm:p-4 flex items-center justify-between hover:border-sky-500/40 hover:bg-[#151e30] transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-[#0b0f19] rounded-xl border border-[#1e293b] flex items-center justify-center shrink-0">
                          <WikiIcon icon={p.icon} className="w-6 h-6 text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300 transition-colors truncate">
                            {p.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                            Category: {p.category}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SECURITY & EMAIL */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-sky-400" />
                    <span>Registered Account Email</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Update the email address associated with your session. Your email is used for verification and administrator role mapping.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 bg-[#0b0f19] border border-[#1e293b] focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-mono"
                  />
                  <button
                    onClick={handleSaveEmail}
                    className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs rounded-xl transition cursor-pointer shrink-0"
                  >
                    Save Email
                  </button>
                </div>

                {emailSaveFeedback && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Email updated and saved to session profile!</span>
                  </div>
                )}
              </div>

              <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-4 sm:p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Session Security & D1 Database Engine</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Session credentials and authentication tokens are encrypted and checked against the Cloudflare D1 database.
                </p>
                <div className="p-3 bg-[#0b0f19] border border-[#1e293b] rounded-xl flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Database Engine:</span>
                  <span className="text-emerald-400 font-bold">Cloudflare D1 SQL Server</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer with Sign Out trigger */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#070a12] border-t border-[#1e293b] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 font-mono truncate max-w-[200px] sm:max-w-[300px]">
            {user} ({displayEmail})
          </span>

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>

      {/* CONFIRMATION PROMPT MODAL FOR LOGOUT */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#111827] border border-[#1e293b] rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <LogOut className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white tracking-tight">Confirm Sign Out</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are you sure you want to log out of your account? Your active session will be ended and you will need to sign in again to access administrator tools or customize settings.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-rose-950 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Yes, Sign Out</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
