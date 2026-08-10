import React, { useState } from 'react';
import { WikiPage, CategoryType } from '../types/wiki';
import { WikiIcon } from './WikiIcon';
import { getItemImage, getPageCoverImage } from '../data/itemAssets';
import { 
  Sword, 
  Ghost, 
  Box, 
  ScrollText, 
  Trees, 
  BookOpen, 
  Sparkles, 
  Search, 
  ArrowRight,
  Heart,
  Shield,
  Layers,
  Tag
} from 'lucide-react';

interface CategoryOverviewPageProps {
  category: CategoryType | 'all';
  pages: WikiPage[];
  onSelectPage: (pageId: string) => void;
  onSelectCategory: (cat: CategoryType | 'all') => void;
}

const CATEGORY_META: Record<string, { title: string; subtitle: string; icon: React.ReactNode; color: string }> = {
  all: {
    title: 'Complete Addon Database',
    subtitle: 'Explore all registered items, mobs, blocks, recipes, biomes, and guides in Aetheria.',
    icon: <Sparkles className="w-6 h-6 text-sky-400" />,
    color: 'from-sky-950/50 via-[#111827] to-[#0b0f19]',
  },
  items: {
    title: 'Items & Weapons',
    subtitle: 'Powerful weapons, enchanted tools, and rare celestial artifacts.',
    icon: <Sword className="w-6 h-6 text-amber-400" />,
    color: 'from-amber-950/50 via-[#111827] to-[#0b0f19]',
  },
  mobs: {
    title: 'Mobs & Bosses',
    subtitle: 'Dangerous entities, ancient guardians, and celestial realm creatures.',
    icon: <Ghost className="w-6 h-6 text-rose-400" />,
    color: 'from-rose-950/50 via-[#111827] to-[#0b0f19]',
  },
  blocks: {
    title: 'Blocks & Ores',
    subtitle: 'Rare minerals, celestial stone, and interactive forge blocks.',
    icon: <Box className="w-6 h-6 text-emerald-400" />,
    color: 'from-emerald-950/50 via-[#111827] to-[#0b0f19]',
  },
  recipes: {
    title: 'Forge Recipes',
    subtitle: 'Custom 3x3 crafting grid formulas and altar fusion recipes.',
    icon: <ScrollText className="w-6 h-6 text-sky-400" />,
    color: 'from-sky-950/50 via-[#111827] to-[#0b0f19]',
  },
  biomes: {
    title: 'Biomes & Realms',
    subtitle: 'Floating islands, void chasms, and enchanted celestial forests.',
    icon: <Trees className="w-6 h-6 text-purple-400" />,
    color: 'from-purple-950/50 via-[#111827] to-[#0b0f19]',
  },
  guides: {
    title: 'Guides & Instructions',
    subtitle: 'Official manuals on how to install, craft, and survive in Aetheria.',
    icon: <BookOpen className="w-6 h-6 text-indigo-400" />,
    color: 'from-indigo-950/50 via-[#111827] to-[#0b0f19]',
  },
};

export const CategoryOverviewPage: React.FC<CategoryOverviewPageProps> = ({
  category,
  pages,
  onSelectPage,
  onSelectCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const currentMeta = CATEGORY_META[category] || CATEGORY_META.all;
  const filteredPages = pages.filter((page) => {
    const matchesCategory = category === 'all' || page.category === category;
    const matchesQuery =
      !searchQuery.trim() ||
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || page.tags?.includes(selectedTag);
    return matchesCategory && matchesQuery && matchesTag;
  });

  // Extract unique tags for filtering chips
  const categoryPages = pages.filter((p) => category === 'all' || p.category === category);
  const allTags = Array.from(new Set(categoryPages.flatMap((p) => p.tags || [])));

  const getRarityBadgeClass = (rarity?: string) => {
    switch (rarity) {
      case 'Legendary':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'Epic':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      case 'Rare':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'Uncommon':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
      default:
        return 'bg-[#222] text-[#aaa] border-[#333]';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Category Hero Banner */}
      <div
        className={`bg-gradient-to-r ${currentMeta.color} border border-[#2a2a2a] rounded-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#141414] border border-[#333] rounded-lg shadow">
                {currentMeta.icon}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                {currentMeta.title}
              </h1>
            </div>
            <p className="text-sm text-[#bbb] max-w-xl leading-relaxed">
              {currentMeta.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2 bg-[#141414]/90 border border-[#333] rounded-lg text-center shadow">
              <span className="block text-xl font-bold text-emerald-400 font-mono">
                {filteredPages.length}
              </span>
              <span className="text-[10px] text-[#888] font-mono uppercase">
                Articles Available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Filter in ${currentMeta.title}...`}
              className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-lg py-2 pl-9 pr-3 text-xs sm:text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Category Switchers */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs shrink-0">
            {(['all', 'items', 'mobs', 'blocks', 'recipes', 'biomes', 'guides'] as const).map((cat, idx) => (
              <button
                key={`${cat}-${idx}`}
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all whitespace-nowrap ${
                  category === cat
                    ? 'bg-sky-500 text-black font-bold shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                    : 'bg-[#0b0f19] text-[#94a3b8] hover:text-white border border-[#1e293b]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tag chips */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-xs">
            <span className="text-[10px] text-[#64748b] uppercase font-bold shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3 text-sky-400" /> Tags:
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                selectedTag === null
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                  : 'bg-[#0b0f19] text-[#64748b] border border-[#1e293b]'
              }`}
            >
              All
            </button>
            {allTags.map((tag, idx) => (
              <button
                key={`${tag}-${idx}`}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize transition-all ${
                  selectedTag === tag
                    ? 'bg-sky-500 text-black font-bold'
                    : 'bg-[#0b0f19] text-[#94a3b8] hover:text-white border border-[#1e293b]'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pages Cards Grid */}
      {filteredPages.length === 0 ? (
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-12 text-center text-[#64748b] space-y-2">
          <p className="text-base font-semibold text-[#94a3b8]">No items found for this filter.</p>
          <p className="text-xs">Try clearing your search query or tag selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPages.map((page) => (
            <div
              key={page.id}
              onClick={() => onSelectPage(page.id)}
              className="bg-[#111827] hover:bg-[#1a2333] border border-[#1e293b] hover:border-sky-500/50 rounded-2xl p-5 shadow-lg transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden h-full"
            >
              <div className="space-y-3">
                {/* Top Badge & Rarity */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 bg-[#0b0f19] text-sky-400 border border-sky-500/20 rounded">
                    {page.badge || page.category}
                  </span>

                  {page.itemStats?.rarity && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRarityBadgeClass(
                        page.itemStats.rarity
                      )}`}
                    >
                      {page.itemStats.rarity}
                    </span>
                  )}
                </div>

                {/* Main Visual Header */}
                <div className="flex items-start gap-3 pt-1">
                  <div className="w-14 h-14 bg-[#0b0f19] border border-[#1e293b] rounded-xl flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform shadow-inner overflow-hidden p-1.5">
                    {getPageCoverImage(page) ? (
                      <img 
                        src={getPageCoverImage(page)!} 
                        alt={page.title} 
                        className="w-full h-full object-contain" 
                      />
                    ) : (
                      <WikiIcon icon={page.icon} className="w-7 h-7 text-sky-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-white text-base group-hover:text-sky-400 transition-colors uppercase tracking-tight truncate">
                      {page.title}
                    </h3>
                    <p className="text-xs text-[#94a3b8] line-clamp-2 mt-1 leading-relaxed">
                      {page.description}
                    </p>
                  </div>
                </div>

                {/* Key Attributes Visual Bar */}
                {page.mobStats && (
                  <div className="p-2 bg-[#0b0f19] rounded-xl border border-[#1e293b] flex items-center justify-between text-xs">
                    <span className="text-[#94a3b8] flex items-center gap-1 font-mono">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Health
                    </span>
                    <span className="text-rose-400 font-bold font-mono">
                      {page.mobStats.health} HP
                    </span>
                  </div>
                )}

                {page.itemStats && (page.itemStats.attackDamage !== undefined || page.itemStats.durability !== undefined) && (
                  <div className="p-2 bg-[#0b0f19] rounded-xl border border-[#1e293b] flex items-center justify-between text-xs font-mono">
                    {page.itemStats.attackDamage !== undefined && (
                      <span className="text-amber-300 font-bold flex items-center gap-1">
                        <img src={getItemImage('sword')!} alt="Attack" className="w-4 h-4 object-contain inline-block" />
                        <span>{page.itemStats.attackDamage} Attack DMG</span>
                      </span>
                    )}
                    {page.itemStats.durability !== undefined && (
                      <span className="text-[#94a3b8] flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-sky-400 inline" />
                        <span>{page.itemStats.durability} Uses</span>
                      </span>
                    )}
                  </div>
                )}

                {page.blockStats && (
                  <div className="p-2 bg-[#0b0f19] rounded-xl border border-[#1e293b] flex items-center justify-between text-xs font-mono">
                    <span className="text-[#94a3b8] flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" /> Hardness
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {page.blockStats.hardness}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer Button */}
              <div className="pt-4 mt-3 border-t border-[#1e293b] flex items-center justify-between text-xs font-semibold text-sky-400 group-hover:text-sky-300">
                <span>View Full Page</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
