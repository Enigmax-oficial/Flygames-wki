import { WikiPage, CategoryType, PageTemplate } from '../types/wiki';
import { INITIAL_WIKI_PAGES } from '../data/wikiPages';
import { AVAILABLE_TEMPLATES } from '../data/templateRegistry';

export interface DynamicCategory {
  id: string;
  label: string;
  desc: string;
  icon: string; // Lucide icon key name, image URL, or asset key
  color: string; // Tailwind border accent class
  bg: string; // Tailwind gradient class
  isCustom?: boolean;
}

// Preset standard categories
export const PRESET_CATEGORIES: DynamicCategory[] = [
  {
    id: 'mobs',
    label: 'Mobs & Bosses',
    desc: 'Climbing undead, cavern titans, and subterranean bosses.',
    icon: 'mobs',
    color: 'border-rose-500/30',
    bg: 'from-rose-950/30 to-[#111827]',
  },
  {
    id: 'items',
    label: 'Items & Weapons',
    desc: 'Elemental blades, crystal cores, and enchanted relics.',
    icon: 'items',
    color: 'border-amber-500/30',
    bg: 'from-amber-950/30 to-[#111827]',
  },
  {
    id: 'blocks',
    label: 'Blocks & Ores',
    desc: 'Crystallized stone, resonant ores, and dungeon bricks.',
    icon: 'blocks',
    color: 'border-sky-500/30',
    bg: 'from-sky-950/30 to-[#111827]',
  },
  {
    id: 'recipes',
    label: 'Forge Recipes',
    desc: 'Crafting blueprints and anvil combination guides.',
    icon: 'recipes',
    color: 'border-cyan-500/30',
    bg: 'from-cyan-950/30 to-[#111827]',
  },
  {
    id: 'biomes',
    label: 'Biomes & Realms',
    desc: 'Crystal Canyons, Underground Dungeons & Void Caves.',
    icon: 'biomes',
    color: 'border-purple-500/30',
    bg: 'from-purple-950/30 to-[#111827]',
  },
  {
    id: 'dimensions',
    label: 'Dimensions',
    desc: 'Mystical alternate worlds, celestial portals, and dangerous custom dimensions.',
    icon: 'dimensions',
    color: 'border-pink-500/30',
    bg: 'from-pink-950/30 to-[#111827]',
  },
  {
    id: 'guides',
    label: 'Guides & Manuals',
    desc: 'Addon installation steps, combat tactics & mechanics.',
    icon: 'guides',
    color: 'border-indigo-500/30',
    bg: 'from-indigo-950/30 to-[#111827]',
  }
];

// Preset high quality images that users can choose from
export const PRESET_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1607988795691-3d0147b43231?auto=format&fit=crop&w=600&q=80',
    label: 'Crystalline Cavern Room (Glow)'
  },
  {
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
    label: 'Forged Elemental SwordArtwork'
  },
  {
    url: 'https://images.unsplash.com/photo-1605899435973-ca2d1a8861cf?auto=format&fit=crop&w=600&q=80',
    label: 'Ancient Castle / Spawning Fortress'
  },
  {
    url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
    label: 'Dungeon Ruins Layout'
  },
  {
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80',
    label: 'Crystallized Biome Core'
  },
  {
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    label: 'Aetheria Portal Shimmer'
  }
];

export class WikiApi {
  // Category Methods
  static getCategories(): DynamicCategory[] {
    try {
      const saved = localStorage.getItem('aetheria_custom_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const all = [...PRESET_CATEGORIES, ...parsed.map(c => ({ ...c, isCustom: true }))];
          const unique = new Map();
          for (const item of all) { if (!unique.has(item.id)) unique.set(item.id, item); }
          return Array.from(unique.values());
        }
      }
    } catch (e) {
      console.error('Error fetching categories', e);
    }
    return PRESET_CATEGORIES;
  }

  static createCategory(category: { id: string; label: string; desc: string; icon: string; color?: string; bg?: string }): DynamicCategory {
    const categories = this.getCategories();
    const cleanId = category.id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    
    // Check duplication
    if (categories.some(c => c.id === cleanId)) {
      throw new Error(`Category with ID '${cleanId}' already exists.`);
    }

    const newCat: DynamicCategory = {
      id: cleanId,
      label: category.label,
      desc: category.desc,
      icon: category.icon || '📁',
      color: category.color || 'border-emerald-500/30',
      bg: category.bg || 'from-emerald-950/30 to-[#111827]',
      isCustom: true
    };

    const customCats = categories.filter(c => c.isCustom);
    customCats.push(newCat);
    localStorage.setItem('aetheria_custom_categories', JSON.stringify(customCats));

    // Emit event for state change notification
    window.dispatchEvent(new Event('wiki_data_updated'));
    return newCat;
  }

  static deleteCategory(id: string): boolean {
    try {
      const saved = localStorage.getItem('aetheria_custom_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(c => c.id !== id);
          localStorage.setItem('aetheria_custom_categories', JSON.stringify(filtered));
          window.dispatchEvent(new Event('wiki_data_updated'));
          return true;
        }
      }
    } catch {}
    return false;
  }

  // Template Methods
  static getTemplates(): PageTemplate[] {
    try {
      const saved = localStorage.getItem('aetheria_custom_templates');
      const presets = AVAILABLE_TEMPLATES;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const all = [...presets, ...parsed];
          const unique = new Map();
          for (const item of all) { if (!unique.has(item.templateId)) unique.set(item.templateId, item); }
          return Array.from(unique.values());
        }
      }
      return presets;
    } catch {
      return AVAILABLE_TEMPLATES;
    }
  }

  static createTemplate(template: PageTemplate): PageTemplate {
    const templates = this.getTemplates();
    if (templates.some(t => t.templateId === template.templateId)) {
      throw new Error(`Template with ID '${template.templateId}' already exists.`);
    }

    const saved = localStorage.getItem('aetheria_custom_templates');
    const parsed = saved ? JSON.parse(saved) : [];
    parsed.push(template);
    localStorage.setItem('aetheria_custom_templates', JSON.stringify(parsed));

    window.dispatchEvent(new Event('wiki_data_updated'));
    return template;
  }

  // Page Methods
  static getPages(): WikiPage[] {
    let deletedIds: string[] = [];
    try {
      const del = localStorage.getItem('aetheria_deleted_page_ids');
      if (del) deletedIds = JSON.parse(del);
    } catch {}

    // If a page exists in INITIAL_WIKI_PAGES (the JSON files), ensure it's not blocked by old delete state
    const initialIds = new Set(INITIAL_WIKI_PAGES.map(p => p.id));
    const activeDeletedIds = deletedIds.filter(id => !initialIds.has(id));
    if (activeDeletedIds.length !== deletedIds.length) {
      try {
        localStorage.setItem('aetheria_deleted_page_ids', JSON.stringify(activeDeletedIds));
      } catch {}
      deletedIds = activeDeletedIds;
    }

    const activeInitialPages = INITIAL_WIKI_PAGES.filter(p => !deletedIds.includes(p.id));

    try {
      const saved = localStorage.getItem('aetheria_wiki_pages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const customPages = parsed.filter(p => p.isCustom || p.tags?.includes('Custom') || !INITIAL_WIKI_PAGES.some(ip => ip.id === p.id));
          const validCustomPages = customPages.filter(p => !deletedIds.includes(p.id));
          
          const uniqueMap = new Map<string, WikiPage>();
          for (const p of activeInitialPages) uniqueMap.set(p.id, p);
          for (const p of validCustomPages) uniqueMap.set(p.id, p);
          return Array.from(uniqueMap.values());
        }
      }
    } catch {}
    return activeInitialPages;
  }

  static createPage(page: WikiPage): WikiPage {
    const pages = this.getPages();
    const filteredPages = pages.filter(p => p.id !== page.id);
    const updated = [page, ...filteredPages];
    localStorage.setItem('aetheria_wiki_pages', JSON.stringify(updated));

    window.dispatchEvent(new Event('wiki_data_updated'));
    return page;
  }

  static deletePage(pageId: string): boolean {
    const pages = this.getPages();
    const exists = pages.some(p => p.id === pageId);
    if (!exists) return false;

    try {
      const del = localStorage.getItem('aetheria_deleted_page_ids');
      const deletedIds = del ? JSON.parse(del) : [];
      if (!deletedIds.includes(pageId)) {
        deletedIds.push(pageId);
        localStorage.setItem('aetheria_deleted_page_ids', JSON.stringify(deletedIds));
      }
    } catch {}

    const filtered = pages.filter(p => p.id !== pageId);
    localStorage.setItem('aetheria_wiki_pages', JSON.stringify(filtered));

    window.dispatchEvent(new Event('wiki_data_updated'));
    return true;
  }

  // Preset Images helper
  static getPresetImages() {
    return PRESET_IMAGES;
  }
}

// Attach to window for easy developer access (API availability)
if (typeof window !== 'undefined') {
  (window as any).wikiApi = WikiApi;
}
