import { WikiPage, CategoryType, PageTemplate } from '../types/wiki';
import { INITIAL_WIKI_PAGES } from '../data/wikiPages';
import { AVAILABLE_TEMPLATES } from '../data/templateRegistry';
import { ITEM_IMAGES } from '../data/itemAssets';

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

// Dynamic aggregation of all available images from item assets, JSON files, and preset landscapes
const defaultPresets = [
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

const imageMap = new Map<string, { url: string; label: string }>();

defaultPresets.forEach((item) => imageMap.set(item.url, item));

Object.entries(ITEM_IMAGES).forEach(([key, url]) => {
  if (url && !imageMap.has(url)) {
    const formattedLabel = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    imageMap.set(url, { url, label: `Asset: ${formattedLabel}` });
  }
});

INITIAL_WIKI_PAGES.forEach((page) => {
  const imagesToInclude = [page.imageUrl, page.coverImage, page.renderImageUrl, ...(page.images || [])];
  imagesToInclude.forEach((url, i) => {
    if (url && typeof url === 'string' && !imageMap.has(url)) {
      imageMap.set(url, { url, label: `${page.title || page.id} Image ${i + 1}` });
    }
  });
});

export const PRESET_IMAGES = Array.from(imageMap.values());

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
  private static cachedPages: WikiPage[] = [];

  static getPages(): WikiPage[] {
    return this.cachedPages;
  }

  static async fetchPagesFromSql(): Promise<WikiPage[]> {
    try {
      // Try to query sql.js-httpvfs static range-request DB first
      const clientModule = await import('../db/client');
      const rows = await clientModule.query<{ data: string }>('SELECT data FROM wiki_pages');
      if (rows && rows.length > 0) {
        const sqlPages: WikiPage[] = rows.map(r => JSON.parse(r.data));
        this.cachedPages = sqlPages;
        window.dispatchEvent(new Event('wiki_data_updated'));
        console.log(`✅ [WikiApi] Loaded ${sqlPages.length} pages directly from static SQLite via sql.js-httpvfs`);
        return sqlPages;
      }
    } catch (e) {
      console.warn('[WikiApi] sql.js-httpvfs static range-request page fetch failed/unsupported, falling back to /api/pages:', e);
    }

    try {
      const res = await fetch('/api/pages');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.pages)) {
          const sqlPages: WikiPage[] = data.pages;
          this.cachedPages = sqlPages;
          window.dispatchEvent(new Event('wiki_data_updated'));
          return sqlPages;
        }
      }
    } catch (e) {
      console.warn('[WikiApi] Failed to fetch pages from /api/pages fallback:', e);
    }

    return this.getPages();
  }

  static async createPage(page: WikiPage, userEmail?: string): Promise<WikiPage> {
    const emailToSave = userEmail || page.creatorEmail || localStorage.getItem('etherium_user_email') || 'ruanpablolopesbritor@gmail.com';
    page.creatorEmail = emailToSave;

    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-User-Email": emailToSave
      },
      body: JSON.stringify(page)
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      throw new Error(`Server returned non-JSON response (${res.status}): ${text || res.statusText}`);
    }

    if (!res.ok || !data.success) {
      throw new Error(data.error || data.message || `Server pipeline error (status ${res.status})`);
    }

    const savedPage = data.page || page;
    this.cachedPages = [savedPage, ...this.cachedPages.filter(p => p.id !== savedPage.id)];
    window.dispatchEvent(new Event('wiki_data_updated'));
    return savedPage;
  }

  static async deletePage(pageId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/pages/${encodeURIComponent(pageId)}`, { method: "DELETE" });
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        throw new Error(`Server returned non-JSON response (${res.status}): ${text || res.statusText}`);
      }
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || `Server delete error (status ${res.status})`);
      }
      this.cachedPages = this.cachedPages.filter(p => p.id !== pageId);
      window.dispatchEvent(new Event('wiki_data_updated'));
      return true;
    } catch (err) {
      console.error("Failed to delete page:", err);
      return false;
    }
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
