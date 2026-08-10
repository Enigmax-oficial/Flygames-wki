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
 * Fluent Builder & Scriptable Class to create wiki pages without recreating styles.
 * Supports attaching images, text sections, 3D models, Bedrock animations, and stats.
 * 
 * Example usage:
 * const zombie = PageCreator.createMob('Crystal Zombie')
 *   .setDescription('A rare crystalline zombie variant.')
 *   .attachImage('https://example.com/zombie.png')
 *   .attach3DModel('climber_zombie')
 *   .addSection('Behavior', 'Climbs walls and emits light.')
 *   .build();
 */
export class PageCreator {
  private page: Partial<WikiPage>;

  constructor(title: string, category: CategoryType = 'items') {
    const id = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    this.page = {
      id,
      title,
      category,
      namespace: `aetheria:${id.replace(/-/g, '_')}`,
      description: `${title} page created via template script.`,
      addonVersion: 'v1.4.0',
      icon: category === 'mobs' ? 'mobs' : category === 'blocks' ? 'blocks' : category === 'biomes' ? 'biomes' : category === 'recipes' ? 'recipes' : category === 'guides' ? 'guides' : 'items',
      badge: category.toUpperCase(),
      badgeColor: category === 'mobs' ? 'emerald' : category === 'blocks' ? 'amber' : category === 'biomes' ? 'purple' : category === 'recipes' ? 'cyan' : 'blue',
      tags: ['addon', category],
      lastUpdated: new Date().toISOString().split('T')[0],
      author: 'Aetheria Creator',
      sections: [
        {
          title: 'Overview',
          content: `${title} is a featured entry in the Aetheria Addon.`
        }
      ]
    };
  }

  static createMob(title: string): PageCreator {
    return new PageCreator(title, 'mobs');
  }

  static createItem(title: string): PageCreator {
    return new PageCreator(title, 'items');
  }

  static createBlock(title: string): PageCreator {
    return new PageCreator(title, 'blocks');
  }

  static createBiome(title: string): PageCreator {
    return new PageCreator(title, 'biomes');
  }

  static createRecipe(title: string): PageCreator {
    return new PageCreator(title, 'recipes');
  }

  static createGuide(title: string): PageCreator {
    return new PageCreator(title, 'guides');
  }

  setId(id: string): this {
    this.page.id = id;
    return this;
  }

  setNamespace(namespace: string): this {
    this.page.namespace = namespace;
    return this;
  }

  setDescription(description: string): this {
    this.page.description = description;
    return this;
  }

  setIcon(icon: string): this {
    this.page.icon = icon;
    return this;
  }

  setBadge(badge: string, color?: 'purple' | 'emerald' | 'amber' | 'blue' | 'rose' | 'red'): this {
    this.page.badge = badge;
    if (color) this.page.badgeColor = color;
    return this;
  }

  setAuthor(author: string): this {
    this.page.author = author;
    return this;
  }

  setAddonVersion(version: string): this {
    this.page.addonVersion = version;
    return this;
  }

  // Image attachments
  attachImage(imageUrl: string): this {
    this.page.imageUrl = imageUrl;
    this.page.renderImageUrl = imageUrl;
    return this;
  }

  attachBanner(bannerUrl: string): this {
    this.page.bannerImageUrl = bannerUrl;
    return this;
  }

  attachRender(renderUrl: string): this {
    this.page.renderImageUrl = renderUrl;
    return this;
  }

  // 3D Model and animation attachments
  attach3DModel(modelKey: string, defaultAnimation: 'idle' | 'attack' | 'swimming' | 'baby_attack' = 'idle'): this {
    this.page.customProperties = {
      ...(this.page.customProperties || {}),
      '3D Model Key': modelKey,
      'Default Animation': defaultAnimation
    };
    return this;
  }

  // Add rich text section
  addSection(title: string, content: string): this {
    if (!this.page.sections) this.page.sections = [];
    this.page.sections.push({ title, content });
    return this;
  }

  setMobStats(stats: MobStats): this {
    this.page.mobStats = stats;
    return this;
  }

  setItemStats(stats: ItemStats): this {
    this.page.itemStats = stats;
    return this;
  }

  setBlockStats(stats: BlockStats): this {
    this.page.blockStats = stats;
    return this;
  }

  setBiomeStats(stats: BiomeStats): this {
    this.page.biomeStats = stats;
    return this;
  }

  addRecipe(recipe: CraftingRecipe): this {
    if (!this.page.recipes) this.page.recipes = [];
    this.page.recipes.push(recipe);
    return this;
  }

  addBehaviorBullet(bullet: string): this {
    if (!this.page.behaviorBullets) this.page.behaviorBullets = [];
    this.page.behaviorBullets.push(bullet);
    return this;
  }

  addCustomProperty(key: string, value: string): this {
    if (!this.page.customProperties) this.page.customProperties = {};
    this.page.customProperties[key] = value;
    return this;
  }

  build(): WikiPage {
    return {
      id: this.page.id || 'new-page',
      title: this.page.title || 'Untitled Page',
      namespace: this.page.namespace || `aetheria:${this.page.id}`,
      category: this.page.category || 'items',
      description: this.page.description || '',
      addonVersion: this.page.addonVersion || 'v1.4.0',
      icon: this.page.icon || '📄',
      imageUrl: this.page.imageUrl,
      renderImageUrl: this.page.renderImageUrl,
      bannerImageUrl: this.page.bannerImageUrl,
      badge: this.page.badge,
      badgeColor: this.page.badgeColor,
      tags: this.page.tags || ['addon', this.page.category || 'items'],
      lastUpdated: this.page.lastUpdated || new Date().toISOString().split('T')[0],
      author: this.page.author || 'Aetheria Creator',
      itemStats: this.page.itemStats,
      mobStats: this.page.mobStats,
      blockStats: this.page.blockStats,
      biomeStats: this.page.biomeStats,
      behaviorBullets: this.page.behaviorBullets,
      behaviorMeta: this.page.behaviorMeta,
      difficultyStats: this.page.difficultyStats,
      movementSpeed: this.page.movementSpeed,
      dropsTable: this.page.dropsTable,
      sections: this.page.sections || [{ title: 'Overview', content: 'Page details.' }],
      recipes: this.page.recipes,
      gallery: this.page.gallery,
      images: this.page.images,
      customProperties: this.page.customProperties
    };
  }
}

/**
 * Downloads an executable JS/TS template script for admins to import into source code
 */
export function downloadTemplateScript(
  title: string = 'New Etherium Item',
  category: CategoryType = 'items',
  namespace: string = 'aetheria:custom_item'
) {
  const scriptContent = `/**
 * Etherium Wiki - Page Creator Template Script
 * Author: admin@aetheria.local
 * Generated automatically for direct source code implementation
 */

import { PageCreator } from '../templates/PageCreator';

export const ${title.replace(/[^a-zA-Z0-9]/g, '') || 'customPage'} = PageCreator.createItem('${title}')
  .setNamespace('${namespace}')
  .setDescription('${title} - Custom item created by Administrator')
  .setAuthor('admin@aetheria.local')
  .setBadge('LEGENDARY', 'amber')
  .attachImage('https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80')
  .addSection('Overview', '${title} is a specialized item forged for the Aetheria Addon.')
  .addSection('Lore & Abilities', 'Forged in the ancient altar, it channelizes elemental power.')
  .setItemStats({
    damage: '14 (Sharpness VI)',
    durability: 2048,
    stackSize: 1,
    rarity: 'Legendary'
  })
  .addRecipe({
    id: '${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-recipe',
    type: 'crafting_3x3',
    title: '${title} Crafting Recipe',
    grid: [
      'minecraft:diamond', 'aetheria:aether_crystal', 'minecraft:diamond',
      'aetheria:aether_crystal', 'minecraft:netherite_ingot', 'aetheria:aether_crystal',
      'minecraft:stick', 'aetheria:aether_crystal', 'minecraft:stick'
    ],
    output: {
      id: '${namespace}',
      name: '${title}',
      count: 1
    }
  })
  .build();
`;

  const blob = new Blob([scriptContent], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_template.js`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the complete PageCreator.ts class file for source code integration
 */
export function downloadGlobalPageCreator() {
  const classContent = `import { WikiPage, CategoryType, MobStats, ItemStats, BlockStats, BiomeStats, CraftingRecipe } from '../types/wiki';

export class PageCreator {
  private page: Partial<WikiPage>;

  constructor(title: string, category: CategoryType = 'items') {
    const id = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    this.page = {
      id,
      title,
      category,
      namespace: \`aetheria:\${id.replace(/-/g, '_')}\`,
      description: \`\${title} page created via template script.\`,
      addonVersion: 'v1.4.0',
      icon: category === 'mobs' ? '🧟' : category === 'blocks' ? '🧱' : category === 'biomes' ? '🌲' : 'sword',
      badge: category.toUpperCase(),
      badgeColor: 'amber',
      tags: ['addon', category],
      lastUpdated: new Date().toISOString().split('T')[0],
      author: 'Aetheria Creator'
    };
  }

  static createMob(title: string): PageCreator { return new PageCreator(title, 'mobs'); }
  static createItem(title: string): PageCreator { return new PageCreator(title, 'items'); }
  static createBlock(title: string): PageCreator { return new PageCreator(title, 'blocks'); }

  setDescription(desc: string): this { this.page.description = desc; return this; }
  setAuthor(author: string): this { this.page.author = author; return this; }
  attachImage(url: string): this { this.page.imageUrl = url; this.page.renderImageUrl = url; return this; }
  attach3DModel(modelKey: string): this {
    this.page.customProperties = { ...(this.page.customProperties || {}), '3D Model Key': modelKey };
    return this;
  }
  addSection(title: string, content: string): this {
    if (!this.page.sections) this.page.sections = [];
    this.page.sections.push({ title, content });
    return this;
  }
  setItemStats(stats: ItemStats): this { this.page.itemStats = stats; return this; }
  build(): WikiPage { return this.page as WikiPage; }
}
`;

  const blob = new Blob([classContent], { type: 'text/typescript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PageCreator.ts`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
