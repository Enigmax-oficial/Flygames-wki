export type CategoryType = 'items' | 'mobs' | 'blocks' | 'recipes' | 'biomes' | 'guides' | 'templates';

export interface CraftingRecipe {
  type: 'crafting_3x3' | 'crafting_2x2' | 'forge' | 'brewing' | 'altar';
  grid?: (string | null)[]; // 9 slots for 3x3, 4 slots for 2x2
  output: {
    id: string;
    name: string;
    icon?: string;
    count: number;
  };
  inputs?: Array<{ id: string; name: string; icon?: string }>;
  experience?: number;
  timeSeconds?: number;
}

export interface MobDrop {
  item: string;
  itemId: string;
  chance: string; // e.g. "50%" or "1-3 (100%)"
  icon?: string;
  lootingBonus?: string;
}

export interface MobStats {
  health: number; // Health points (e.g. 20 = 10 hearts)
  attackDamage?: string;
  behavior: 'Passive' | 'Neutral' | 'Hostile' | 'Boss';
  spawnBiomes: string[];
  drops: MobDrop[];
  xpDrop?: number;
}

export interface ItemStats {
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  durability?: number;
  attackDamage?: number;
  attackSpeed?: number;
  stackSize?: number;
  enchantable?: boolean;
}

export interface BlockStats {
  hardness: number;
  blastResistance: number;
  toolRequired: 'Pickaxe' | 'Axe' | 'Shovel' | 'Hoe' | 'None' | 'Hand';
  lightLevel?: number;
  transparent?: boolean;
  flammable?: boolean;
  dropItem?: string;
}

export interface BiomeStats {
  climate: 'Cold' | 'Temperate' | 'Warm' | 'Celestial' | 'Void';
  grassColor?: string;
  structures?: string[];
  mobsSpawning?: string[];
}

export interface WikiPage {
  id: string; // Unique URL slug e.g. "aetherial-sword"
  title: string;
  namespace: string; // e.g. "aetheria:aether_sword"
  category: CategoryType;
  description: string;
  addonVersion: string;
  icon: string; // Icon identifier or emoji/image URL
  imageUrl?: string; // High quality visual image banner/illustration
  tags: string[];
  lastUpdated: string;
  author?: string;
  
  // Rich Visual Showcase & Layout Fields (5framestudios styled)
  badge?: string; // e.g. "BOSS", "MOB", "WEAPON"
  badgeColor?: 'purple' | 'emerald' | 'amber' | 'blue' | 'rose' | 'red' | 'cyan';
  renderImageUrl?: string; // 3D Mob/Item Render Image
  bannerImageUrl?: string; // In-Game Banner/Screenshot
  behaviorBullets?: string[]; // Bulleted behavior list
  behaviorMeta?: { biomes?: string; groupSize?: string; spawnRate?: string; [key: string]: string | undefined };
  difficultyStats?: Array<{ difficulty: string; health: string; attack: string; icon?: string; color?: string }>;
  movementSpeed?: string;
  dropsTable?: Array<{ item: string; pageId?: string; amount: string; chance: string; icon?: string }>;

  // Image Gallery & 3D Model fields
  images?: string[]; // Multiple images for Wikipedia-style carousel
  gallery?: Array<{
    url: string;
    title?: string;
    caption?: string;
    is3D?: boolean;
  }>;

  // Specific Type Stats
  itemStats?: ItemStats;
  mobStats?: MobStats;
  blockStats?: BlockStats;
  biomeStats?: BiomeStats;
  
  // Crafting & Recipes
  recipes?: CraftingRecipe[];
  
  // Detailed Content sections (Markdown-supported)
  sections: Array<{
    title: string;
    content: string; // Supports markdown / bullet points
  }>;
  
  // Custom metadata / KV
  customProperties?: Record<string, string>;
}

export interface PageTemplate {
  templateId: string;
  name: string;
  category: CategoryType;
  description: string;
  defaultData: Partial<WikiPage>;
}
