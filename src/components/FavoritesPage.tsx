import React, { useState, useEffect } from 'react';
import { WikiPage } from '../types/wiki';
import { Heart, Sparkles, ArrowRight, Trash2, BookOpen, Lock, ShieldAlert } from 'lucide-react';
import { WikiIcon } from './WikiIcon';
import { WikiApi } from '../lib/wikiApi';

interface FavoritesPageProps {
  pages: WikiPage[];
  onSelectPage: (id: string) => void;
  onGoHome: () => void;
  onOpenLogin: () => void;
  userEmail?: string | null;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  pages,
  onSelectPage,
  onGoHome,
  onOpenLogin,
  userEmail,
}) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const favoritedPages = pages.filter(p => favoriteIds.includes(p.id));

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
              Your saved articles and quick-reference wiki guides for fast access.
            </p>
          </div>

          <button
            onClick={onGoHome}
            className="px-3.5 py-1.5 bg-[#1e293b] hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Return to Portal</span>
          </button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoritedPages.map(page => (
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
  );
};
