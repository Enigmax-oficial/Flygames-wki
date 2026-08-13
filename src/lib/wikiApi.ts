import { WikiPage, CategoryType, PageTemplate } from '../types/wiki';

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
      const presets: PageTemplate[] = [];
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
      return [];
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
      const res = await fetch('/api/pages');
      if (res.ok) {
        const data = await res.json() as { results?: Array<{ id: string; title: string; slug: string; content: string; category?: string; image_url?: string; created_at?: string; updated_at?: string; createdAt?: string; updatedAt?: string }> };
        const rows = data.results || (Array.isArray(data) ? data : []);
        const pages: WikiPage[] = rows.map(r => ({
          id: r.slug || r.id,
          title: r.title,
          namespace: 'minecraft:' + (r.slug || r.id).replace(/-/g, '_'),
          category: r.category || 'guides',
          description: r.content ? r.content.substring(0, 150) : '',
          addonVersion: '1.0.0',
          icon: '✨',
          tags: [r.slug || r.id],
          lastUpdated: r.updated_at || r.updatedAt || new Date().toISOString(),
          content: r.content,
          imageUrl: r.image_url || undefined,
          renderImageUrl: r.image_url || undefined,
          image_url: r.image_url || undefined,
          createdAt: r.created_at || r.createdAt,
          updatedAt: r.updated_at || r.updatedAt,
          templateId: 'standard',
        } as unknown as WikiPage));
        this.cachedPages = pages;
        window.dispatchEvent(new Event('wiki_data_updated'));
        console.log(`✅ [WikiApi] Loaded ${pages.length} pages from Cloudflare D1 Worker API`);
        return pages;
      }
    } catch (e) {
      console.warn('[WikiApi] Failed to fetch pages from Cloudflare D1 API:', e);
    }

    return this.getPages();
  }

  static async createPage(page: WikiPage, userEmail?: string): Promise<WikiPage> {
    const emailToSave = userEmail || page.creatorEmail || localStorage.getItem('etherium_user_email') || 'ruanpablolopesbritor@gmail.com';
    page.creatorEmail = emailToSave;

    const pageSlug = page.id || page.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
    
    const sectionsText = page.sections ? page.sections.map((s: any) => `## ${s.title}\n\n${s.content}`).join('\n\n') : '';
    const bulletsText = page.behaviorBullets ? page.behaviorBullets.map((b: string) => `- ${b}`).join('\n') : '';
    const pageContent = [
      page.description || '',
      bulletsText ? `### Key Mechanics\n${bulletsText}` : '',
      sectionsText
    ].filter(Boolean).join('\n\n') || (page as any).content || page.title;

    const imageUrl = page.imageUrl || page.renderImageUrl || (page as any).image_url || '';

    const requestBody = {
      title: page.title,
      slug: pageSlug,
      content: pageContent,
      category: page.category || 'guides',
      image_url: imageUrl,
    };
    console.log('[DIAGNOSTIC] createPage request body:', JSON.stringify(requestBody));

    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-User-Email": emailToSave
      },
      body: JSON.stringify(requestBody)
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      throw new Error(`Server returned non-JSON response (${res.status}): ${text || res.statusText}`);
    }

    if (!res.ok) {
      throw new Error(data.error || `Server error (status ${res.status})`);
    }

    const savedRecord = data;
    const savedPage: WikiPage = {
      ...page,
      id: savedRecord.slug || savedRecord.id || page.id,
      title: savedRecord.title || page.title,
      description: savedRecord.content || page.description,
      lastUpdated: savedRecord.updated_at || new Date().toISOString(),
    };

    this.cachedPages = [savedPage, ...this.cachedPages.filter(p => p.id !== savedPage.id)];
    window.dispatchEvent(new Event('wiki_data_updated'));
    return savedPage;
  }

  static async deletePage(pageId: string, slug?: string): Promise<boolean> {
    try {
      const identifier = slug || pageId;
      const res = await fetch(`/api/pages/${encodeURIComponent(identifier)}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const text = await res.text();
        let data: any = {};
        try { data = text ? JSON.parse(text) : {}; } catch {}
        throw new Error(data.error || `Server delete error (status ${res.status})`);
      }
      this.cachedPages = this.cachedPages.filter(p => p.id !== pageId && p.id !== slug);
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
