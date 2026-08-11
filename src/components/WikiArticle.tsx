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
  Tag,
  List,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface WikiArticleProps {
  page: WikiPage;
  pages: WikiPage[];
  onSelectPage: (pageId: string) => void;
  onSelectCategory: (category: any) => void;
  onGoHome?: () => void;
  currentUser?: string | null;
  currentUserEmail?: string | null;
}

export const WikiArticle: React.FC<WikiArticleProps> = ({ 
  page, 
  pages,
  onSelectPage,
  onSelectCategory,
  onGoHome,
  currentUser = null,
  currentUserEmail = null
}) => {

  const [activeTab, setActiveTab] = useState<'article' | 'crafting' | 'drops'>('article');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isTocCollapsed, setIsTocCollapsed] = useState(false);

  // Smooth scroll to element by ID with sticky offset
  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Find up to 3 similar/suggested articles
  const getSuggestedArticles = (): WikiPage[] => {
    if (!pages || pages.length === 0) return [];
    // 1. Filter out the current page
    const pool = pages.filter((p) => p.id !== page.id);
    
    // 2. Score remaining pages based on similarity: same category gets +10 points, each shared tag gets +3 points
    const scored = pool.map((p) => {
      let score = 0;
      if (p.category === page.category) score += 10;
      
      const sharedTags = (p.tags || []).filter((t) => (page.tags || []).includes(t));
      score += sharedTags.length * 3;
      
      return { p, score };
    });
    
    // 3. Sort by score descending and take the top 3
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.p);
  };

  const suggestions = getSuggestedArticles();

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
  const pageModelKey = page.customProperties?.['3D Model Key'] || (page as any).modelKey || (page as any)['3dModelKey'] || null;

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

  // Helper to extract markdown headings from section content
  const parseContentHeadings = (content: string) => {
    const headings: { title: string; subIdx: number }[] = [];
    if (!content) return headings;

    const lines = content.split('\n');
    let subCount = 0;

    lines.forEach((line) => {
      const trimmed = line.trim();
      const mdHeadingMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
      if (mdHeadingMatch) {
        headings.push({ title: mdHeadingMatch[1].trim(), subIdx: subCount++ });
        return;
      }

      const boldHeadingMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
      if (boldHeadingMatch && boldHeadingMatch[1].length < 60) {
        headings.push({ title: boldHeadingMatch[1].trim(), subIdx: subCount++ });
        return;
      }
    });

    return headings;
  };

  // Helper to render formatted content with TOC sub-heading anchor IDs
  const renderFormattedContent = (content: string, sectionIdx: number) => {
    if (!content) return null;

    const lines = content.split('\n');
    let subIdxCounter = 0;

    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={lineIdx} className="h-1" />;
      }

      // Markdown Headers (#, ##, ###, ####)
      const mdHeadingMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
      if (mdHeadingMatch) {
        const headingText = mdHeadingMatch[1].trim();
        const elementId = `toc-section-${sectionIdx}-sub-${subIdxCounter++}`;
        return (
          <h3
            key={lineIdx}
            id={elementId}
            className="text-[#f8fafc] font-extrabold text-base sm:text-lg mt-5 mb-2 pt-2 border-b border-[#1e293b] flex items-center gap-2 scroll-mt-24 text-sky-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block"></span>
            <span>{headingText}</span>
          </h3>
        );
      }

      // Standalone Bold Line Headers (**Header**)
      const boldHeadingMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
      if (boldHeadingMatch && boldHeadingMatch[1].length < 60) {
        const headingText = boldHeadingMatch[1].trim();
        const elementId = `toc-section-${sectionIdx}-sub-${subIdxCounter++}`;
        return (
          <h4
            key={lineIdx}
            id={elementId}
            className="text-sky-400 font-bold text-sm sm:text-base mt-4 mb-1.5 font-mono uppercase tracking-wide scroll-mt-24"
          >
            {headingText}
          </h4>
        );
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <div key={lineIdx} className="flex items-start gap-2.5 ml-2 my-1 text-sm sm:text-base text-[#cbd5e1]">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 shrink-0"></span>
            <span>{trimmed.substring(2)}</span>
          </div>
        );
      }

      return (
        <p key={lineIdx} className="text-[#cbd5e1] text-sm sm:text-base leading-relaxed my-1">
          {trimmed}
        </p>
      );
    });
  };

  // Generate Table of Contents items dynamically
  const generateTocItems = () => {
    const items: Array<{ id: string; title: string; level: number; numberStr: string }> = [];
    let mainCounter = 1;

    // 1. Media Gallery & 3D Model
    if (galleryItems.length > 0) {
      items.push({
        id: 'toc-gallery',
        title: 'Media Gallery & 3D Model',
        level: 1,
        numberStr: `${mainCounter++}.`
      });
    }

    // 2. Item Attributes
    if (page.itemStats) {
      items.push({
        id: 'toc-attributes',
        title: 'Item Attributes & Performance',
        level: 1,
        numberStr: `${mainCounter++}.`
      });
    }

    // 3. Key Mechanics
    if (behaviorBullets.length > 0) {
      items.push({
        id: 'toc-mechanics',
        title: 'Key Mechanics & Abilities',
        level: 1,
        numberStr: `${mainCounter++}.`
      });
    }

    // 4. Crafting Formula
    if (page.recipes && page.recipes.length > 0) {
      items.push({
        id: 'toc-crafting',
        title: 'Forge & Crafting Formula',
        level: 1,
        numberStr: `${mainCounter++}.`
      });
    }

    // 5. Difficulty Stats
    if (difficultyStats.length > 0) {
      items.push({
        id: 'toc-difficulty',
        title: 'Stats by Difficulty',
        level: 1,
        numberStr: `${mainCounter++}.`
      });
    }

    // 6. Loot Drops
    if (dropsTable.length > 0) {
      items.push({
        id: 'toc-drops',
        title: 'Loot Drops & Acquisition',
        level: 1,
        numberStr: `${mainCounter++}.`
      });
    }

    // 7. Page Content Sections
    if (page.sections && page.sections.length > 0) {
      page.sections.forEach((sec, idx) => {
        const sectionNum = mainCounter++;
        items.push({
          id: `toc-section-${idx}`,
          title: sec.title || `Overview ${idx + 1}`,
          level: 1,
          numberStr: `${sectionNum}.`
        });

        // Sub-headings inside section content
        const subHeadings = parseContentHeadings(sec.content);
        subHeadings.forEach((sub, subIdx) => {
          items.push({
            id: `toc-section-${idx}-sub-${sub.subIdx}`,
            title: sub.title,
            level: 2,
            numberStr: `${sectionNum}.${subIdx + 1}`
          });
        });
      });
    }

    // 8. Custom Properties
    if (page.customProperties && Object.keys(page.customProperties).filter(k => k !== '3D Model Key').length > 0) {
      items.push({
        id: 'toc-additional-info',
        title: 'Additional Information',
        level: 1,
        numberStr: `${mainCounter++}.`
      });
    }

    // 9. Recommended Reading
    if (suggestions.length > 0) {
      items.push({
        id: 'toc-recommendations',
        title: 'Recommended Reading',
        level: 1,
        numberStr: `${mainCounter++}.`
      });
    }

    // 10. Comments
    items.push({
      id: 'toc-comments',
      title: 'Community Comments',
      level: 1,
      numberStr: `${mainCounter++}.`
    });

    return items;
  };

  const tocItems = generateTocItems();

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
                <WikiIcon icon={page.icon} category={page.category} className="w-8 h-8 text-sky-400" />
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

        {/* Wikipedia-Style Auto-Generated Table of Contents */}
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

        {/* 2. Wikipedia-Style Image Gallery & Interactive 3D Model */}
        {galleryItems.length > 0 && (
          <div id="toc-gallery" className="scroll-mt-24">
            <WikiImageGallery items={galleryItems} pageTitle={page.title} />
          </div>
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
          <section id="toc-mechanics" className="space-y-3 scroll-mt-24">
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
          <section id="toc-crafting" className="space-y-3 scroll-mt-24">
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
          <section id="toc-difficulty" className="space-y-2 scroll-mt-24">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">
              STATS BY DIFFICULTY
            </h2>
            <div className="bg-[#111827]/90 border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#1e293b] text-[#94a3b8] font-medium bg-[#0b0f19]/60">
                      <th className="py-3 px-5 font-semibold">Difficulty</th>
                      <th className="py-3 px-5 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                          <span>Health</span>
                        </div>
                      </th>
                      <th className="py-3 px-5 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <img src={getItemImage('sword')!} alt="Attack" className="w-4 h-4 object-contain inline-block" />
                          <span>Attack</span>
                        </div>
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
          <section id="toc-drops" className="space-y-3 scroll-mt-24">
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
                id={`toc-section-${idx}`}
                className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 shadow-md space-y-3 scroll-mt-24"
              >
                <h2 className="text-xl font-bold text-white border-b border-[#1e293b] pb-2 flex items-center gap-2 uppercase tracking-tight">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"></span>
                  {section.title}
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
            <div className="bg-[#111827]/90 border border-[#1e293b] rounded-2xl p-5 shadow-xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(page.customProperties)
                  .filter(([key]) => key !== '3D Model Key')
                  .map(([key, value], idx) => (
                    <div key={idx} className="bg-[#0b0f19] border border-[#1e293b] rounded-xl p-4">
                      <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-1">{key}</span>
                      <span className="text-sm text-[#cbd5e1] font-mono leading-relaxed whitespace-pre-wrap">{value}</span>
                    </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recommended Reads & Suggestions */}
        {suggestions.length > 0 && (
          <div id="toc-recommendations" className="mt-12 border-t border-[#1e293b] pt-8 space-y-4 scroll-mt-24">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Recommended Reading & Suggestions</span>
              </h3>
              <span className="text-xs text-[#64748b] font-mono">Related Articles</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {suggestions.map((sug) => (
                <div
                  key={sug.id}
                  onClick={() => onSelectPage(sug.id)}
                  className="group p-4 bg-[#111827] border border-[#1e293b] hover:border-sky-500/50 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col justify-between space-y-3 shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-[10px] font-mono capitalize font-bold">
                        {sug.category}
                      </span>
                      {['mobs', 'items', 'blocks', 'dimensions', 'recipes', 'biomes'].includes(sug.category) && sug.addonVersion && (
                        <span className="text-[10px] text-[#64748b] font-mono">
                          {sug.addonVersion}
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-white text-sm group-hover:text-sky-400 transition-colors uppercase tracking-tight line-clamp-1">
                      {sug.title}
                    </h4>
                    <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed">
                      {sug.description}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center text-xs font-bold text-sky-400 gap-1 mt-auto">
                    <span>Read Article</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments and Q&A Section */}
        <div id="toc-comments" className="mt-8 border-t border-[#1e293b] pt-8 scroll-mt-24">
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
                <WikiIcon icon={page.icon} category={page.category} className="w-8 h-8 text-sky-400" />
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
                {['mobs', 'items', 'blocks', 'dimensions', 'recipes', 'biomes'].includes(page.category) && (
                  <span className="px-2 py-0.5 bg-[#0b0f19] text-[#94a3b8] border border-[#1e293b] rounded text-xs font-mono">
                    {page.addonVersion}
                  </span>
                )}
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

      {/* Table of Contents for Fallback Layout */}
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

      {/* Main Content */}
      <div className="space-y-6">
        {/* Main Section Column */}
        <div className="space-y-6">
          {activeTab === 'article' && (
            <div className="space-y-6">
              {/* Media Gallery & 3D Showcase */}
              {galleryItems.length > 0 && (
                <div id="toc-gallery" className="scroll-mt-24">
                  <WikiImageGallery items={galleryItems} pageTitle={page.title} />
                </div>
              )}

              {/* Sections */}
              {page.sections.map((section, idx) => (
                <section
                  key={idx}
                  id={`toc-section-${idx}`}
                  className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 shadow-md space-y-3 scroll-mt-24"
                >
                  <h2 className="text-xl font-bold text-white border-b border-[#1e293b] pb-2 flex items-center gap-2 uppercase tracking-tight">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"></span>
                    {section.title}
                  </h2>
                  <div className="text-[#cbd5e1] text-sm sm:text-base leading-relaxed space-y-2">
                    {renderFormattedContent(section.content, idx)}
                  </div>
                </section>
              ))}

              {/* Inlined Crafting Preview if available */}
              {page.recipes && page.recipes.length > 0 && (
                <section id="toc-crafting" className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 shadow-md space-y-3 scroll-mt-24">
                  <h3 className="text-xs uppercase font-bold text-sky-400 tracking-wider flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Crafting Formula
                  </h3>
                  <CraftingGrid recipe={page.recipes[0]} />
                </section>
              )}

              {/* CUSTOM PROPERTIES */}
              {page.customProperties && Object.keys(page.customProperties).filter(k => k !== '3D Model Key').length > 0 && (
                <section id="toc-additional-info" className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 shadow-md space-y-3 scroll-mt-24">
                  <h2 className="text-xl font-bold text-white border-b border-[#1e293b] pb-2 flex items-center gap-2 uppercase tracking-tight">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    Additional Information
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {Object.entries(page.customProperties)
                      .filter(([key]) => key !== '3D Model Key')
                      .map(([key, value], idx) => (
                        <div key={idx} className="bg-[#0b0f19] border border-[#1e293b] rounded-xl p-4">
                          <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-1">{key}</span>
                          <span className="text-sm text-[#cbd5e1] font-mono leading-relaxed whitespace-pre-wrap">{value}</span>
                        </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'crafting' && page.recipes && (
            <div id="toc-crafting" className="space-y-4 scroll-mt-24">
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
            <div id="toc-drops" className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 space-y-3 scroll-mt-24">
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

      {/* Recommended Reads & Suggestions */}
      {suggestions.length > 0 && (
        <div id="toc-recommendations" className="mt-12 border-t border-[#1e293b] pt-8 space-y-4 scroll-mt-24">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Recommended Reading & Suggestions</span>
            </h3>
            <span className="text-xs text-[#64748b] font-mono">Related Articles</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {suggestions.map((sug) => (
              <div
                key={sug.id}
                onClick={() => onSelectPage(sug.id)}
                className="group p-4 bg-[#111827] border border-[#1e293b] hover:border-sky-500/50 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col justify-between space-y-3 shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-[10px] font-mono capitalize font-bold">
                      {sug.category}
                    </span>
                    {['mobs', 'items', 'blocks', 'dimensions', 'recipes', 'biomes'].includes(sug.category) && sug.addonVersion && (
                      <span className="text-[10px] text-[#64748b] font-mono">
                        {sug.addonVersion}
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-white text-sm group-hover:text-sky-400 transition-colors uppercase tracking-tight line-clamp-1">
                    {sug.title}
                  </h4>
                  <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed">
                    {sug.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center text-xs font-bold text-sky-400 gap-1 mt-auto">
                  <span>Read Article</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments and Q&A Section */}
      <div id="toc-comments" className="mt-8 border-t border-[#1e293b] pt-8 scroll-mt-24">
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
