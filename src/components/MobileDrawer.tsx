import React from 'react';
import { WikiPage, CategoryType } from '../types/wiki';
import { getPageCoverImage, getItemImage } from '../data/itemAssets';
import { WikiApi } from '../lib/wikiApi';
import { isAuthorizedAdminEmail } from '../lib/adminAuth';
import { WikiIcon } from './WikiIcon';
import { 
  X, 
  Home,
  Sword, 
  Ghost, 
  Box, 
  ScrollText, 
  Trees, 
  BookOpen, 
  Sparkles, 
  Search,
  Crown,
  Globe,
  User
} from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pages: WikiPage[];
  selectedCategory: CategoryType | 'all';
  selectedPageId: string | null;
  onSelectCategory: (category: CategoryType | 'all') => void;
  onSelectPage: (pageId: string) => void;
  onGoHome: () => void;
  onOpenSearch: () => void;
  userEmail?: string | null;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  pages,
  selectedCategory,
  selectedPageId,
  onSelectCategory,
  onSelectPage,
  onGoHome,
  onOpenSearch,
  userEmail,
}) => {
  if (!isOpen) return null;

  const isAdmin = isAuthorizedAdminEmail(userEmail);

  const dynamicCategories = WikiApi.getCategories();

  const renderMobileIcon = (catId: string, iconStr: string) => {
    if (catId === 'mobs') return <img src="/images/categories/mobs.png" alt="Mobs" className="w-4 h-4 object-contain" />;
    if (catId === 'items') return <img src="/images/weapons/copper_sword.png" alt="Items" className="w-4 h-4 object-contain" />;
    if (catId === 'blocks') return <img src="/images/categories/blocks.png" alt="Blocks" className="w-4 h-4 object-contain" />;
    if (catId === 'recipes') return <img src="/images/categories/recipes.png" alt="Recipes" className="w-4 h-4 object-contain" />;
    if (catId === 'biomes') return <img src="/images/categories/biomes.png" alt="Biomes" className="w-4 h-4 object-contain" />;
    if (catId === 'guides') return <img src="/images/categories/guides.png" alt="Guides" className="w-4 h-4 object-contain" />;
    return <WikiIcon icon={iconStr || 'item'} className="w-4 h-4 text-xs" />;
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}
        
      />

      {/* Drawer Content Panel */}
      <div className="relative w-4/5 max-w-xs bg-[#111827] border-r border-[#1e293b] text-[#e2e8f0] flex flex-col h-full z-10 shadow-2xl font-sans">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#0b0f19]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-sky-500 rounded-xl font-black text-black flex items-center justify-center text-base">
              E
            </div>
            <div>
              <h2 className="font-extrabold text-white text-sm tracking-tight">Etherium Wiki</h2>
              <p className="text-[10px] text-[#64748b] uppercase font-bold">Portal Navigation</p>
            </div>
          </div>
          <button
            
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1e293b] text-[#94a3b8] hover:text-white border border-[#334155]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portal Home Trigger */}
        <div className="p-3 border-b border-[#1e293b] space-y-2">
          <button
            onClick={() => {
              onGoHome();
              onClose();
            }}
            className="w-full py-2.5 px-3 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 font-bold rounded-xl text-xs flex items-center gap-2"
          >
            <Home className="w-4 h-4 text-sky-400" />
            <span>Portal Homepage</span>
          </button>
          {!userEmail && (
            <a
              href="/login" onClick={(e) => { e.preventDefault(); window.history.pushState(null, "", "/login"); window.dispatchEvent(new Event("popstate")); onClose(); }}
              
              className="w-full py-2.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold rounded-xl text-xs flex items-center gap-2"
            >
              <User className="w-4 h-4 text-indigo-400" />
              <span>Sign In / Register</span>
            </a>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                onSelectPage('admin-panel');
                onClose();
              }}
              className="w-full py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-2"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Admin Control Panel</span>
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            className="w-full py-2 px-3 bg-[#0b0f19] text-[#94a3b8] rounded-xl border border-[#1e293b] flex items-center gap-2 text-xs font-medium"
          >
            <Search className="w-4 h-4 text-sky-400" />
            <span>Search articles & items...</span>
          </button>
        </div>

        {/* Category Pills Slider */}
        <div className="p-3 border-b border-[#1e293b] space-y-2">
          <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest block">
            Categories
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onSelectCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                selectedCategory === 'all'
                  ? 'bg-sky-500 text-black font-bold'
                  : 'bg-[#0b0f19] text-[#94a3b8] border border-[#1e293b]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>All</span>
            </button>
            {dynamicCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-sky-500 text-black font-bold'
                    : 'bg-[#0b0f19] text-[#94a3b8] border border-[#1e293b]'
                }`}
              >
                {renderMobileIcon(cat.id, cat.icon)}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pages List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-1">
          <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest block mb-2">
            Articles
          </span>
          {pages
            .filter((p) => selectedCategory === 'all' || p.category === selectedCategory)
            .map((page) => {
              const isSelected = selectedPageId === page.id;

              return (
                <button
                  key={page.id}
                  onClick={() => {
                    onSelectPage(page.id);
                    onClose();
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300 font-bold'
                      : 'bg-[#0b0f19]/60 hover:bg-[#1e293b] text-[#94a3b8] border border-[#1e293b]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {getPageCoverImage(page) ? (
                      <div className="w-6 h-6 rounded bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                        <img src={getPageCoverImage(page)!} alt={page.title} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <WikiIcon icon={page.icon} className="w-6 h-6 text-base" />
                    )}
                    <span className="truncate">{page.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748b] uppercase">
                    {page.category}
                  </span>
                </button>
              );
            })}
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-[#1e293b] bg-[#0b0f19] text-center text-xs text-[#64748b]">
          Etherium Wiki Portal v1.4.0
        </div>
      </div>
    </div>
  );
};

