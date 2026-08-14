import React, { useState, useEffect, useMemo } from 'react';
import { WikiPage } from '../types/wiki';
import {
  Heart,
  Sparkles,
  ArrowRight,
  Trash2,
  BookOpen,
  Lock,
  LayoutGrid,
  ListFilter,
  Layers,
  Search,
  HardDrive,
  ChevronDown,
  ChevronRight,
  Zap
} from 'lucide-react';
import { WikiIcon } from './WikiIcon';
import { WikiApi } from '../lib/wikiApi';

interface FavoritesPageProps {
  pages: WikiPage[];
  onSelectPage: (id: string) => void;
  onGoHome: () => void;
  onOpenLogin: () => void;
  userEmail?: string | null;
}

type ViewDensity = 'compact' | 'grid' | 'grouped';

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  pages,
  onSelectPage,
  onGoHome,
  onOpenLogin,
  userEmail,
}) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewDensity, setViewDensity] = useState<ViewDensity>('compact');
  const [searchQuery, setSearchQuery] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const isLoggedIn = WikiApi.isUserLoggedIn() || !!userEmail;

  useEffect(() => {
    let isMounted = true;

    async function loadFavs() {
      if (!isLoggedIn) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const favs = await WikiApi.fetchFavorites();
        if (isMounted) {
          setFavoriteIds(favs);
        }
      } catch (err) {
        console.warn('Failed to load favorites:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadFavs();

    const handleUpdate = () => {
      setFavoriteIds(WikiApi.getFavorites());
    };

    window.addEventListener('wiki_favorites_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('wiki_favorites_updated', handleUpdate);
    };
  }, [isLoggedIn]);

  const handleRemoveFavorite = async (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await WikiApi.removeFavorite(pageId);
    setFavoriteIds(prev => prev.filter(id => id !== pageId));
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all saved favorites to reclaim space?')) {
      return;
    }
    setIsClearing(true);
    await WikiApi.clearAllFavorites();
    setFavoriteIds([]);
    setIsClearing(false);
  };

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const favoritedPages = useMemo(() => {
    return pages.filter(p =>
      favoriteIds.includes(p.id) || (Boolean((p as any).slug) && favoriteIds.includes((p as any).slug))
    );
  }, [pages, favoriteIds]);

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return favoritedPages;
    const q = searchQuery.toLowerCase().trim();
    return favoritedPages.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }, [favoritedPages, searchQuery]);

  const groupedPages = useMemo(() => {
    const groups: Record<string, WikiPage[]> = {};
    filteredPages.forEach(page => {
      const cat = page.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(page);
    });
    return groups;
  }, [filteredPages]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <Heart className="w-5 h-5 fill-amber-400/20 text-amber-400" />
              </span>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">My Favorites</h1>
            </div>
            <p className="text-xs text-slate-400 pl-1">
              Your saved articles and quick-reference wiki guides optimized for ultra-fast access.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onGoHome}
              className="px-3.5 py-1.5 bg-[#1e293b] hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Return to Portal</span>
            </button>
          </div>
        </div>
      </div>

      {!isLoggedIn ? (
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-10 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-white">Login Required</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Log in to your account to sync favorites across devices and manage your saved wiki guides.
            </p>
          </div>
          <button
            onClick={onOpenLogin}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-sky-500/20 inline-flex items-center gap-2"
          >
            <span>Log In Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : isLoading ? (
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>Fetching your saved favorites from Cloudflare D1...</span>
        </div>
      ) : favoritedPages.length === 0 ? (
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-12 text-center space-y-3 shadow-xl">
          <Heart className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Favorites Saved Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Click the "Add to Favorites" heart button on any wiki page to save it here for instant access.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Space Saver Controls Bar */}
          <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
            {/* Left: View Mode Density Toggles */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Density:</span>
              <div className="bg-[#0b0f19] border border-[#1e293b] p-1 rounded-xl flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewDensity('compact')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    viewDensity === 'compact'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ultra-compact single row view (saves up to 70% vertical screen space)"
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Compact</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewDensity('grid')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    viewDensity === 'grid'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Standard grid card view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewDensity('grouped')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    viewDensity === 'grouped'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Group by category with collapsible sections"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Grouped</span>
                </button>
              </div>
            </div>

            {/* Middle: Search Box */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search saved favorites..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-amber-500/50 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
              />
            </div>

            {/* Right: Space Saver Metrics & Clear All */}
            <div className="flex items-center gap-2">
              <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-[10px] font-mono font-bold">
                <HardDrive className="w-3 h-3 text-amber-400" />
                <span>Space Saved: {viewDensity === 'compact' ? '70% Height' : 'Minimal D1 Payload'}</span>
              </span>

              <button
                type="button"
                onClick={handleClearAll}
                disabled={isClearing}
                className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title="Remove all saved favorites to free up storage space"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isClearing ? 'Clearing...' : 'Clear All'}</span>
              </button>
            </div>
          </div>

          {/* Results List based on Density */}
          {filteredPages.length === 0 ? (
            <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-8 text-center text-slate-400 text-xs">
              No favorites matched your search "{searchQuery}".
            </div>
          ) : viewDensity === 'compact' ? (
            /* ULTRA-COMPACT SINGLE ROW LIST VIEW (Saves 70% space) */
            <div className="bg-[#111827] border border-[#1e293b] rounded-2xl divide-y divide-[#1e293b] overflow-hidden shadow-lg">
              {filteredPages.map(page => (
                <div
                  key={page.id}
                  onClick={() => onSelectPage(page.id)}
                  className="px-4 py-2.5 hover:bg-[#151d2e] flex items-center justify-between gap-3 transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <WikiIcon icon={page.icon} category={page.category} className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                      {page.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700/60 rounded font-mono shrink-0 hidden sm:inline">
                      {page.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-mono text-slate-500 hidden md:inline">
                      {page.views || page.view_count || 0} views
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveFavorite(page.id, e)}
                      className="p-1 bg-[#0b0f19] hover:bg-rose-950/60 border border-[#1e293b] hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded transition cursor-pointer"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          ) : viewDensity === 'grouped' ? (
            /* GROUPED CATEGORY ACCORDION VIEW */
            <div className="space-y-3">
              {Object.entries(groupedPages).map(([category, catPages]) => {
                const isCollapsed = collapsedCategories[category];
                return (
                  <div key={category} className="bg-[#111827] border border-[#1e293b] rounded-2xl overflow-hidden shadow-md">
                    <div
                      onClick={() => toggleCategoryCollapse(category)}
                      className="px-4 py-3 bg-[#131b2c] hover:bg-[#182236] flex items-center justify-between cursor-pointer transition select-none"
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-amber-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-amber-400" />
                        )}
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          {category}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded-full border border-amber-500/20 font-bold">
                          {catPages.length}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {isCollapsed ? 'Expand' : 'Collapse'}
                      </span>
                    </div>

                    {!isCollapsed && (
                      <div className="divide-y divide-[#1e293b]">
                        {catPages.map(page => (
                          <div
                            key={page.id}
                            onClick={() => onSelectPage(page.id)}
                            className="px-4 py-2.5 hover:bg-[#151d2e] flex items-center justify-between gap-3 transition group cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <WikiIcon icon={page.icon} category={page.category} className="w-4 h-4 text-amber-400 shrink-0" />
                              <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                                {page.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => handleRemoveFavorite(page.id, e)}
                                className="p-1 bg-[#0b0f19] hover:bg-rose-950/60 border border-[#1e293b] hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded transition cursor-pointer"
                                title="Remove from favorites"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* STANDARD GRID CARDS VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPages.map(page => (
                <div
                  key={page.id}
                  onClick={() => onSelectPage(page.id)}
                  className="bg-[#111827] hover:bg-[#151d2e] border border-[#1e293b] hover:border-amber-500/30 rounded-2xl p-4 transition-all group flex flex-col justify-between cursor-pointer shadow-md space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold uppercase font-mono">
                        {page.category}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveFavorite(page.id, e)}
                        className="p-1.5 bg-[#0b0f19] hover:bg-rose-950/50 border border-[#1e293b] hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                        title="Remove from favorites"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-start gap-3 pt-1">
                      <WikiIcon icon={page.icon} category={page.category} className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                          {page.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {page.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Views: {page.views || page.view_count || 0}</span>
                    <span className="text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Read Article
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

