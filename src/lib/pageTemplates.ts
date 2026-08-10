import { 
  WikiPage, 
  CategoryType, 
  MobStats, 
  ItemStats, 
  BlockStats, 
  BiomeStats, 
  CraftingRecipe
} from '../types/wiki';

/**
 * Base Class Template for Wiki Pages
 */
export class TemplateWikiPage implements WikiPage {
  id: string;
  title: string;
  namespace: string;
  category: CategoryType;
  description: string;
  addonVersion: string;
  icon: string;
  imageUrl?: string;
  renderImageUrl?: string;
  bannerImageUrl?: string;
  badge?: string;
  badgeColor?: 'purple' | 'emerald' | 'amber' | 'blue' | 'rose' | 'red' | 'cyan';
  tags: string[];
  lastUpdated: string;
  author?: string;
  itemStats?: ItemStats;
  mobStats?: MobStats;
  blockStats?: BlockStats;
  biomeStats?: BiomeStats;
  behaviorBullets?: string[];
  behaviorMeta?: Record<string, string>;
  difficultyStats?: WikiPage['difficultyStats'];
  movementSpeed?: string;
  dropsTable?: WikiPage['dropsTable'];
  sections: Array<{ title: string; content: string }>;
  recipes?: CraftingRecipe[];
  gallery?: WikiPage['gallery'];
  images?: string[];
  customProperties?: Record<string, string>;

  constructor(data: Partial<WikiPage> & { title: string }) {
    const slug = data.id || data.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    this.id = slug;
    this.title = data.title;
    this.namespace = data.namespace || `aetheria:${slug.replace(/-/g, '_')}`;
    this.category = data.category || 'items';
    this.description = data.description || `${data.title} page in the Addon Wiki.`;
    this.addonVersion = data.addonVersion || 'v1.4.0';
    this.icon = data.icon || '📄';
    this.imageUrl = data.imageUrl;
    this.renderImageUrl = data.renderImageUrl;
    this.bannerImageUrl = data.bannerImageUrl;
    this.badge = data.badge;
    this.badgeColor = data.badgeColor;
    this.tags = data.tags || ['addon', this.category];
    this.lastUpdated = data.lastUpdated || '2026-08-09';
    this.author = data.author || 'Aetheria Team';
    this.itemStats = data.itemStats;
    this.mobStats = data.mobStats;
    this.blockStats = data.blockStats;
    this.biomeStats = data.biomeStats;
    this.behaviorBullets = data.behaviorBullets;
    this.behaviorMeta = data.behaviorMeta;
    this.difficultyStats = data.difficultyStats;
    this.movementSpeed = data.movementSpeed;
    this.dropsTable = data.dropsTable;
    this.sections = data.sections || [
      { title: 'Overview', content: `${data.title} overview details.` }
    ];
    this.recipes = data.recipes;
    this.gallery = data.gallery;
    this.images = data.images;
    this.customProperties = data.customProperties;
  }

  public build(): WikiPage {
    return {
      id: this.id,
      title: this.title,
      namespace: this.namespace,
      category: this.category,
      description: this.description,
      addonVersion: this.addonVersion,
      icon: this.icon,
      imageUrl: this.imageUrl,
      renderImageUrl: this.renderImageUrl,
      bannerImageUrl: this.bannerImageUrl,
      badge: this.badge,
      badgeColor: this.badgeColor,
      tags: this.tags,
      lastUpdated: this.lastUpdated,
      author: this.author,
      itemStats: this.itemStats,
      mobStats: this.mobStats,
      blockStats: this.blockStats,
      biomeStats: this.biomeStats,
      behaviorBullets: this.behaviorBullets,
      behaviorMeta: this.behaviorMeta,
      difficultyStats: this.difficultyStats,
      movementSpeed: this.movementSpeed,
      dropsTable: this.dropsTable,
      sections: this.sections,
      recipes: this.recipes,
      gallery: this.gallery,
      images: this.images,
      customProperties: this.customProperties,
    };
  }
}

/**
 * Class Template for Mobs & Entities
 * Example: const climberZombie = new TemplateMob({ title: 'Climber Zombie', ... });
 */
export class TemplateMob extends TemplateWikiPage {
  constructor(data: Partial<WikiPage> & { title: string }) {
    super({
      category: 'mobs',
      icon: '🧟',
      badge: 'MOB',
      badgeColor: 'emerald',
      ...data
    });
  }
}

/**
 * Class Template for Items, Weapons & Equipment
 * Example: const blade = new TemplateItem({ title: 'Etherium Blade', ... });
 */
export class TemplateItem extends TemplateWikiPage {
  constructor(data: Partial<WikiPage> & { title: string }) {
    super({
      category: 'items',
      icon: 'sword',
      badge: 'ITEM',
      badgeColor: 'blue',
      ...data
    });
  }
}

/**
 * Class Template for Blocks & Ores
 * Example: const ore = new TemplateBlock({ title: 'Crystal Ore', ... });
 */
export class TemplateBlock extends TemplateWikiPage {
  constructor(data: Partial<WikiPage> & { title: string }) {
    super({
      category: 'blocks',
      icon: '🧊',
      badge: 'BLOCK',
      badgeColor: 'amber',
      ...data
    });
  }
}

/**
 * Class Template for Biomes & Dimensions
 * Example: const forest = new TemplateBiome({ title: 'Celestial Forest', ... });
 */
export class TemplateBiome extends TemplateWikiPage {
  constructor(data: Partial<WikiPage> & { title: string }) {
    super({
      category: 'biomes',
      icon: '🌲',
      badge: 'BIOME',
      badgeColor: 'rose',
      ...data
    });
  }
}

/**
 * Class Template for Guides & Tutorials
 * Example: const guide = new TemplateGuide({ title: 'Installation Guide', ... });
 */
export class TemplateGuide extends TemplateWikiPage {
  constructor(data: Partial<WikiPage> & { title: string }) {
    super({
      category: 'guides',
      icon: '📖',
      badge: 'GUIDE',
      badgeColor: 'purple',
      ...data
    });
  }
}

/**
 * Class Template for Recipes
 * Example: const recipe = new TemplateRecipe({ title: 'Etherium Blade Crafting', ... });
 */
export class TemplateRecipe extends TemplateWikiPage {
  constructor(data: Partial<WikiPage> & { title: string }) {
    super({
      category: 'recipes',
      icon: '📜',
      badge: 'RECIPE',
      badgeColor: 'emerald',
      ...data
    });
  }
}
