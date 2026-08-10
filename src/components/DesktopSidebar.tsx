import React from 'react';
import { WikiPage, CategoryType } from '../types/wiki';
import { getPageCoverImage } from '../data/itemAssets';
import { WikiApi } from '../lib/wikiApi';
import { WikiIcon } from './WikiIcon';
import { 
  Home,
  Sword, 
  Ghost, 
  Box, 
  ScrollText, 
  Trees, 
  BookOpen, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Crown
} from 'lucide-react';

interface DesktopSidebarProps {
  pages: WikiPage[];
  selectedCategory: CategoryType | 'all';
  selectedPageId: string | null;
  onSelectCategory: (category: CategoryType | 'all') => void;
  onSelectPage: (pageId: string) => void;
  onGoHome: () => void;
  isOpen?: boolean;
  onToggleSidebar?: () => void;
  userEmail?: string | null;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  pages,
  selectedCategory,
  selectedPageId,
  onSelectCategory,
  onSelectPage,
  onGoHome,
  isOpen = true,
  onToggleSidebar,
  userEmail,
}) => {
  if (!isOpen) return null;

  const authorizedEmails = ['ruanpablolopesbritor@gmail.com', 'ruanpablolopesbritoruan@gmail.com'];
  const isAdmin = userEmail && authorizedEmails.includes(userEmail.toLowerCase().trim());

  const dynamicCategories = WikiApi.getCategories();

  const renderSidebarIcon = (catId: string, iconStr: string) => {
    if (catId === 'mobs') return <Ghost className="w-4 h-4 text-rose-400" />;
    if (catId === 'items') return <Sword className="w-4 h-4 text-amber-400" />;
    if (catId === 'blocks') return <Box className="w-4 h-4 text-sky-400" />;
    if (catId === 'recipes') return <ScrollText className="w-4 h-4 text-cyan-400" />;
    if (catId === 'biomes') return <Trees className="w-4 h-4 text-purple-400" />;
    if (catId === 'guides') return <BookOpen className="w-4 h-4 text-indigo-400" />;
    return <WikiIcon icon={iconStr || '📁'} className="w-4 h-4" />;
  };

  return (
    <aside className="w-64 bg-[#111827] border-r border-[#1e293b] text-[#e2e8f0] flex flex-col h-[calc(100vh-61px)] sticky top-[61px] overflow-y-auto hidden md:flex shrink-0 font-sans z-20">
      {/* Categories Header */}
      <div className="p-4 border-b border-[#1e293b]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">
              Wiki Navigation
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 text-[10px] bg-[#0b0f19] text-sky-400 border border-sky-500/20 rounded font-mono font-bold">
              {pages.length} Pages
            </span>
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-1 rounded bg-[#0b0f19] hover:bg-[#1e293b] text-[#64748b] hover:text-white border border-[#1e293b] transition-colors cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Portal / Home Button */}
        <button
          onClick={onGoHome}
          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all mb-2 ${
            selectedPageId === 'home'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
              : 'hover:bg-[#1e293b] text-[#94a3b8] hover:text-white border border-transparent'
          }`}
        >
          <span className="flex items-center gap-2">
            <Home className="w-4 h-4 text-sky-400" />
            <span>Portal Homepage</span>
          </span>
          <span className="text-[10px] uppercase font-mono text-sky-400 font-bold">Main</span>
        </button>
        {!userEmail && (
          <a
            href="#/login"
            className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all mb-4 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400"
          >
            <span className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              <span>Sign In / Register</span>
            </span>
          </a>
        )}

        {/* All Pages Button */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all mb-2 ${
            selectedCategory === 'all' && selectedPageId !== 'home' && selectedPageId !== 'admin-panel'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
              : 'hover:bg-[#1e293b] text-[#94a3b8] hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>All Database Entries</span>
          </span>
          <span className="text-[10px] font-mono text-[#64748b]">{pages.length}</span>
        </button>

        {/* Admin Control Panel link */}
        {isAdmin && (
          <button
            onClick={() => onSelectPage('admin-panel')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
              selectedPageId === 'admin-panel'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'hover:bg-[#1e293b] text-amber-400 hover:text-amber-300 border border-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Admin Control Panel</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-mono tracking-tighter">Full</span>
          </button>
        )}
      </div>

      {/* Categories Tree */}
      <div className="p-3 space-y-1 border-b border-[#1e293b]">
        <p className="text-[10px] uppercase tracking-widest text-[#64748b] mb-2 px-2 font-bold">
          Addon Categories
        </p>
        {dynamicCategories.map((cat) => {
          const count = pages.filter((p) => p.category === cat.id).length;
          const isSelected = selectedCategory === cat.id && selectedPageId !== 'home';

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                isSelected
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold'
                  : 'hover:bg-[#1e293b] text-[#94a3b8] hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{renderSidebarIcon(cat.id, cat.icon)}</span>
                <span>{cat.label}</span>
              </span>
              <span className="text-[10px] font-mono text-[#64748b]">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Pages List for Current Category */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-[#64748b] mb-2 px-2 font-bold">
          {selectedCategory === 'all' ? 'Articles' : selectedCategory} ({pages.filter((p) => selectedCategory === 'all' || p.category === selectedCategory).length})
        </p>

        {pages
          .filter((p) => selectedCategory === 'all' || p.category === selectedCategory)
          .map((page) => {
            const isSelected = selectedPageId === page.id;

            return (
              <button
                key={page.id}
                onClick={() => onSelectPage(page.id)}
                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between group transition-all ${
                  isSelected
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold'
                    : 'hover:bg-[#1e293b] text-[#94a3b8] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {getPageCoverImage(page) ? (
                    <div className="w-5 h-5 rounded bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                      <img src={getPageCoverImage(page)!} alt={page.title} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <WikiIcon icon={page.icon} className="w-5 h-5 text-sm" />
                  )}
                  <span className="truncate">{page.title}</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                    isSelected ? 'text-sky-400 opacity-100' : 'text-[#475569] opacity-0 group-hover:opacity-100'
                  }`}
                />
              </button>
            );
          })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#1e293b] bg-[#0b0f19] text-center text-[11px] text-[#64748b]">
        Etherium Addon Wiki v1.4.0
      </div>
    </aside>
  );
};

