import React, { useState } from 'react';
import { WikiPage } from '../types/wiki';
import { 
  Clock, 
  Share2, 
  Check, 
  Sparkles, 
  Zap, 
  Layers, 
  Tag, 
  Home, 
  ExternalLink,
  Shield,
  Crosshair,
  Award,
  List,
  ChevronDown,
  ChevronUp,
  Info,
  Sword,
  Heart,
  ShieldAlert,
  Wand2,
  Box,
  Eye
} from 'lucide-react';
import { WikiImageGallery, GalleryItem } from './WikiImageGallery';
import { WikiComments } from './WikiComments';
import { WikiIcon } from './WikiIcon';
import { WikiApi } from '../lib/wikiApi';
import { generateBreadcrumbSchema, generateArticleSchema } from '../lib/seoSchema';

interface WikiArticleProps {
  page: WikiPage;
  pages?: WikiPage[];
  onSelectCategory: (category: string) => void;
  onSelectPage: (id: string) => void;
  onGoHome?: () => void;
  currentUser?: string | null;
  currentUserEmail?: string | null;
}

interface TocItem {
  id: string;
  title: string;
  level: number;
  numberStr: string;
}

export const WikiArticle: React.FC<WikiArticleProps> = ({
  page,
  onSelectCategory,
  onSelectPage,
  onGoHome,
  currentUser,
  currentUserEmail,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'crafting' | 'drops'>('overview');
  const [isTocCollapsed, setIsTocCollapsed] = useState(false);
  const [isFavorited, setIsFavorited] = useState<boolean>(() => WikiApi.isFavorite(page.id));
  const [favNotification, setFavNotification] = useState<string | null>(null);
  const [commentsEnabled, setCommentsEnabled] = useState<boolean>(false);

  React.useEffect(() => {
    // Fetch global settings
    fetch('/api/settings')
      .then(res => res.json())
      .then((data: any) => {
        if (data.success && data.settings) {
          setCommentsEnabled(data.settings.comments_enabled === 'true');
        }
      })
      .catch(err => console.error('Failed to fetch settings:', err));
  }, []);

  React.useEffect(() => {
    setIsFavorited(WikiApi.isFavorite(page.id));
    if (page && page.id) {
      WikiApi.recordPageView(page.id);
    }
  }, [page.id]);

  React.useEffect(() => {
    const handleFavUpdate = () => {
      setIsFavorited(WikiApi.isFavorite(page.id));
    };
    window.addEventListener('wiki_favorites_updated', handleFavUpdate);
    return () => window.removeEventListener('wiki_favorites_updated', handleFavUpdate);
  }, [page.id]);

  const handleToggleFavorite = async () => {
    if (!WikiApi.isUserLoggedIn()) {
      setFavNotification('🔒 Login Required: Please log in to add articles to your favorites!');
      setTimeout(() => setFavNotification(null), 3000);
      return;
    }

    const nextState = !isFavorited;
    setIsFavorited(nextState);
    if (nextState) {
      setFavNotification('Saved to Favorites!');
      await WikiApi.addFavorite(page.id);
    } else {
      setFavNotification('Removed from Favorites');
      await WikiApi.removeFavorite(page.id);
    }
    setTimeout(() => setFavNotification(null), 2500);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getItemImage = (id: string): string | null => {
    const imagesMap: Record<string, string> = {
      'etherium_shadow_blade': 'https://raw.githubusercontent.com/aetheria-addon/assets/main/items/shadow_blade.png',
      'celestial_drake': 'https://raw.githubusercontent.com/aetheria-addon/assets/main/mobs/celestial_drake.png',
      'crystalline_berserker': 'https://raw.githubusercontent.com/aetheria-addon/assets/main/mobs/berserker.png',
      'aether_crystal_ore': 'https://raw.githubusercontent.com/aetheria-addon/assets/main/blocks/crystal_ore.png',
      'astral_forge': 'https://raw.githubusercontent.com/aetheria-addon/assets/main/blocks/astral_forge.png',
    };
    return imagesMap[id] || null;
  };

  const getPageCoverImage = (p: WikiPage): string | null => {
    if (p.renderImageUrl) return p.renderImageUrl;
    return getItemImage(p.id);
  };

  const isRichPage = [
    'etherium_shadow_blade',
    'celestial_drake',
    'crystalline_berserker',
    'aether_crystal_ore',
    'astral_forge',
  ].includes(page.id) || !!page.recipes || !!page.mobStats || !!page.itemStats;

  const readingTime = Math.max(1, Math.ceil((page.description.length + (page.sections?.reduce((acc, s) => acc + s.content.length, 0) || 0)) / 450));

  // Build Gallery Items
  const coverImg = getPageCoverImage(page);
  const galleryItems: GalleryItem[] = [];

  if (coverImg) {
    galleryItems.push({
      url: coverImg,
      title: `${page.title} Render`,
      caption: `Official Minecraft Bedrock render texture for ${page.title}.`,
      is3D: false,
    });
  }

  // Check 3D Model Key
  const modelKey = page.customProperties?.['3D Model Key'] || (
    page.id === 'celestial_drake' ? 'dragon' :
    page.id === 'crystalline_berserker' ? 'golem' :
    page.id === 'etherium_shadow_blade' ? 'sword' :
    page.id === 'aether_crystal_ore' ? 'cube' :
    page.id === 'astral_forge' ? 'anvil' : undefined
  );

  if (modelKey) {
    galleryItems.push({
      url: coverImg || 'https://raw.githubusercontent.com/aetheria-addon/assets/main/items/shadow_blade.png',
      title: `3D Bedrock Interactive Render`,
      caption: `Interactive 3D model with real-time lighting and rotation.`,
      is3D: true,
      modelKey,
    });
  }

  // Recommendations
  const suggestions = WikiApi.getPages()
    .filter((p) => p.id !== page.id)
    .filter((p) => p.category === page.category || (page.badge && p.badge === page.badge))
    .slice(0, 4);

  // Helper to extract subheadings from markdown content
  const renderFormattedContent = (content: string, sectionIdx: number) => {
    const lines = content.split('\n');
    return lines.map((line, lIdx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#### ')) {
        const text = trimmed.replace(/^####\s+/, '');
        const id = `toc-sec-${sectionIdx}-sub-${lIdx}`;
        return (
          <h4 key={lIdx} id={id} className="text-sm font-bold text-sky-300 mt-3 mb-1 font-mono uppercase tracking-wide scroll-mt-24">
            {text}
          </h4>
        );
      }
      if (trimmed.startsWith('### ')) {
        const text = trimmed.replace(/^###\s+/, '');
        const id = `toc-sec-${sectionIdx}-sub-${lIdx}`;
        return (
          <h3 key={lIdx} id={id} className="text-base font-bold text-sky-400 mt-4 mb-1 border-b border-[#1e293b] pb-1 scroll-mt-24">
            {text}
          </h3>
        );
      }
      if (trimmed.startsWith('## ')) {
        const text = trimmed.replace(/^##\s+/, '');
        const id = `toc-sec-${sectionIdx}-sub-${lIdx}`;
        return (
          <h2 key={lIdx} id={id} className="text-lg font-bold text-white mt-5 mb-2 border-b border-sky-500/30 pb-1 flex items-center gap-2 scroll-mt-24">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>{text}</span>
          </h2>
        );
      }
      return <p key={lIdx} className="my-1 leading-relaxed text-[#cbd5e1]">{trimmed}</p>;
    });
  };

  // Generate Table of Contents
  const generateTocItems = (): TocItem[] => {
    const items: TocItem[] = [];
    let mainCounter = 1;

    // 1. Gallery
    if (galleryItems.length > 0) {
      items.push({
        id: 'toc-gallery',
        title: 'Showcase & Media Gallery',
        level: 1,
        numberStr: `${mainCounter++}.`
      });
    }

    // 2. Attributes
    if (page.itemStats) {
      items.push({
        id: 'toc-attributes',
        title: 'Item Attributes & Performance',
        level: 1,
        numberStr: `${mainCounter++}.`
      });
    }

    // 3. Mechanics / Behavior
    if (page.mobStats?.behavior || page.customProperties?.['Special Attack'] || page.customProperties?.['Effect']) {
      items.push({
        id: 'toc-mechanics',
        title: 'Key Mechanics & Abilities',
        level: 1,
        numberStr: `${mainCounter++}.`
      });
    }

    // 4. Crafting
    if (page.recipes && page.recipes.length > 0) {
      items.push({
        id: 'toc-crafting',
        title: 'Forge & Crafting Formula',
        level: 1,
        numberStr: `${mainCounter++}.`
      });
    }

    // 5. Difficulty Stats
    if (page.mobStats) {
      items.push({
        id: 'toc-difficulty',
        title: 'Stats by Difficulty',
        level: 1,
        numberStr: `${mainCounter++}.`
      });
    }

    // 6. Drops
    if (page.mobStats?.drops && page.mobStats.drops.length > 0) {
      items.push({
        id: 'toc-drops',
        title: 'Loot Drops & Acquisition',
        level: 1,
        numberStr: `${mainCounter++}.`
      });
    }

    // 7. Sections
    if (page.sections) {
      page.sections.forEach((sec, sIdx) => {
        const secNumStr = `${mainCounter}.`;
        items.push({
          id: `toc-section-${sIdx}`,
          title: sec.title,
          level: 1,
          numberStr: secNumStr
        });

        // Subheadings inside section
        let subCounter = 1;
        const lines = sec.content.split('\n');
        lines.forEach((line, lIdx) => {
          const trimmed = line.trim();
          let subTitle = '';
          if (trimmed.startsWith('## ')) subTitle = trimmed.replace(/^##\s+/, '');
          else if (trimmed.startsWith('### ')) subTitle = trimmed.replace(/^###\s+/, '');
          else if (trimmed.startsWith('#### ')) subTitle = trimmed.replace(/^####\s+/, '');

          if (subTitle) {
            items.push({
              id: `toc-sec-${sIdx}-sub-${lIdx}`,
              title: subTitle,
              level: 2,
              numberStr: `${mainCounter}.${subCounter++}`
            });
          }
        });

        mainCounter++;
      });
    }

    // 8. Additional Info
    if (page.customProperties && Object.keys(page.customProperties).filter(k => k !== '3D Model Key').length > 0) {
      items.push({
        id: 'toc-additional-info',
        title: 'Additional Information',
        level: 1,
        numberStr: `${mainCounter++}.`
      });
    }

    // 9. Recommendations
    if (suggestions.length > 0) {
      items.push({
        id: 'toc-recommendations',
        title: 'Recommended Reading',
        level: 1,
        numberStr: `${mainCounter++}.`
      });
    }

    // 10. Comments
    if (commentsEnabled) {
      items.push({
        id: 'toc-comments',
        title: 'Community Comments',
        level: 1,
        numberStr: `${mainCounter++}.`
      });
    }

    return items;
  };

  const tocItems = generateTocItems();

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Clean badge string by removing any "TEMPLATE" suffix
  const cleanBadge = page.badge ? page.badge.replace(/\s*TEMPLATE/gi, '').trim() : null;

  // Render clean layout for all pages
  return (
    <article className="max-w-4xl mx-auto text-[#cbd5e1] pb-16 font-sans space-y-6">
      {/* Google Search Structured Data (JSON-LD Breadcrumb Tree & Article Schema) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            generateBreadcrumbSchema(page, page.category),
            generateArticleSchema(page),
          ]),
        }}
      />

      {/* Top Breadcrumb Path & Navigation Back Button (Semantic microdata for crawlers) */}
      <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-3 text-xs font-mono border-b border-[#1e293b] pb-3">
        <ol className="flex items-center gap-2 list-none p-0 m-0">
          <li className="inline-flex items-center gap-1.5">
            <button
              onClick={() => onGoHome ? onGoHome() : onSelectCategory('all')}
              className="inline-flex items-center gap-1.5 font-bold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-sky-400" />
              <span>Portal</span>
            </button>
          </li>
          <li className="text-[#475569]">/</li>
          <li className="inline-flex items-center">
            <button
              onClick={() => onSelectCategory(page.category)}
              className="text-[#94a3b8] hover:text-sky-300 capitalize cursor-pointer transition-colors"
            >
              {page.category}
            </button>
          </li>
          <li className="text-[#475569]">/</li>
          <li className="text-white font-bold truncate max-w-[200px] sm:max-w-none" aria-current="page">
            {page.title || page.id}
          </li>
        </ol>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-xs font-mono font-bold" title="Page views saved in database">
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>{(page.views || 0) + 1} views</span>
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{readingTime} min read</span>
          </span>
        </div>
      </nav>

      {/* Header Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
            {page.title}
          </h1>
          <span className="px-2.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-xs font-mono capitalize font-bold">
            {page.category}
          </span>
          {cleanBadge && (
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md border shadow-sm ${
              page.badgeColor === 'emerald'
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                : page.badgeColor === 'amber'
                ? 'bg-amber-950/80 text-amber-400 border-amber-500/30'
                : 'bg-purple-950/80 text-purple-300 border-purple-500/30'
            }`}>
              {cleanBadge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(!!currentUserEmail || WikiApi.isUserLoggedIn()) && (
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer border ${
                isFavorited
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-[#1e293b]/70 hover:bg-[#1e293b] text-[#cbd5e1] border-[#334155]'
              }`}
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-400 text-amber-400' : 'text-amber-400'}`} />
              <span>{isFavorited ? 'Favorited' : 'Add to Favorites'}</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="px-3.5 py-1.5 bg-[#1e293b]/70 hover:bg-[#1e293b] text-[#cbd5e1] border border-[#334155] rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-sky-400" /> : <Share2 className="w-3.5 h-3.5 text-sky-400" />}
            <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {favNotification && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{favNotification}</span>
        </div>
      )}

      {/* Description Banner */}
      {page.description && (
        <p className="text-sm text-[#94a3b8] leading-relaxed bg-[#111827]/60 border border-[#1e293b] p-4 rounded-xl">
          {page.description}
        </p>
      )}

      {/* Image Gallery & 3D Showcase */}
      {galleryItems.length > 0 && (
        <div id="toc-gallery" className="scroll-mt-24">
          <WikiImageGallery items={galleryItems} pageTitle={page.title} />
        </div>
      )}

      {/* Table of Contents (Placed BELOW Image Gallery) */}
      {tocItems.length >= 2 && (
        <nav className="bg-[#111827]/90 border border-[#1e293b] rounded-2xl p-4 sm:p-5 shadow-xl my-4">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 mb-3">
            <div className="flex items-center gap-2 text-sky-400 font-extrabold text-xs sm:text-sm uppercase tracking-wider">
              <List className="w-4 h-4 text-sky-400" />
              <span>Table of Contents</span>
              <span className="text-[10px] text-[#64748b] font-mono font-normal">({tocItems.length} topics)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsTocCollapsed(!isTocCollapsed)}
              className="text-xs font-mono font-semibold text-[#94a3b8] hover:text-sky-400 transition-colors flex items-center gap-1 bg-[#1e293b]/60 hover:bg-[#1e293b] px-2.5 py-1 rounded-lg border border-[#334155]/50 cursor-pointer"
            >
              <span>{isTocCollapsed ? '[ Show ]' : '[ Hide ]'}</span>
              {isTocCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!isTocCollapsed && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs font-mono pt-1">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleScrollTo(item.id)}
                  className={`text-left text-[#cbd5e1] hover:text-sky-400 transition-colors flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-sky-500/10 cursor-pointer ${
                    item.level === 2 ? 'ml-5 text-[11px] text-[#94a3b8]' : 'font-semibold'
                  }`}
                >
                  <span className="text-sky-400/80 text-[10px] font-bold w-6 shrink-0">
                    {item.numberStr}
                  </span>
                  <span className="truncate">{item.title}</span>
                </button>
              ))}
            </div>
          )}
        </nav>
      )}

      {/* ITEM ATTRIBUTES & PERFORMANCE GRID */}
      {page.itemStats && (
        <section id="toc-attributes" className="space-y-3 scroll-mt-24">
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

            {page.itemStats.damage && (
              <div className="bg-[#111827] border border-[#1e293b] p-3.5 rounded-2xl flex flex-col justify-between shadow-md">
                <span className="text-[11px] font-semibold text-[#64748b] uppercase">Base Attack</span>
                <span className="mt-1 font-mono font-bold text-sm text-rose-400 flex items-center gap-1">
                  <Sword className="w-3.5 h-3.5" />
                  {page.itemStats.damage}
                </span>
              </div>
            )}

            {page.itemStats.durability && (
              <div className="bg-[#111827] border border-[#1e293b] p-3.5 rounded-2xl flex flex-col justify-between shadow-md">
                <span className="text-[11px] font-semibold text-[#64748b] uppercase">Durability</span>
                <span className="mt-1 font-mono font-bold text-sm text-sky-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  {page.itemStats.durability}
                </span>
              </div>
            )}

            {page.itemStats.enchantability && (
              <div className="bg-[#111827] border border-[#1e293b] p-3.5 rounded-2xl flex flex-col justify-between shadow-md">
                <span className="text-[11px] font-semibold text-[#64748b] uppercase">Enchanting Rating</span>
                <span className="mt-1 font-mono font-bold text-sm text-purple-400 flex items-center gap-1">
                  <Wand2 className="w-3.5 h-3.5" />
                  {page.itemStats.enchantability}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* KEY MECHANICS & ABILITIES */}
      {(page.mobStats?.behavior || page.customProperties?.['Special Attack'] || page.customProperties?.['Effect']) && (
        <section id="toc-mechanics" className="space-y-3 scroll-mt-24">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
            <Zap className="w-4 h-4 text-sky-400" />
            <span>KEY MECHANICS & ABILITIES</span>
          </h2>
          <div className="bg-[#111827] border border-[#1e293b] p-5 rounded-2xl space-y-3 shadow-md">
            {page.mobStats?.behavior && (
              <p className="text-xs text-[#cbd5e1] leading-relaxed border-b border-[#1e293b] pb-3">
                {page.mobStats.behavior}
              </p>
            )}

            {page.customProperties?.['Special Attack'] && (
              <div className="flex items-start gap-3 border-b border-[#1e293b] pb-3">
                <Crosshair className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-mono">Special Attack</h3>
                  <p className="text-xs text-[#cbd5e1] mt-0.5 leading-relaxed">{page.customProperties['Special Attack']}</p>
                </div>
              </div>
            )}

            {page.customProperties?.['Effect'] && (
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-mono">Passive & Active Effects</h3>
                  <p className="text-xs text-[#cbd5e1] mt-0.5 leading-relaxed">{page.customProperties['Effect']}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CRAFTING RECIPE FORMULA */}
      {page.recipes && page.recipes.length > 0 && (
        <section id="toc-crafting" className="space-y-3 scroll-mt-24">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>FORGE & CRAFTING FORMULA</span>
          </h2>
          <div className="space-y-3">
            {page.recipes.map((rec, rIdx) => (
              <div key={rIdx} className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 shadow-md">
                <h3 className="font-bold text-sky-400 text-sm font-mono mb-2 flex items-center gap-2">
                  <Box className="w-4 h-4 text-sky-400" />
                  <span>{rec.type || 'Crafting Table Recipe'}</span>
                </h3>
                <div className="text-xs font-mono text-[#cbd5e1] space-y-1 bg-[#0b0f19] p-3 rounded-xl border border-[#1e293b]">
                  {Array.isArray(rec.grid) &&
                    Array.from({ length: Math.ceil(rec.grid.length / 3) }, (_, rIdx) =>
                      rec.grid!.slice(rIdx * 3, rIdx * 3 + 3)
                    ).map((row: (string | null)[], rowIdx: number) => (
                      <div key={rowIdx} className="flex gap-2">
                        {row.map((cell: string | null, cIdx: number) => (
                          <span key={cIdx} className="px-2 py-1 bg-[#111827] border border-[#1e293b] rounded font-bold text-center min-w-[32px]">
                            {cell || 'Empty'}
                          </span>
                        ))}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* STATS BY DIFFICULTY */}
      {page.mobStats && (
        <section id="toc-difficulty" className="space-y-2 scroll-mt-24">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">
            STATS BY DIFFICULTY
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-2xl space-y-1 shadow-md">
              <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold">Easy Mode</span>
              <p className="text-xs text-[#cbd5e1] font-mono">Health: {Math.round(page.mobStats.health * 0.8)} HP</p>
              <p className="text-xs text-[#cbd5e1] font-mono">Attack: {page.mobStats.attackDamage || 'Normal'}</p>
            </div>

            <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-2xl space-y-1 shadow-md">
              <span className="text-[11px] font-mono uppercase text-sky-400 font-bold">Normal Mode</span>
              <p className="text-xs text-[#cbd5e1] font-mono">Health: {page.mobStats.health} HP</p>
              <p className="text-xs text-[#cbd5e1] font-mono">Attack: {page.mobStats.attackDamage || 'Normal'}</p>
            </div>

            <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-2xl space-y-1 shadow-md">
              <span className="text-[11px] font-mono uppercase text-rose-400 font-bold">Hard Mode</span>
              <p className="text-xs text-[#cbd5e1] font-mono">Health: {Math.round(page.mobStats.health * 1.3)} HP</p>
              <p className="text-xs text-[#cbd5e1] font-mono">Attack: Boosted +30%</p>
            </div>
          </div>
        </section>
      )}

      {/* DROPS & OBTAIN TABLE */}
      {page.mobStats?.drops && page.mobStats.drops.length > 0 && (
        <section id="toc-drops" className="space-y-3 scroll-mt-24">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-400" />
            <span>LOOT DROPS & ACQUISITION</span>
          </h2>
          <div className="bg-[#111827] border border-[#1e293b] rounded-2xl overflow-hidden shadow-md">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0b0f19] border-b border-[#1e293b] text-[#94a3b8]">
                <tr>
                  <th className="p-3">Item Drop</th>
                  <th className="p-3">Drop Rate</th>
                  <th className="p-3">Looting Bonus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {page.mobStats.drops.map((drop, idx) => (
                  <tr key={idx} className="hover:bg-[#1e293b]/50 transition-colors">
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{drop.item}</span>
                    </td>
                    <td className="p-3 text-sky-400">{drop.chance}</td>
                    <td className="p-3 text-[#94a3b8]">{drop.lootingBonus || 'None'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Content Sections */}
      {page.sections && page.sections.length > 0 && (
        <div className="space-y-6">
          {page.sections.map((section, idx) => (
            <section
              key={idx}
              id={`toc-section-${idx}`}
              className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 shadow-md space-y-3 scroll-mt-24"
            >
              <h2 className="text-xl font-bold text-white border-b border-[#1e293b] pb-2 flex items-center gap-2 uppercase tracking-tight">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"></span>
                <span>{section.title}</span>
              </h2>
              <div className="text-[#cbd5e1] text-sm sm:text-base leading-relaxed space-y-2">
                {renderFormattedContent(section.content, idx)}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* CUSTOM PROPERTIES / ADDITIONAL FUNCTIONS */}
      {page.customProperties && Object.keys(page.customProperties).filter(k => k !== '3D Model Key').length > 0 && (
        <section id="toc-additional-info" className="space-y-3 scroll-mt-24">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            <span>ADDITIONAL INFORMATION</span>
          </h2>
          <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-md text-xs font-mono">
            {Object.entries(page.customProperties)
              .filter(([key]) => key !== '3D Model Key')
              .map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <span className="text-[#64748b] uppercase font-bold">{key}</span>
                  <p className="text-white font-medium">{String(value)}</p>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Recommended Reads & Suggestions */}
      {suggestions.length > 0 && (
        <div id="toc-recommendations" className="mt-12 border-t border-[#1e293b] pt-8 space-y-4 scroll-mt-24">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>RECOMMENDED WIKI ARTICLES</span>
            </h3>
            <span className="text-[11px] font-mono text-[#64748b]">Related to {page.category}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectPage(s.id)}
                className="p-4 bg-[#111827] hover:bg-[#1e293b] border border-[#1e293b] hover:border-sky-500/30 rounded-2xl text-left transition-all group flex items-start gap-3 cursor-pointer shadow-sm"
              >
                <WikiIcon icon={s.icon} category={s.category} className="w-6 h-6 text-sky-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm group-hover:text-sky-400 transition-colors truncate">
                    {s.title}
                  </h4>
                  <p className="text-xs text-[#94a3b8] line-clamp-1 mt-0.5">
                    {s.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comments and Q&A Section */}
      {commentsEnabled && (
        <div id="toc-comments" className="mt-8 border-t border-[#1e293b] pt-8 scroll-mt-24">
          <WikiComments 
            pageId={page.id} 
            pageTitle={page.title} 
            currentUser={currentUser || null}
            currentUserEmail={currentUserEmail || null}
          />
        </div>
      )}

      {/* Bottom Identifier Chip */}
      <div className="pt-6 border-t border-[#1e293b] text-xs font-mono text-[#64748b]">
        Identifier Path: <span className="text-[#94a3b8] font-semibold">/{page.category}/{page.id}</span>
      </div>
    </article>
  );
};
