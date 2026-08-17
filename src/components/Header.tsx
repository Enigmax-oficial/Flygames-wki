import React from 'react';
import { Search, Menu, User, LogOut, Crown, Mic, Heart } from 'lucide-react';

interface HeaderProps {
  onOpenSearch: (isVoice?: boolean) => void;
  onOpenCreatePage?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenFavorites?: () => void;
  onToggleMobileDrawer: () => void;
  onToggleDesktopSidebar?: () => void;
  isDesktopSidebarOpen?: boolean;
  onGoHome: () => void;
  onOpenLogin: () => void;
  onOpenAccountModal?: () => void;
  user: string | null;
  userEmail?: string | null;
  userAvatar?: string | null;
  isCurrentUserAdmin?: boolean;
  isSqlConnected?: boolean;
  onLogout: () => void;
  addonVersion: string;
  hasAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenCreatePage,
  onOpenAdminPanel,
  onOpenFavorites,
  onToggleMobileDrawer,
  onToggleDesktopSidebar,
  isDesktopSidebarOpen = true,
  onGoHome,
  onOpenLogin,
  onOpenAccountModal,
  user,
  userEmail,
  userAvatar,
  isCurrentUserAdmin = false,
  isSqlConnected = false,
  onLogout,
  addonVersion,
  hasAdmin = true,
}) => {
  const canShowAdmin = Boolean(user) && Boolean(isCurrentUserAdmin);
  return (
    <header className="sticky top-0 z-30 bg-[#0b0f19]/90 backdrop-blur-md border-b border-[#1e293b] text-[#e2e8f0] px-4 sm:px-6 py-3 shadow-xl">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
        {/* Left Side: Logo & Home Button */}
        <div className="flex items-center gap-3">
          {/* Drawer / Sidebar Toggle Button (Mobile & Desktop PC) */}
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                onToggleMobileDrawer();
              } else if (onToggleDesktopSidebar) {
                onToggleDesktopSidebar();
              }
            }}
            className={`p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
              isDesktopSidebarOpen
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                : 'bg-[#1e293b]/70 hover:bg-[#1e293b] text-sky-400 border border-[#334155]'
            }`}
            aria-label="Toggle Navigation Sidebar"
            title={isDesktopSidebarOpen ? "Sidebar is Open (Click to collapse)" : "Click to Open Sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Admin Panel Button - Only visible when logged in as admin */}
          {canShowAdmin && onOpenAdminPanel && (
            <button
              onClick={onOpenAdminPanel}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm hover:border-amber-500/50"
              title="Open Admin Panel"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Panel</span>
            </button>
          )}
        </div>

        {/* Center: Search Trigger Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div
            onClick={() => onOpenSearch(false)}
            className="w-full py-2 px-3.5 bg-[#111827] hover:bg-[#1e293b]/80 text-[#94a3b8] rounded-xl border border-[#1e293b] flex items-center justify-between text-xs transition-all hover:border-sky-500/50 group cursor-pointer"
          >
            <span className="flex items-center gap-2 text-[#94a3b8] group-hover:text-[#cbd5e1]">
              <Search className="w-4 h-4 text-sky-400" />
              <span>Search mobs, items, recipes, bosses...</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSearch(true);
                }}
                className="p-1 hover:bg-emerald-500/20 text-[#94a3b8] hover:text-emerald-400 rounded transition-colors"
                title="Search with Voice"
              >
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
              </button>
              <kbd className="px-2 py-0.5 text-[10px] font-mono bg-[#0b0f19] text-[#64748b] rounded border border-[#1e293b]">
                Ctrl + K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Actions: Login & Search */}
        <div className="flex items-center gap-2">
          {/* Mobile Voice Search Button */}
          <button
            onClick={() => onOpenSearch(true)}
            className="md:hidden p-2 rounded-lg bg-[#1e293b] text-emerald-400 border border-[#334155] hover:border-emerald-500/40"
            aria-label="Voice Search Wiki"
            title="Search with Voice"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Mobile Search Button */}
          <button
            onClick={() => onOpenSearch(false)}
            className="md:hidden p-2 rounded-lg bg-[#1e293b] text-sky-400 border border-[#334155]"
            aria-label="Search Wiki"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Login / Profile Button */}
          {user ? (
            <button 
              type="button"
              onClick={() => onOpenAccountModal && onOpenAccountModal()}
              className="flex items-center gap-2 bg-[#1e293b]/80 hover:bg-[#1e293b] border border-sky-500/30 hover:border-sky-500/60 rounded-xl px-3 py-1.5 cursor-pointer transition-all active:scale-95 group shadow-sm"
              title="Manage Account Settings"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-black flex items-center justify-center font-bold text-xs overflow-hidden shadow-inner shrink-0">
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-xs font-bold text-white max-w-[110px] truncate group-hover:text-sky-300 transition-colors">
                {user}
              </span>
              {isCurrentUserAdmin && (
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" title="Administrator" />
              )}
            </button>
          ) : (
            <a
              href="/login" onClick={(e) => { e.preventDefault(); window.history.pushState(null, "", "/login"); window.dispatchEvent(new Event("popstate")); }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] active:scale-95 cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Login</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
};


