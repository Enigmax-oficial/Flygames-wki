import React, { useState } from 'react';
import { WikiPage, CategoryType } from '../types/wiki';
import { getPageCoverImage, getItemImage } from '../data/itemAssets';
import { WikiApi } from '../lib/wikiApi';
import { WikiIcon } from './WikiIcon';
import { 
  Sparkles, 
  ChevronRight, 
  Compass, 
  Flame,
  ArrowUpRight,
  Search,
  Shuffle,
  Filter,
  Heart
} from 'lucide-react';

interface PortalHomePageProps {
  pages: WikiPage[];
  onSelectPage: (pageId: string) => void;
  onSelectCategory: (category: CategoryType | 'all') => void;
  onOpenSearch: () => void;
  onOpenCreatePage?: () => void;
}

export const PortalHomePage: React.FC<PortalHomePageProps> = ({
  pages,
  onSelectPage,
  onSelectCategory,
  onOpenSearch,
  onOpenCreatePage,
}) => {
  const [tableSearch, setTableSearch] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CategoryType | 'all'>('all');

  const boulderingZombie = pages.find((p) => p.id === 'bouldering-zombie');
  const crystallineBerserker = pages.find((p) => p.id === 'crystalline-berserker');

  const categoriesList = WikiApi.getCategories();

  // Helper to render category icon gracefully via WikiIcon
  const renderCategoryIcon = (icon: string) => {
    return <WikiIcon icon={icon || 'folder'} className="w-6 h-6 text-sky-400" />;
  };

  // Random article generator function for the "Surprise Me" button
  const handleRandomArticle = () => {
    if (pages.length === 0) return;
    const randomIndex = Math.floor(Math.random() * pages.length);
    onSelectPage(pages[randomIndex].id);
  };

  // Filter pages for table
  const filteredTablePages = pages.filter((p) => {
    const matchesCategory = activeCategoryFilter === 'all' || p.category === activeCategoryFilter;
    const matchesQuery = 
      p.title.toLowerCase().includes(tableSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(tableSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(tableSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(tableSearch.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="max-w-6xl mx-auto text-[#e2e8f0] font-sans space-y-10 pb-16">
      {/* 1. Light Blue Hero Section */}
      <section className="relative rounded-3xl overflow-hidden border border-sky-500/30 bg-gradient-to-br from-sky-950/60 via-[#111827] to-[#0b0f19] p-6 sm:p-10 shadow-[0_0_50px_rgba(56,189,248,0.15)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Addon Wiki Portal v1.4.0</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Etherium Knowledge Base
          </h1>

          <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed max-w-2xl">
            Explore complete stats, behavioral tactics, drop rates, and crafting recipes for all mobs, items, bosses, and biomes in the Etherium Bedrock Addon.
          </p>

          {/* Action Buttons Row */}
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onSelectPage('bouldering-zombie')}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-xl text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)] flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Explore Bouldering Zombie</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onSelectPage('crystalline-berserker')}
              className="px-5 py-2.5 bg-[#1e293b]/90 hover:bg-[#1e293b] text-white border border-[#334155] font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer hover:border-purple-500/40"
            >
              <Flame className="w-4 h-4 text-purple-400" />
              <span>View Boss: Crystalline Berserker</span>
            </button>

            <button
              onClick={onOpenSearch}
              className="px-4 py-2.5 bg-[#0b0f19] hover:bg-[#1e293b] text-[#cbd5e1] border border-[#1e293b] hover:border-sky-500/40 font-semibold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4 text-sky-400" />
              <span>Search Database</span>
            </button>

            <button
              onClick={handleRandomArticle}
              className="px-4 py-2.5 bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 border border-sky-500/30 font-semibold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              title="Open a random wiki article"
            >
              <Shuffle className="w-4 h-4 text-sky-400" />
              <span>Surprise Me</span>
            </button>

            {onOpenCreatePage && (
              <button
                onClick={onOpenCreatePage}
                className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                title="Create page from script template"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>+ Create Page (Template)</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Featured Mobs Spotlight Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
            <Compass className="w-4 h-4 text-sky-400" />
            <span>FEATURED SHOWCASE MOBS</span>
          </h2>
          <span className="text-xs font-mono text-sky-400 font-semibold">Direct Spotlight</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Featured Mob 1: Bouldering Zombie */}
          {boulderingZombie && (
            <div 
              onClick={() => onSelectPage(boulderingZombie.id)}
              className="group bg-[#111827] border border-[#1e293b] hover:border-emerald-500/50 rounded-2xl p-5 shadow-xl transition-all cursor-pointer hover:translate-y-[-2px] flex flex-col sm:flex-row items-center gap-5 h-full"
            >
              {getPageCoverImage(boulderingZombie) ? (
                <div className="w-28 h-28 sm:w-32 sm:h-32 bg-[#0b0f19] rounded-xl border border-[#1e293b] flex items-center justify-center p-2 shrink-0 group-hover:scale-105 transition-transform overflow-hidden shadow-inner">
                  <img src={getPageCoverImage(boulderingZombie)!} alt={boulderingZombie.title} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 bg-[#0b0f19] rounded-xl border border-[#1e293b] flex items-center justify-center p-2 shrink-0 group-hover:scale-105 transition-transform">
                  <WikiIcon icon={boulderingZombie.icon || 'mobs'} className="w-12 h-12 text-emerald-400" />
                </div>
              )}
              <div className="space-y-2 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold uppercase font-mono">
                    CLIMBING MOB
                  </span>
                  <span className="px-2 py-0.5 bg-[#0b0f19] text-[#cbd5e1] border border-[#1e293b] rounded text-[10px] font-mono font-bold">
                    v1.4.0 ADDON
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {boulderingZombie.title}
                </h3>
                <p className="text-xs text-[#94a3b8] line-clamp-2">
                  {boulderingZombie.description}
                </p>
                <div className="pt-2 text-xs font-bold text-sky-400 flex items-center justify-center sm:justify-start gap-1">
                  <span>View Complete Mob Guide</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          )}

          {/* Featured Mob 2: Crystalline Berserker */}
          {crystallineBerserker && (
            <div 
              onClick={() => onSelectPage(crystallineBerserker.id)}
              className="group bg-[#111827] border border-[#1e293b] hover:border-purple-500/50 rounded-2xl p-5 shadow-xl transition-all cursor-pointer hover:translate-y-[-2px] flex flex-col sm:flex-row items-center gap-5 h-full"
            >
              {getPageCoverImage(crystallineBerserker) ? (
                <div className="w-28 h-28 sm:w-32 sm:h-32 bg-[#0b0f19] rounded-xl border border-[#1e293b] flex items-center justify-center p-2 shrink-0 group-hover:scale-105 transition-transform overflow-hidden shadow-inner">
                  <img src={getPageCoverImage(crystallineBerserker)!} alt={crystallineBerserker.title} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 bg-[#0b0f19] rounded-xl border border-[#1e293b] flex items-center justify-center p-2 shrink-0 group-hover:scale-105 transition-transform">
                  <WikiIcon icon={crystallineBerserker.icon || 'mobs'} className="w-12 h-12 text-purple-400" />
                </div>
              )}
              <div className="space-y-2 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 bg-purple-950/80 text-purple-300 border border-purple-500/30 rounded text-[10px] font-bold uppercase font-mono">
                    DUNGEON BOSS
                  </span>
                  <span className="px-2 py-0.5 bg-[#0b0f19] text-[#cbd5e1] border border-[#1e293b] rounded text-[10px] font-mono font-bold">
                    v1.4.0 ADDON
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                  {crystallineBerserker.title}
                </h3>
                <p className="text-xs text-[#94a3b8] line-clamp-2">
                  {crystallineBerserker.description}
                </p>
                <div className="pt-2 text-xs font-bold text-sky-400 flex items-center justify-center sm:justify-start gap-1">
                  <span>View Boss Phase Guide</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Category Explorer Grid */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">
          BROWSE BY CATEGORY
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriesList.map((cat) => {
            const count = pages.filter((p) => p.category === cat.id).length;
            return (
              <div
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  setActiveCategoryFilter(cat.id);
                }}
                className={`group bg-gradient-to-br ${cat.bg} border ${cat.color} hover:border-sky-400/60 rounded-2xl p-5 shadow-lg transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-[#0b0f19] border border-[#1e293b]">
                    {renderCategoryIcon(cat.icon)}
                  </div>
                  <span className="px-2.5 py-1 bg-[#0b0f19] border border-[#1e293b] text-sky-400 text-xs font-mono font-bold rounded-lg">
                    {count} {count === 1 ? 'Page' : 'Pages'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                    {cat.label}
                  </h3>
                  <p className="text-xs text-[#94a3b8] mt-1">
                    {cat.desc}
                  </p>
                </div>

                <div className="text-xs font-bold text-sky-400 flex items-center gap-1 pt-1">
                  <span>Filter Index ({cat.id})</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Complete Knowledge Index Table with Live Filter & Search */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-400" />
            <span>COMPLETE KNOWLEDGE INDEX ({filteredTablePages.length})</span>
          </h2>

          {/* Quick Table Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-2.5" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Filter index table..."
              className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-400 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder-[#64748b] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategoryFilter === 'all'
                ? 'bg-sky-500 text-black shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                : 'bg-[#111827] text-[#94a3b8] border border-[#1e293b] hover:text-white'
            }`}
          >
            All ({pages.length})
          </button>
          {categoriesList.map((cat) => {
            const count = pages.filter((p) => p.category === cat.id).length;
            const isActive = activeCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 font-bold'
                    : 'bg-[#111827] text-[#94a3b8] border border-[#1e293b] hover:text-white'
                }`}
              >
                <span>{cat.label.split(' ')[0]}</span>
                <span className="text-[10px] font-mono opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Index Table */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#1e293b] text-[#94a3b8] font-semibold bg-[#0b0f19]/80 text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-5">Name</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5">Key Attributes</th>
                  <th className="py-3.5 px-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {filteredTablePages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-[#64748b]">
                      No wiki articles match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredTablePages.map((page) => (
                    <tr 
                      key={page.id}
                      onClick={() => onSelectPage(page.id)}
                      className="hover:bg-[#1e293b]/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5 font-bold text-white flex items-center gap-3">
                        {(getPageCoverImage(page) || page.category !== 'biomes') && (
                          getPageCoverImage(page) ? (
                            <div className="w-8 h-8 rounded-lg bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center shrink-0 overflow-hidden p-1 shadow">
                              <img src={getPageCoverImage(page)!} alt={page.title} className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <WikiIcon icon={page.icon} category={page.category} className="w-8 h-8 text-lg" />
                          )
                        )}
                        <span className="group-hover:text-sky-300 transition-colors">{page.title}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-0.5 bg-[#0b0f19] border border-[#1e293b] rounded text-xs font-bold uppercase text-[#cbd5e1]">
                          {page.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-[#cbd5e1]">
                        {page.itemStats?.attackDamage !== undefined ? (
                          <span className="text-amber-300 font-bold flex items-center gap-1">
                            <img src={getItemImage('sword')!} alt="Attack" className="w-3.5 h-3.5 object-contain inline-block" />
                            <span>{page.itemStats.attackDamage} DMG</span>
                          </span>
                        ) : page.mobStats?.health ? (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline-block" />
                            <span>{page.mobStats.health} HP</span>
                          </span>
                        ) : (
                          <span className="text-[#94a3b8]">{page.badge || page.addonVersion || 'v1.4.0'}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPage(page.id);
                          }}
                          className="text-xs font-bold text-sky-400 group-hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Page</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
