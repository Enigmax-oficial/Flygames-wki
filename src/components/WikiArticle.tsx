import React, { useState } from 'react';
import { WikiPage } from '../types/wiki';
import { CraftingGrid } from './CraftingGrid';
import { WikiIcon } from './WikiIcon';
import { Infobox } from './Infobox';
import { WikiImageGallery, GalleryItem } from './WikiImageGallery';
import { getItemImage } from '../data/itemAssets';
import { MINECRAFT_MODELS_REGISTRY } from '../models';
import { WikiComments } from './WikiComments';
import { 
  Share2, 
  Check, 
  Sparkles, 
  BookOpen, 
  Layers, 
  ChevronLeft,
  Home,
  Clock
} from 'lucide-react';

interface WikiArticleProps {
  page: WikiPage;
  onSelectCategory: (category: any) => void;
  onGoHome?: () => void;
  currentUser?: string | null;
  currentUserEmail?: string | null;
}

export const WikiArticle: React.FC<WikiArticleProps> = ({ 
  page, 
  onSelectCategory, 
  onGoHome,
  currentUser = null,
  currentUserEmail = null
}) => {

  const [activeTab, setActiveTab] = useState<'article' | 'crafting' | 'drops'>('article');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isRichBossPage = Boolean(page.behaviorBullets || page.difficultyStats || page.renderImageUrl);

  // Calculate estimated reading time based on word count
  const calculateReadingTime = (): number => {
    const textParts: string[] = [page.title || '', page.description || ''];
    if (page.behaviorBullets) {
      textParts.push(...page.behaviorBullets);
    }
    if (page.sections) {
      page.sections.forEach(sec => {
        textParts.push(sec.title || '', sec.content || '');
      });
    }
    const fullText = textParts.join(' ');
    const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  };

  const readingTime = calculateReadingTime();

  // Check if page has a 3D model
  const pageModelKey = page.customProperties?.['3D Model Key'] || 
    (page.id === 'climber-zombie' ? 'climber_zombie' : 
     page.id === 'crystalline-berserker' ? 'crystalline_berserker' : 
     page.id === 'bouldering-zombie' ? 'bouldering_zombie' : null);

  const has3DModel = Boolean(pageModelKey && MINECRAFT_MODELS_REGISTRY[pageModelKey]);

  // Construct Wikipedia-style gallery items
  const buildGalleryItems = (): GalleryItem[] => {
    if (page.gallery && page.gallery.length > 0) {
      return page.gallery;
    }

    const gallery: GalleryItem[] = [];
    const primaryImg = page.renderImageUrl || 
      page.imageUrl || 
      getItemImage(page.id) || 
      (page.icon?.startsWith('data:') || page.icon?.startsWith('http') ? page.icon : null);

    if (primaryImg) {
      // 1st Image: 2D Render
      gallery.push({
        url: primaryImg,
        title: `${page.title} - Artwork Render`,
        caption: `Official ${page.category === 'mobs' ? 'mob entity' : 'item'} render for ${page.title}`,
        is3D: false,
      });

      // 2nd Image: 3D Model ONLY if mob/entity actually has a 3D model
      if (has3DModel) {
        gallery.push({
          url: primaryImg,
          title: `${page.title} - Interactive 3D Model`,
          caption: `Interactive 3D model viewport for ${page.title}. Click & drag to rotate in 3D!`,
          is3D: true,
          modelKey: pageModelKey || undefined,
        });
      }
    }

    // 3rd Image: In-Game Screenshot Banner
    if (page.bannerImageUrl) {
      gallery.push({
        url: page.bannerImageUrl,
        title: `${page.title} - In-Game Environment`,
        caption: `In-game screenshot of ${page.title} inside Minecraft world`,
        is3D: false,
      });
    }

    if (page.images && page.images.length > 0) {
      page.images.forEach((imgUrl, idx) => {
        if (!gallery.some((it) => it.url === imgUrl)) {
          gallery.push({
            url: imgUrl,
            title: `${page.title} - Image #${gallery.length + 1}`,
            caption: `Showcase image for ${page.title}`,
            is3D: false,
          });
        }
      });
    }

    return gallery;
  };

  const galleryItems = buildGalleryItems();

  if (isRichBossPage) {
    return (
      <article className="max-w-4xl mx-auto text-[#cbd5e1] pb-16 font-sans space-y-6">
        {/* Top Breadcrumb Path & Navigation Back Button */}
        <div className="flex items-center justify-between gap-3 text-xs font-mono border-b border-[#1e293b] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onGoHome ? onGoHome() : onSelectCategory('all')}
              className="inline-flex items-center gap-1.5 font-bold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-sky-400" />
              <span>Portal</span>
            </button>
            <span className="text-[#475569]">/</span>
            <span className="text-[#94a3b8] capitalize">{page.category}</span>
            <span className="text-[#475569]">/</span>
            <span className="text-white font-bold">{page.id}</span>
          </div>


        </div>

        {/* 1. Header Title & Badge (Appears FIRST / ABOVE mob image as requested) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              {getItemImage(page.id) && (
                <img src={getItemImage(page.id)!} alt={page.title} className="w-10 h-10 object-contain" />
              )}
              <span>{page.title}</span>
            </h1>
            {page.badge && (
              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md border shadow-sm ${
                page.badgeColor === 'emerald'
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                  : page.badgeColor === 'amber'
                  ? 'bg-amber-950/80 text-amber-400 border-amber-500/30'
                  : 'bg-purple-950/80 text-purple-300 border-purple-500/30'
              }`}>
                {page.badge}
              </span>
            )}
          </div>

          <button
            onClick={handleShare}
            className="px-3.5 py-1.5 bg-[#1e293b]/70 hover:bg-[#1e293b] text-[#cbd5e1] border border-[#334155] rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-sky-400" /> : <Share2 className="w-3.5 h-3.5 text-sky-400" />}
            <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
          </button>
        </div>

        {/* 2. Wikipedia-Style Image Gallery & Interactive 3D Model (Appears BELOW Title) */}
        {galleryItems.length > 0 && (
          <WikiImageGallery items={galleryItems} pageTitle={page.title} />
        )}

        {/* 3. BEHAVIOR Section */}
        {page.behaviorBullets && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">
              BEHAVIOR
            </h2>
            <div className="bg-[#111827]/90 border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-4">
              <ul className="space-y-2.5 text-sm sm:text-base text-[#cbd5e1] leading-relaxed">
                {page.behaviorBullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2.5 shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              {page.behaviorMeta && (
                <div className="pt-4 border-t border-[#1e293b] flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#94a3b8] font-medium">
                  {page.behaviorMeta.biomes && (
                    <div>
                      <span className="text-[#64748b]">Biomes: </span>
                      <span className="text-[#cbd5e1]">{page.behaviorMeta.biomes}</span>
                    </div>
                  )}
                  {page.behaviorMeta.groupSize && (
                    <div>
                      <span className="text-[#64748b]">Group size: </span>
                      <span className="text-[#cbd5e1]">{page.behaviorMeta.groupSize}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 5. STATS BY DIFFICULTY Section & Speed Panel Blocks */}
        {page.difficultyStats && (
          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">
              STATS BY DIFFICULTY
            </h2>
            <div className="bg-[#111827]/90 border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#1e293b] text-[#94a3b8] font-medium bg-[#0b0f19]/60">
                      <th className="py-3 px-5 font-semibold">Difficulty</th>
                      <th className="py-3 px-5 font-semibold">♥ Health</th>
                      <th className="py-3 px-5 font-semibold">⚔ Attack</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {page.difficultyStats.map((stat, idx) => (
                      <tr key={idx} className="hover:bg-[#1e293b]/30 transition-colors">
                        <td className="py-3 px-5 font-semibold text-white flex items-center gap-2.5">
                          <span className="text-base">{stat.icon}</span>
                          <span>{stat.difficulty}</span>
                        </td>
                        <td className="py-3 px-5 text-[#cbd5e1]">{stat.health}</td>
                        <td className="py-3 px-5 text-[#cbd5e1]">{stat.attack}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Speed Panel in Blocks */}
            <div className="pt-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2 flex items-center gap-1.5">
                <span>👟</span>
                <span>Speed Panel by Difficulty Mode</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {page.difficultyStats.map((stat, idx) => {
                  const speeds = ['0.22x', '0.28x', '0.34x', '0.42x'];
                  const speedVal = page.movementSpeed || speeds[idx % speeds.length];
                  return (
                    <div 
                      key={idx}
                      className="bg-[#111827] border border-[#1e293b] hover:border-sky-500/40 rounded-xl p-3 flex flex-col justify-between transition-all shadow-md group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{stat.icon}</span>
                          <span>{stat.difficulty}</span>
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          Mode
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-[#1e293b]/60 flex items-center justify-between">
                        <span className="text-[10px] text-[#64748b] uppercase font-semibold">Speed</span>
                        <span className="text-xs font-mono font-bold text-sky-300 group-hover:scale-105 transition-transform">
                          {speedVal}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 6. DROPS Section */}
        {page.dropsTable && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">
              DROPS
            </h2>
            <div className="bg-[#111827]/90 border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#1e293b] text-[#94a3b8] font-medium bg-[#0b0f19]/60">
                      <th className="py-3.5 px-5 font-semibold">Item</th>
                      <th className="py-3.5 px-5 font-semibold">Amount</th>
                      <th className="py-3.5 px-5 font-semibold">Chance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {page.dropsTable.map((drop, idx) => (
                      <tr key={idx} className="hover:bg-[#1e293b]/30 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer flex items-center gap-2.5">
                          {drop.icon && <span className="text-base">{drop.icon}</span>}
                          <span>{drop.item}</span>
                        </td>
                        <td className="py-3.5 px-5 text-[#cbd5e1]">{drop.amount}</td>
                        <td className="py-3.5 px-5 text-[#cbd5e1]">{drop.chance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Mob Speed Across Different Blocks Comparison Table (Loaded from JSON file) */}
        {page.blockSpeeds && page.blockSpeeds.length > 0 && (
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
                <span>🏃‍♂️</span>
                <span>Mob Speed Across Different Blocks (JSON Physics Data)</span>
              </h2>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                JSON Data Matrix
              </span>
            </div>

            <div className="bg-[#111827] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#1e293b] text-[#94a3b8] font-semibold bg-[#0b0f19]/80 text-xs uppercase tracking-wider">
                      <th className="py-3.5 px-5">Block Type</th>
                      <th className="py-3.5 px-5">{page.title}</th>
                      <th className="py-3.5 px-5">Standard Hostile Mob</th>
                      <th className="py-3.5 px-5">Friction / Multiplier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {page.blockSpeeds.map((bs, idx) => (
                      <tr key={idx} className="hover:bg-[#1e293b]/40 transition-colors">
                        <td className="py-3 px-5 font-bold text-white flex items-center gap-2">
                          <span>{bs.icon}</span>
                          <span>{bs.block}</span>
                        </td>
                        <td className="py-3 px-5 text-emerald-400 font-mono font-bold">{bs.speed}</td>
                        <td className="py-3 px-5 text-[#cbd5e1] font-mono">{bs.standard}</td>
                        <td className="py-3 px-5 text-sky-400 font-mono text-xs">{bs.friction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* 7. Bottom Identifier Chip */}
        <div className="pt-6 border-t border-[#1e293b] text-xs font-mono text-[#64748b]">
          Identifier Path: <span className="text-[#94a3b8] font-semibold">/{page.category}/{page.id}</span>
        </div>
      </article>
    );
  }

  // Fallback Standard Wiki Article Layout for items / recipes / guides
  return (
    <article className="max-w-5xl mx-auto space-y-6 text-[#e2e8f0] pb-12 font-sans">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-[#64748b] font-mono border-b border-[#1e293b] pb-3">
        <button
          onClick={() => onGoHome ? onGoHome() : onSelectCategory('all')}
          className="hover:text-sky-400 font-bold transition-colors flex items-center gap-1"
        >
          <Home className="w-3.5 h-3.5 text-sky-400" />
          <span>Portal</span>
        </button>
        <span>/</span>
        <button
          onClick={() => onSelectCategory(page.category)}
          className="hover:text-sky-400 capitalize transition-colors"
        >
          {page.category}
        </button>
        <span>/</span>
        <span className="text-sky-400 font-bold truncate">{page.id}</span>
      </nav>

      {/* Article Header & Main Card */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#1e293b] pb-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-[#0b0f19] border border-[#1e293b] rounded-2xl flex items-center justify-center text-4xl shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.2)] overflow-hidden p-2">
              {getItemImage(page.id) || (page.icon?.startsWith('data:') || page.icon?.startsWith('http') ? page.icon : null) ? (
                <img 
                  src={getItemImage(page.id) || page.icon} 
                  alt={page.title} 
                  className="w-full h-full object-contain" 
                />
              ) : (
                page.icon
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                  {page.title}
                </h1>
                <span className="px-2.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-xs font-mono capitalize font-bold">
                  {page.category}
                </span>
                <span className="px-2 py-0.5 bg-[#0b0f19] text-[#94a3b8] border border-[#1e293b] rounded text-xs font-mono">
                  {page.addonVersion}
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-mono font-bold">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{readingTime} min read</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#94a3b8] mt-2 max-w-2xl leading-relaxed">
                {page.description}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="px-3.5 py-2 bg-[#1e293b]/80 hover:bg-[#1e293b] text-[#cbd5e1] border border-[#334155] rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              {copiedLink ? <Check className="w-4 h-4 text-sky-400" /> : <Share2 className="w-4 h-4 text-sky-400" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Article'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1e293b] text-xs font-mono overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('article')}
            className={`py-2.5 px-4 rounded-t-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'article'
                ? 'bg-sky-500/10 text-sky-400 border-t-2 border-sky-400 border-x border-[#1e293b]'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Overview & Details</span>
          </button>

          {page.recipes && page.recipes.length > 0 && (
            <button
              onClick={() => setActiveTab('crafting')}
              className={`py-2.5 px-4 rounded-t-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'crafting'
                  ? 'bg-sky-500/10 text-sky-400 border-t-2 border-sky-400 border-x border-[#1e293b]'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Crafting Recipes ({page.recipes.length})</span>
            </button>
          )}

          {page.mobStats?.drops && (
            <button
              onClick={() => setActiveTab('drops')}
              className={`py-2.5 px-4 rounded-t-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'drops'
                  ? 'bg-sky-500/10 text-sky-400 border-t-2 border-sky-400 border-x border-[#1e293b]'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-rose-400" />
              <span>Loot & Drops</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content & Infobox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Section Column */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'article' && (
            <div className="space-y-6">
              {/* Media Gallery & 3D Showcase */}
              {galleryItems.length > 0 && (
                <WikiImageGallery items={galleryItems} pageTitle={page.title} />
              )}

              {/* Sections */}
              {page.sections.map((section, idx) => (
                <section
                  key={idx}
                  className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 shadow-md space-y-3"
                >
                  <h2 className="text-xl font-bold text-white border-b border-[#1e293b] pb-2 flex items-center gap-2 uppercase tracking-tight">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"></span>
                    {section.title}
                  </h2>
                  <div className="text-[#cbd5e1] text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-2">
                    {section.content}
                  </div>
                </section>
              ))}

              {/* Inlined Crafting Preview if available */}
              {page.recipes && page.recipes.length > 0 && (
                <section className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 shadow-md space-y-3">
                  <h3 className="text-xs uppercase font-bold text-sky-400 tracking-wider flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Crafting Formula
                  </h3>
                  <CraftingGrid recipe={page.recipes[0]} />
                </section>
              )}
            </div>
          )}

          {activeTab === 'crafting' && page.recipes && (
            <div className="space-y-4">
              {page.recipes.map((rec, i) => (
                <div key={i} className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 space-y-3">
                  <h3 className="font-bold text-sky-400 text-sm font-mono">
                    Recipe #{i + 1} - {rec.output.name}
                  </h3>
                  <CraftingGrid recipe={rec} />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'drops' && page.mobStats?.drops && (
            <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-rose-400 text-xs uppercase font-mono tracking-wider">
                Entity Drops & Loot Table
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm font-mono border-collapse">
                  <thead>
                    <tr className="bg-[#0b0f19] text-sky-400 border-b border-[#1e293b]">
                      <th className="p-3">Item / Resource</th>
                      <th className="p-3">Drop Chance</th>
                      <th className="p-3">Looting Bonus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {page.mobStats.drops.map((drop, idx) => (
                      <tr key={idx} className="hover:bg-[#1e293b]/50">
                        <td className="p-3 font-semibold text-white flex items-center gap-2">
                          <span>{drop.icon || '💎'}</span>
                          <span>{drop.item}</span>
                        </td>
                        <td className="p-3 text-sky-400 font-bold">{drop.chance}</td>
                        <td className="p-3 text-[#64748b]">{drop.lootingBonus || 'Standard'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Infobox Right Column */}
        <div className="space-y-4">
          <Infobox page={page} />        </div>
      </div>

      {/* Comments and Q&A Section */}
      <div className="mt-8">
        <WikiComments 
          pageId={page.id} 
          pageTitle={page.title} 
          currentUser={currentUser} 
          currentUserEmail={currentUserEmail} 
        />
      </div>
    </article>
  );
};


