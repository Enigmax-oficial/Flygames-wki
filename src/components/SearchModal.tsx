import React, { useState, useEffect } from 'react';
import { WikiPage, CategoryType } from '../types/wiki';
import { getPageCoverImage } from '../data/itemAssets';
import { WikiIcon } from './WikiIcon';
import { Search, X, CornerDownLeft } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: WikiPage[];
  onSelectPage: (pageId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  pages,
  onSelectPage,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryType | 'all'>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredPages = pages.filter((page) => {
    const matchesCategory = selectedCategoryFilter === 'all' || page.category === selectedCategoryFilter;
    const q = query.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesTitle = page.title.toLowerCase().includes(q);
    const matchesNamespace = page.namespace.toLowerCase().includes(q);
    const matchesDesc = page.description.toLowerCase().includes(q);
    const matchesTags = page.tags?.some((t) => t.toLowerCase().includes(q));

    return matchesCategory && (matchesTitle || matchesNamespace || matchesDesc || matchesTags);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-black/80 backdrop-blur-sm font-sans">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-[#e0e0e0]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#2a2a2a] bg-[#0c0c0c] flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search item name, mob, block, recipe or ID (e.g. aetheria:aetherial_sword)..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-[#666] focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#666] hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded bg-[#1a1a1a] text-[#888] hover:text-white border border-[#333] text-xs font-mono"
          >
            ESC
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-4 py-2.5 bg-[#141414] border-b border-[#2a2a2a] flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[#666] font-bold uppercase text-[10px] tracking-wider shrink-0">Filter:</span>
          {(['all', 'items', 'mobs', 'blocks', 'recipes', 'biomes', 'guides'] as const).map((cat, idx) => (
            <button
              key={`${cat}-${idx}`}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded capitalize transition-colors whitespace-nowrap text-xs font-semibold ${
                selectedCategoryFilter === cat
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-[#1a1a1a] text-[#aaa] hover:text-white border border-[#2a2a2a]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {filteredPages.length === 0 ? (
            <div className="text-center py-10 text-[#666]">
              <p className="text-sm font-semibold text-[#888]">No articles found for "{query}".</p>
              <p className="text-xs mt-1">Try broader terms or select a different category filter.</p>
            </div>
          ) : (
            filteredPages.map((page) => (
              <div
                key={page.id}
                onClick={() => {
                  onSelectPage(page.id);
                  onClose();
                }}
                className="p-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] hover:border-emerald-500/50 rounded cursor-pointer transition-all group flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 truncate">
                  <div className="w-10 h-10 bg-[#0c0c0c] border border-[#333] rounded flex items-center justify-center text-xl shrink-0 overflow-hidden p-1">
                    {getPageCoverImage(page) ? (
                      <img src={getPageCoverImage(page)!} alt={page.title} className="w-full h-full object-contain" />
                    ) : (
                      <WikiIcon icon={page.icon} className="w-5 h-5" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm group-hover:text-emerald-400">
                        {page.title}
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#0c0c0c] text-emerald-400 rounded border border-emerald-500/20 capitalize">
                        {page.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#888] truncate mt-0.5">
                      {page.description}
                    </p>
                    <p className="text-[10px] font-mono text-emerald-500/80 mt-1">
                      {page.namespace}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-[#666] group-hover:text-emerald-400 shrink-0 font-mono">
                  <span>Open</span>
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0c0c0c] border-t border-[#2a2a2a] text-xs text-[#666] flex justify-between items-center font-mono">
          <span>{filteredPages.length} results found</span>
          <span>Tip: Search by keyword e.g. "legendary", "boss", "sword"</span>
        </div>
      </div>
    </div>
  );
};
