import React from 'react';
import { Search, Menu, User, LogOut, Crown, BookOpen } from 'lucide-react';

import { isAuthorizedAdminEmail } from '../lib/adminAuth';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenCreatePage?: () => void;
  onOpenAdminPanel?: () => void;
  onToggleMobileDrawer: () => void;
  onToggleDesktopSidebar?: () => void;
  isDesktopSidebarOpen?: boolean;
  onGoHome: () => void;
  onOpenLogin: () => void;
  onOpenAccountModal?: () => void;
  user: string | null;
  userEmail?: string | null;
  onLogout: () => void;
  addonVersion: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenCreatePage,
  onOpenAdminPanel,
  onToggleMobileDrawer,
  onToggleDesktopSidebar,
  isDesktopSidebarOpen = true,
  onGoHome,
  onOpenLogin,
  onOpenAccountModal,
  user,
  userEmail,
  onLogout,
  addonVersion,
}) => {
  const isAdmin = isAuthorizedAdminEmail(userEmail);
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

          {/* Admin Panel Button */}
          {isAdmin && onOpenAdminPanel && (
            <button
              onClick={onOpenAdminPanel}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
              title="Open Admin Panel to manage and create pages"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Panel</span>
            </button>
          )}
        </div>

        {/* Center: Search Trigger Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full py-2 px-3.5 bg-[#111827] hover:bg-[#1e293b]/80 text-[#94a3b8] rounded-xl border border-[#1e293b] flex items-center justify-between text-xs transition-all hover:border-sky-500/50 group"
          >
            <span className="flex items-center gap-2 text-[#94a3b8] group-hover:text-[#cbd5e1]">
              <Search className="w-4 h-4 text-sky-400" />
              <span>Search mobs, items, recipes, bosses...</span>
            </span>
            <kbd className="px-2 py-0.5 text-[10px] font-mono bg-[#0b0f19] text-[#64748b] rounded border border-[#1e293b]">
              Ctrl + K
            </kbd>
          </button>
        </div>

        {/* Right Actions: Login & Search */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Button */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2 rounded-lg bg-[#1e293b] text-sky-400 border border-[#334155]"
            aria-label="Search Wiki"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Login / Profile Button */}
          {user ? (
            <div 
              onClick={() => onOpenAccountModal && onOpenAccountModal()}
              className="flex items-center gap-2 bg-[#1e293b]/80 border border-sky-500/30 rounded-xl px-3 py-1.5 cursor-pointer hover:bg-[#1e293b] transition-colors"
              title="Manage Account"
            >
              <div className="w-6 h-6 rounded-full bg-sky-500 text-black flex items-center justify-center font-bold text-xs">
                {user.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-white max-w-[100px] truncate hidden sm:inline">
                {user}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                className="p-1 hover:text-rose-400 transition-colors text-[#94a3b8]"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
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

