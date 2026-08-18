import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  Globe, 
  Database, 
  Shield, 
  Crown, 
  User, 
  Mail, 
  Edit3, 
  Check, 
  X, 
  LogOut, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  KeyRound, 
  CheckCircle2, 
  Image as ImageIcon,
  Laptop,
  Smartphone,
  Sliders,
  Bell,
  Cpu
} from 'lucide-react';
import { WikiApi } from '../lib/wikiApi';
import { ImageCropper } from './ImageCropper';
import { MINECRAFT_AVATARS } from '../utils/minecraftAvatars';

const LANGUAGES = [
  { code: 'en', label: 'English (US)', flag: '🇺🇸' },
  { code: 'es', label: 'Español (ES)', flag: '🇪🇸' },
  { code: 'pt', label: 'Português (BR)', flag: '🇧🇷' },
  { code: 'fr', label: 'Français (FR)', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch (DE)', flag: '🇩🇪' },
  { code: 'ja', label: '日本語 (JP)', flag: '🇯🇵' },
];

interface SettingsPageProps {
  onBack: () => void;
  user: string | null;
  userEmail?: string | null;
  userAvatar?: string | null;
  isCurrentUserAdmin?: boolean;
  isSqlConnected?: boolean;
  onLogout: () => void;
  onUpdateUserName?: (newName: string) => void;
  onUpdateUserAvatar?: (newAvatar: string | null) => void;
  onOpenAdminPanel?: () => void;
  onOpenLogin?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onBack,
  user,
  userEmail,
  userAvatar,
  isCurrentUserAdmin = false,
  isSqlConnected = false,
  onLogout,
  onUpdateUserName,
  onUpdateUserAvatar,
  onOpenAdminPanel,
  onOpenLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'account' | 'database' | 'security'>('general');
  const [theme, setTheme] = useState<'cyber' | 'obsidian' | 'slate'>(() => {
    try {
      return (localStorage.getItem('etherium_theme') as any) || 'cyber';
    } catch {
      return 'cyber';
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('etherium_sound_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('etherium_animations_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem('etherium_language') || 'en';
    } catch {
      return 'en';
    }
  });

  // Account editing states
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user || '');
  const [nameSaveFeedback, setNameSaveFeedback] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [cacheClearFeedback, setCacheClearFeedback] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(24);
  const [isPinging, setIsPinging] = useState(false);

  const googleAvatarUrl = (() => {
    try {
      return localStorage.getItem('etherium_google_avatar') || localStorage.getItem('google_avatar_url');
    } catch {
      return null;
    }
  })();

  const effectiveAvatar = userAvatar || googleAvatarUrl;

  useEffect(() => {
    setNewName(user || '');
  }, [user]);

  const handleThemeChange = (newTheme: 'cyber' | 'obsidian' | 'slate') => {
    setTheme(newTheme);
    try {
      localStorage.setItem('etherium_theme', newTheme);
    } catch {}
  };

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem('etherium_sound_enabled', String(next));
    } catch {}
  };

  const handleAnimationsToggle = () => {
    const next = !animationsEnabled;
    setAnimationsEnabled(next);
    try {
      localStorage.setItem('etherium_animations_enabled', String(next));
    } catch {}
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    try {
      localStorage.setItem('etherium_language', lang);
    } catch {}
  };

  const handleSaveName = () => {
    if (newName.trim() && onUpdateUserName) {
      onUpdateUserName(newName.trim());
      setIsEditingName(false);
      setNameSaveFeedback(true);
      setTimeout(() => setNameSaveFeedback(false), 2500);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImageForCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePingServer = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      await fetch('/api/health');
      const diff = Math.round(performance.now() - start);
      setPingLatency(diff);
    } catch {
      setPingLatency(null);
    } finally {
      setIsPinging(false);
    }
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('wiki_cached_pages');
      sessionStorage.clear();
      setCacheClearFeedback(true);
      setTimeout(() => setCacheClearFeedback(false), 3000);
    } catch {}
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
    onBack();
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-200 font-sans flex flex-col">
      {/* Image Cropper Modal */}
      {selectedImageForCrop && (
        <ImageCropper
          imageSrc={selectedImageForCrop}
          onCropComplete={(croppedBase64) => {
            if (onUpdateUserAvatar) {
              onUpdateUserAvatar(croppedBase64);
            }
            setSelectedImageForCrop(null);
          }}
          onCancel={() => setSelectedImageForCrop(null)}
        />
      )}

      {/* Logout Confirmation Prompt */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0b0f19] border border-rose-500/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Log Out Confirmation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to log out? You will need to sign in again to edit wiki articles, save favorites, or access admin features.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-[#1e293b] hover:bg-[#334155] text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Yes, Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#0b0f19]/90 backdrop-blur-md border-b border-[#1e293b] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1e293b]/80 hover:bg-[#1e293b] text-slate-300 hover:text-white border border-[#334155] text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
            title="Return to Portal"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight">System Settings</h1>
              <p className="text-[10px] text-slate-500 font-mono hidden sm:block">Preferences & Configuration</p>
            </div>
          </div>
        </div>

        {/* Database Status Indicator */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-2 bg-[#111827] px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-400">Database:</span>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">Online</span>
            {pingLatency && (
              <span className="text-[10px] font-mono text-slate-500">({pingLatency}ms)</span>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-2 bg-[#111827] px-2.5 py-1.5 rounded-xl border border-slate-800">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-sky-400 to-indigo-500 text-black flex items-center justify-center font-bold text-xs overflow-hidden">
                {effectiveAvatar ? (
                  <img src={effectiveAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-xs font-bold text-white max-w-[100px] truncate">{user}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col md:flex-row gap-6">
        {/* Navigation Tabs (Sidebar on Desktop, Horizontal Scroll on Mobile) */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          <div className="flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 md:w-full px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer border shrink-0 ${
                activeTab === 'general'
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 shadow-sm'
                  : 'bg-[#0b0f19] hover:bg-[#111827] text-slate-400 hover:text-slate-200 border-slate-800/80'
              }`}
            >
              <Sliders className="w-4 h-4 text-sky-400 shrink-0" />
              <span>General & Interface</span>
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`flex-1 md:w-full px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer border shrink-0 ${
                activeTab === 'account'
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 shadow-sm'
                  : 'bg-[#0b0f19] hover:bg-[#111827] text-slate-400 hover:text-slate-200 border-slate-800/80'
              }`}
            >
              <User className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Account & Avatar</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`flex-1 md:w-full px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer border shrink-0 ${
                activeTab === 'database'
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 shadow-sm'
                  : 'bg-[#0b0f19] hover:bg-[#111827] text-slate-400 hover:text-slate-200 border-slate-800/80'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Database & Engine</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 md:w-full px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer border shrink-0 ${
                activeTab === 'security'
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 shadow-sm'
                  : 'bg-[#0b0f19] hover:bg-[#111827] text-slate-400 hover:text-slate-200 border-slate-800/80'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Security & Auth</span>
            </button>
          </div>

          {/* Quick info card on desktop */}
          <div className="hidden md:block p-4 bg-[#0b0f19] border border-slate-800/80 rounded-2xl space-y-2 mt-4">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Addon Wiki Engine</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Custom-engineered wiki portal with real-time SQL synchronization and Bedrock asset rendering.
            </p>
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="flex-1 bg-[#0b0f19] border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
          {/* 1. GENERAL & INTERFACE TAB */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  <span>General & Display Settings</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Customize theme, audio feedback, and visual presentation.</p>
              </div>

              {/* Theme Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                  Theme Palette
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleThemeChange('cyber')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      theme === 'cyber'
                        ? 'bg-sky-500/10 border-sky-500 text-white shadow-sm'
                        : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold">Cyber Dark</span>
                      {theme === 'cyber' && <Check className="w-4 h-4 text-sky-400" />}
                    </div>
                    <p className="text-[10px] text-slate-500">Sky & Indigo neon accents</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange('obsidian')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      theme === 'obsidian'
                        ? 'bg-purple-500/10 border-purple-500 text-white shadow-sm'
                        : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold">Obsidian Portal</span>
                      {theme === 'obsidian' && <Check className="w-4 h-4 text-purple-400" />}
                    </div>
                    <p className="text-[10px] text-slate-500">Deep purple & Nether glow</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange('slate')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      theme === 'slate'
                        ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm'
                        : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold">Deep Slate</span>
                      {theme === 'slate' && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-[10px] text-slate-500">Emerald ore & Stone tones</p>
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3.5 bg-[#111827] border border-slate-800 rounded-2xl">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-sky-400" />
                      <span>Interface Sound Effects</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Audio feedback on clicks, actions, and search triggers</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSoundToggle}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      soundEnabled ? 'bg-sky-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                        soundEnabled ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#111827] border border-slate-800 rounded-2xl">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Ambient Particles & Glow</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Atmospheric background effects and smooth page transitions</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAnimationsToggle}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      animationsEnabled ? 'bg-sky-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                        animationsEnabled ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Language Selector */}
              <div className="space-y-2 pt-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>Portal Display Language</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                        selectedLanguage === lang.code
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                          : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. ACCOUNT & AVATAR TAB */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span>Account Management & Identity</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Manage your profile, voxel avatar, and session security.</p>
              </div>

              {user ? (
                <div className="space-y-6">
                  {/* Profile Header Banner */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-500/30 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center font-black text-3xl text-black shadow-xl overflow-hidden border-2 border-sky-400/40">
                        {effectiveAvatar ? (
                          <img src={effectiveAvatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          user.charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        {isEditingName ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              className="bg-[#0b0f19] border border-sky-500 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={handleSaveName}
                              className="p-1 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setIsEditingName(false)}
                              className="p-1 bg-slate-800 text-slate-400 rounded-lg cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-lg font-black text-white">{user}</h3>
                            <button
                              onClick={() => setIsEditingName(true)}
                              className="text-slate-400 hover:text-sky-400 p-1 cursor-pointer"
                              title="Edit name"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {nameSaveFeedback && (
                              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Saved
                              </span>
                            )}
                          </div>
                        )}

                        {isCurrentUserAdmin && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                            <Crown className="w-3 h-3" /> Admin
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 font-mono flex items-center justify-center sm:justify-start gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-sky-400" />
                        <span>{userEmail || 'No email associated'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Avatar Picker & Upload */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                      Choose Your Minecraft Avatar Skin
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-1 bg-[#070a12] border border-slate-800 rounded-2xl">
                      {MINECRAFT_AVATARS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            if (onUpdateUserAvatar) onUpdateUserAvatar(preset.url);
                          }}
                          className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer group ${
                            effectiveAvatar === preset.url
                              ? 'bg-sky-500/20 border-sky-400 shadow-md shadow-sky-500/20 ring-2 ring-sky-400'
                              : 'bg-[#111827] border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                            <img 
                              src={preset.url} 
                              alt={preset.name} 
                              className="w-full h-full object-contain group-hover:scale-110 transition" 
                              style={{ imageRendering: 'pixelated' }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-slate-300 truncate w-full text-center">{preset.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {/* Google Avatar Sync */}
                      {googleAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateUserAvatar) onUpdateUserAvatar(googleAvatarUrl);
                          }}
                          className="px-3 py-2 bg-[#111827] hover:bg-[#1e293b] border border-slate-800 rounded-xl text-xs font-bold text-sky-400 flex items-center gap-2 cursor-pointer transition"
                        >
                          <div className="w-4 h-4 rounded-full overflow-hidden shrink-0">
                            <img src={googleAvatarUrl} alt="Google" className="w-full h-full object-cover" />
                          </div>
                          <span>Use Google Account Image</span>
                        </button>
                      )}

                      {/* Custom Upload */}
                      <label className="px-3 py-2 bg-[#111827] hover:bg-[#1e293b] border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 cursor-pointer transition">
                        <ImageIcon className="w-4 h-4 text-sky-400" />
                        <span>Upload Custom Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Account Session / Logout Section */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white">Log Out of Addon Wiki</h4>
                        <p className="text-[11px] text-slate-400">End your active session securely on this device</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(true)}
                        className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/60 text-rose-400 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#111827] border border-slate-800 rounded-2xl space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/20">
                    <User className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Guest Session Active</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Sign in to customize your voxel avatar, manage contributions, and save your favorites across devices.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenLogin) onOpenLogin();
                        else onBack();
                      }}
                      className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-sky-500/20"
                    >
                      Sign In / Register
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. DATABASE & STORAGE ENGINE TAB */}
          {activeTab === 'database' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>High-Performance SQL Database Engine</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">High-performance database connectivity & cache synchronization.</p>
              </div>

              {/* Status Card */}
              <div className="p-4 bg-[#111827] border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <div>
                      <h3 className="text-xs font-bold text-white">Edge SQL Database Server</h3>
                      <p className="text-[10px] text-slate-400 font-mono">SQLite engine at edge locations</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePingServer}
                    disabled={isPinging}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                    <span>Ping Health</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center font-mono">
                  <div className="p-2.5 bg-[#0b0f19] border border-slate-800/80 rounded-xl">
                    <div className="text-[10px] text-slate-500 uppercase">Engine</div>
                    <div className="text-xs font-bold text-white">Edge SQLite</div>
                  </div>
                  <div className="p-2.5 bg-[#0b0f19] border border-slate-800/80 rounded-xl">
                    <div className="text-[10px] text-slate-500 uppercase">Latency</div>
                    <div className="text-xs font-bold text-emerald-400">{pingLatency ? `${pingLatency}ms` : 'Online'}</div>
                  </div>
                  <div className="p-2.5 bg-[#0b0f19] border border-slate-800/80 rounded-xl">
                    <div className="text-[10px] text-slate-500 uppercase">WAL Mode</div>
                    <div className="text-xs font-bold text-sky-400">Enabled</div>
                  </div>
                  <div className="p-2.5 bg-[#0b0f19] border border-slate-800/80 rounded-xl">
                    <div className="text-[10px] text-slate-500 uppercase">Sync Status</div>
                    <div className="text-xs font-bold text-emerald-400">Synchronized</div>
                  </div>
                </div>
              </div>

              {/* Cache Management */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                  Cache & Local Storage
                </label>
                <div className="flex items-center justify-between p-3.5 bg-[#111827] border border-slate-800 rounded-2xl">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white">Clear Local Wiki Cache</div>
                    <p className="text-[11px] text-slate-400">Force refetch of all articles and categories from the database</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCache}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Clear Cache</span>
                  </button>
                </div>
                {cacheClearFeedback && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Local cache purged successfully. Fresh content will load from the database.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. SECURITY & AUTH TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Security & Authentication</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Verification protocols and access controls.</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-[#111827] border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Email Verification (Resend API)</h4>
                      <p className="text-[11px] text-slate-400">6-digit secure code dispatched to real inboxes</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                    Active
                  </span>
                </div>

                <div className="p-4 bg-[#111827] border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Google OAuth 2.0</h4>
                      <p className="text-[11px] text-slate-400">One-tap authentication with verified profile image</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                    Enabled
                  </span>
                </div>

                {isCurrentUserAdmin && onOpenAdminPanel && (
                  <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span>Admin Control Center</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">Manage user roles, categories, and system database entries</p>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenAdminPanel}
                      className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Open Admin Panel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
