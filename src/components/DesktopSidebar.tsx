import React, { useState, useEffect } from 'react';
import { WikiPage, CategoryType } from '../types/wiki';
import { getPageCoverImage, getItemImage } from '../lib/assetHelper';
import { WikiApi } from '../lib/wikiApi';
import { isAuthorizedAdminEmail } from '../lib/adminAuth';
import { WikiIcon } from './WikiIcon';
import { 
  Home,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Crown,
  User,
  Heart,
  Search,
  Compass,
  Layers,
  BookOpen
} from 'lucide-react';

interface DesktopSidebarProps {
  pages: WikiPage[];
  selectedCategory: CategoryType | 'all' | string;
  selectedPageId: string | null;
  onSelectCategory: (category: CategoryType | 'all' | string) => void;
  onSelectPage: (pageId: string) => void;
  onGoHome: () => void;
  isOpen?: boolean;
  onToggleSidebar?: () => void;
  userEmail?: string | null;
  hasAdmin?: boolean;
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
  hasAdmin = true,
}) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => WikiApi.getFavorites());
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');

  useEffect(() => {
    const handleFavUpdate = () => {
      setFavoriteIds(WikiApi.getFavorites());
    };
    window.addEventListener('wiki_favorites_updated', handleFavUpdate);
    WikiApi.fetchFavorites().then(favs => setFavoriteIds(favs)).catch(() => {});
    return () => window.removeEventListener('wiki_favorites_updated', handleFavUpdate);
  }, []);

  if (!isOpen) return null;

  const isAdmin = !hasAdmin || (Boolean(userEmail) && isAuthorizedAdminEmail(userEmail));
  const dynamicCategories = WikiApi.getCategories();

  const renderSidebarIcon = (catId: string, iconStr: string) => {
    return <WikiIcon icon={catId || iconStr || 'item'} className="w-4 h-4 text-sky-400 shrink-0" />;
  };

  const filteredPages = pages.filter((p) => {
    const matchesCategory = selectedCategory === 'favorites'
      ? favoriteIds.includes(p.id)
      : selectedCategory === 'all' || p.category === selectedCategory;

    if (!matchesCategory) return false;

    if (!sidebarSearchQuery.trim()) return true;

    const q = sidebarSearchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.namespace && p.namespace.toLowerCase().includes(q))
    );
  });

  return (
    <aside className="w-72 bg-[#0b0f19]/95 backdrop-blur-xl border-r border-[#1e293b] text-[#e2e8f0] flex flex-col h-[calc(100vh-61px)] sticky top-[61px] overflow-hidden hidden md:flex shrink-0 font-sans z-20 shadow-2xl transition-all">
      
      {/* 1. Header & Collapse Control */}
      <div className="p-3.5 border-b border-[#1e293b] bg-[#0d1322]/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-xs">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Quick Access</h3>
              <p className="text-[10px] text-slate-500 font-medium">Wiki Navigation</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-md font-mono font-bold">
              {pages.length}
            </span>
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-1.5 rounded-lg bg-[#111827] hover:bg-[#1e293b] text-slate-400 hover:text-white border border-[#1e293b] transition cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Search Input inside Sidebar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter pages..."
            value={sidebarSearchQuery}
            onChange={(e) => setSidebarSearchQuery(e.target.value)}
            className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-500/50 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition font-sans"
          />
          {sidebarSearchQuery && (
            <button
              onClick={() => setSidebarSearchQuery('')}
              className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[#1e293b]/50 space-y-1">
        
        {/* 2. Primary Navigation Links */}
        <div className="p-3 space-y-1">
          <button
            onClick={onGoHome}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
              selectedPageId === 'home'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                : 'hover:bg-[#111827] text-slate-300 hover:text-white border border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Home className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Portal Homepage</span>
            </span>
            <span className="text-[10px] uppercase font-mono text-sky-400 font-bold bg-sky-500/10 px-1.5 py-0.5 rounded">Main</span>
          </button>

          {!userEmail && (
            <a
              href="/login"
              onClick={(e) => { e.preventDefault(); window.history.pushState(null, "", "/login"); window.dispatchEvent(new Event("popstate")); }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300"
            >
              <span className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Sign In / Register</span>
              </span>
            </a>
          )}

          <button
            onClick={() => onSelectCategory('all')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
              selectedCategory === 'all' && selectedPageId !== 'home' && selectedPageId !== 'admin-panel'
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold'
                : 'hover:bg-[#111827] text-slate-300 hover:text-white border border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
              <span>All Entries</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">{pages.length}</span>
          </button>

          {(!!userEmail || WikiApi.isUserLoggedIn()) && (
            <button
              onClick={() => onSelectCategory('favorites')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                selectedCategory === 'favorites'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold'
                  : 'hover:bg-[#111827] text-slate-300 hover:text-white border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Heart className={`w-4 h-4 ${selectedCategory === 'favorites' ? 'fill-amber-400 text-amber-400' : 'text-amber-400'}`} />
                <span>My Favorites</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">
                {favoriteIds.length}
              </span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => onSelectPage('admin-panel')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                selectedPageId === 'admin-panel'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'hover:bg-[#111827] text-amber-400 hover:text-amber-300 border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Admin Panel</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-mono font-bold">Manage</span>
            </button>
          )}
        </div>

        {/* 3. Category Selectors Grid */}
        <div className="p-3 space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 px-2 font-bold flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-sky-400" />
            <span>Addon Categories</span>
          </p>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {dynamicCategories.map((cat) => {
              const count = pages.filter((p) => p.category === cat.id).length;
              const isSelected = selectedCategory === cat.id && selectedPageId !== 'home' && selectedPageId !== 'admin-panel';

              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`text-left px-2.5 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-between transition-all border ${
                    isSelected
                      ? 'bg-sky-500/15 text-sky-300 border-sky-500/30 font-bold shadow-sm'
                      : 'bg-[#0f172a]/60 hover:bg-[#1e293b] text-slate-300 hover:text-white border-[#1e293b]'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {renderSidebarIcon(cat.id, cat.icon)}
                    <span className="truncate">{cat.label}</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 shrink-0 pl-1">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Filtered Article Items List */}
        <div className="p-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500 px-2 font-bold pb-1">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-sky-400" />
              <span>{selectedCategory === 'all' ? 'Articles' : selectedCategory === 'favorites' ? 'Favorites' : selectedCategory}</span>
            </span>
            <span className="font-mono text-sky-400 font-bold">({filteredPages.length})</span>
          </div>

          {filteredPages.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 bg-[#0d1322] rounded-xl border border-[#1e293b] italic">
              {selectedCategory === 'favorites'
                ? 'No favorited articles found.'
                : 'No articles match your filter.'}
            </div>
          ) : (
            filteredPages.map((page) => {
              const isSelected = selectedPageId === page.id;
              const coverImg = getPageCoverImage(page);

              return (
                <button
                  key={page.id}
                  onClick={() => onSelectPage(page.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between group transition-all border ${
                    isSelected
                      ? 'bg-sky-500/15 text-sky-300 border-sky-500/40 font-bold shadow-sm'
                      : 'bg-[#0d1322]/40 hover:bg-[#1e293b] text-slate-300 hover:text-white border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {/* Page Icon / Image Thumbnail */}
                    <div className="w-6 h-6 rounded-lg bg-[#111827] border border-[#1e293b] flex items-center justify-center shrink-0 overflow-hidden p-0.5 shadow-inner">
                      {coverImg ? (
                        <img src={coverImg} alt={page.title} className="w-full h-full object-contain" />
                      ) : (
                        <WikiIcon icon={page.icon} category={page.category} className="w-4 h-4 text-sky-400" />
                      )}
                    </div>
                    <span className="truncate">{page.title}</span>
                  </div>

                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      isSelected ? 'text-sky-400 opacity-100 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

      </div>

      {/* 5. Compact Footer */}
      <div className="p-2.5 border-t border-[#1e293b] bg-[#070a12] text-center text-[10px] font-mono text-slate-500 flex items-center justify-between px-4">
        <span>Etherium Addon Wiki</span>
        <span className="text-sky-400 font-bold">v1.4.0</span>
      </div>
    </aside>
  );
};


