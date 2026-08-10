import React, { useState } from 'react';
import { WikiPage } from '../types/wiki';
import { CraftingGrid } from './CraftingGrid';
import { WikiIcon } from './WikiIcon';
import { Infobox } from './Infobox';
import { WikiImageGallery, GalleryItem } from './WikiImageGallery';
import { getItemImage, getPageCoverImage } from '../data/itemAssets';
import { MINECRAFT_MODELS_REGISTRY } from '../models';
import { WikiComments } from './WikiComments';
import { 
  Share2, 
  Check, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Home,
  Clock,
  Heart,
  Sword,
  Zap,
  Shield,
  Tag
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

  // Enable rich layout for items, mobs, blocks, biomes, and guides
  const isRichPage = Boolean(
    page.behaviorBullets || 
    page.difficultyStats || 
    page.renderImageUrl || 
    page.imageUrl || 
    page.gallery || 
    page.itemStats || 
    page.blockStats ||
    page.recipes ||
    page.category === 'mobs' ||
    page.category === 'items'
  );

  const behaviorBullets = page.behaviorBullets || (
    page.category === 'mobs' || page.category === 'items' ? [
      page.description,
      `Namespace: ${page.namespace || 'aetheria:' + page.id}`,
      `Category: ${page.category.toUpperCase()}`,
      `Addon Version: ${page.addonVersion || 'v1.4.0'}`
    ] : []
  );

  const difficultyStats = page.difficultyStats || (
    page.category === 'mobs' ? [
      { difficulty: 'Easy', health: 'Baseline Specs', attack: 'Standard 1.0x', icon: '🟩', color: 'emerald' },
      { difficulty: 'Normal', health: 'Default Specs', attack: 'Standard 1.0x', icon: '🟧', color: 'amber' },
      { difficulty: 'Hard', health: 'High Usage Load', attack: '1.25x Threat', icon: '🟥', color: 'rose' },
      { difficulty: 'Brutal', health: 'Maximum Impact', attack: '2.0x Threat', icon: '😈', color: 'purple' }
    ] : []
  );

  const dropsTable = page.dropsTable || (
    page.category === 'mobs' || page.category === 'items' ? [
      { item: page.title, amount: '1', chance: '100% Obtainable', icon: page.icon || 'gem' }
    ] : []
  );

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
    const primaryImg = getPageCoverImage(page) || 
      page.renderImageUrl || 
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
      page.images.forEach((imgUrl) => {
        if (!gallery.some((it) => it.url === imgUrl)) {
          gallery.push({
            url: imgUrl,
            title: `${page.title} - Photo #${gallery.length + 1}`,
            caption: `Showcase screenshot/photo for ${page.title}`,
            is3D: false,
          });
        }
      });
    }

    return gallery;
  };

  const galleryItems = buildGalleryItems();

  if (isRichPage) {
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

          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{readingTime} min read</span>
          </span>
        </div>

        {/* 1. Header Title & Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              {getPageCoverImage(page) ? (
                <img src={getPageCoverImage(page)!} alt={page.title} className="w-10 h-10 object-contain drop-shadow-md" />
              ) : (
                <WikiIcon icon={page.icon} className="w-8 h-8 text-sky-400" />
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

        {/* Description Banner */}
        <p className="text-sm text-[#94a3b8] leading-relaxed bg-[#111827]/60 border border-[#1e293b] p-4 rounded-xl">
          {page.description}
        </p>

        {/* 2. Wikipedia-Style Image Gallery & Interactive 3D Model */}
        {galleryItems.length > 0 && (
          <WikiImageGallery items={galleryItems} pageTitle={page.title} />
        )}

        {/* ITEM ATTRIBUTES & PERFORMANCE GRID */}
        {page.itemStats && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>ITEM ATTRIBUTES & PERFORMANCE</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {page.itemStats.rarity && (
                <div className="bg-[#111827] border border-[#1e293b] p-3.5 rounded-2xl flex flex-col justify-between shadow-md">
                  <span className="text-[11px] font-semibold text-[#64748b] uppercase">Rarity Class</span>
                  <span className={`mt-1 font-mono font-bold text-sm ${
                    page.itemStats.rarity === 'Legendary' ? 'text-amber-400' :
                    page.itemStats.rarity === 'Epic' ? 'text-purple-400' :
                    page.itemStats.rarity === 'Rare' ? 'text-blue-400' : 'text-emerald-400'
                  }`}>
                    {page.itemStats.rarity}
                  </span>
                </div>
              )}

              {page.itemStats.attackDamage !== undefined && (
                <div className="bg-[#111827] border border-[#1e293b] p-3.5 rounded-2xl flex flex-col justify-between shadow-md">
                  <span className="text-[11px] font-semibold text-[#64748b] uppercase">Attack Damage</span>
                  <span className="mt-1 font-mono font-bold text-sm text-rose-400 flex items-center gap-1">
                    <span>{page.itemStats.attackDamage} HP ({page.itemStats.attackDamage / 2}</span>
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
                    <span>)</span>
                  </span>
                </div>
              )}

              {page.itemStats.durability !== undefined && (
                <div className="bg-[#111827] border border-[#1e293b] p-3.5 rounded-2xl flex flex-col justify-between shadow-md">
                  <span className="text-[11px] font-semibold text-[#64748b] uppercase">Max Durability</span>
                  <span className="mt-1 font-mono font-bold text-sm text-sky-400">
                    {page.itemStats.durability} Uses
                  </span>
                </div>
              )}

              {page.itemStats.stackSize !== undefined && (
                <div className="bg-[#111827] border border-[#1e293b] p-3.5 rounded-2xl flex flex-col justify-between shadow-md">
                  <span className="text-[11px] font-semibold text-[#64748b] uppercase">Max Stack</span>
                  <span className="mt-1 font-mono font-bold text-sm text-emerald-400">
                    {page.itemStats.stackSize} Items
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 3. KEY MECHANICS / ABILITIES / BEHAVIOR Section */}
        {behaviorBullets.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-400" />
              <span>KEY MECHANICS & ABILITIES</span>
            </h2>
            <div className="bg-[#111827]/90 border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-4">
              <ul className="space-y-2.5 text-sm sm:text-base text-[#cbd5e1] leading-relaxed">
                {behaviorBullets.map((bullet, idx) => (
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

        {/* CRAFTING RECIPE FORMULA */}
        {page.recipes && page.recipes.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>FORGE & CRAFTING FORMULA</span>
            </h2>
            <div className="bg-[#111827]/90 border border-[#1e293b] rounded-2xl p-5 shadow-xl space-y-4">
              {page.recipes.map((rec, i) => (
                <div key={i} className="space-y-2">
                  <h3 className="font-bold text-sky-400 text-xs font-mono uppercase tracking-wider">
                    Recipe #{i + 1} - {rec.output.name}
                  </h3>
                  <CraftingGrid recipe={rec} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* STATS BY DIFFICULTY Section */}
        {difficultyStats.length > 0 && (
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
                      <th className="py-3 px-5 font-semibold flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Health
                      </th>
                      <th className="py-3 px-5 font-semibold flex items-center gap-1.5">
                        <img src={getItemImage('sword')!} alt="Attack" className="w-4 h-4 object-contain inline-block" /> Attack
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {difficultyStats.map((stat, idx) => (
                      <tr key={idx} className="hover:bg-[#1e293b]/30 transition-colors">
                        <td className="py-3 px-5 font-semibold text-white flex items-center gap-2.5">
                          <WikiIcon icon={stat.icon || 'shield'} className="w-4 h-4 text-sky-400" />
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
          </section>
        )}

        {/* DROPS & OBTAIN TABLE */}
        {dropsTable.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-400" />
              <span>LOOT DROPS & ACQUISITION</span>
            </h2>
            <div className="bg-[#111827]/90 border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#1e293b] text-[#94a3b8] font-medium bg-[#0b0f19]/60">
                      <th className="py-3.5 px-5 font-semibold">Item</th>
                      <th className="py-3.5 px-5 font-semibold">Amount</th>
                      <th className="py-3.5 px-5 font-semibold">Chance / Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {dropsTable.map((drop, idx) => (
                      <tr key={idx} className="hover:bg-[#1e293b]/30 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer flex items-center gap-2.5">
                          {getItemImage(drop.item) || (drop.item === page.title && getPageCoverImage(page)) ? (
                            <img src={getItemImage(drop.item) || getPageCoverImage(page)!} alt={drop.item} className="w-5 h-5 object-contain" />
                          ) : (
                            <WikiIcon icon={drop.icon || 'gem'} className="w-5 h-5 text-sky-400" />
                          )}
                          <span>{drop.item}</span>
                        </td>
                        <td className="py-3.5 px-5 text-[#cbd5e1] font-mono">{drop.amount}</td>
                        <td className="py-3.5 px-5 text-[#cbd5e1]">{drop.chance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* SECTIONS & DETAILED OVERVIEW */}
        {page.sections && page.sections.length > 0 && (
          <div className="space-y-4">
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
          </div>
        )}

        {/* Comments and Q&A Section */}
        <div className="mt-8 border-t border-[#1e293b] pt-8">
          <WikiComments 
            pageId={page.id} 
            pageTitle={page.title} 
            currentUser={currentUser} 
            currentUserEmail={currentUserEmail} 
          />
        </div>

        {/* Bottom Identifier Chip */}
        <div className="pt-6 border-t border-[#1e293b] text-xs font-mono text-[#64748b]">
          Identifier Path: <span className="text-[#94a3b8] font-semibold">/{page.category}/{page.id}</span>
        </div>
      </article>
    );
  }

  // Fallback Standard Wiki Article Layout
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
                <WikiIcon icon={page.icon} className="w-8 h-8 text-sky-400" />
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
              className="px-3.5 py-2 bg-[#1e293b]/80 hover:bg-[#1e293b] text-[#cbd5e1] border border-[#334155] rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
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

      {/* Main Content */}
      <div className="space-y-6">
        {/* Main Section Column */}
        <div className="space-y-6">
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
                          <WikiIcon icon={drop.icon || 'gem'} className="w-4 h-4 text-sky-400" />
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

      </div>

      {/* Comments and Q&A Section */}
      <div className="mt-8 border-t border-[#1e293b] pt-8">
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
