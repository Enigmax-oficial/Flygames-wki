import { 
  WikiPage, 
  CategoryType, 
  MobStats, 
  ItemStats, 
  BlockStats, 
  BiomeStats, 
  CraftingRecipe,
  MobDrop
} from '../types/wiki';
import wikiPageTemplate from '../templates/wikiPageTemplate.json';

export class WikiPageBuilder {
  private page: WikiPage;

  constructor(title: string = 'New Entry', category: CategoryType = 'items') {
    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'new-entry';
    
    this.page = {
      id: slug,
      title: title,
      namespace: `etherium:${slug.replace(/-/g, '_')}`,
      category: category,
      description: `Description for ${title}.`,
      addonVersion: 'v1.4.0',
      icon: category === 'mobs' ? '👾' : category === 'items' ? 'sword' : category === 'blocks' ? '🧊' : '📖',
      tags: [category, 'Addon', 'v1.4.0'],
      lastUpdated: new Date().toISOString().split('T')[0],
      author: 'Etherium Author',
      sections: [
        {
          title: 'Overview',
          content: `${title} is an entry in the Etherium Addon.`
        }
      ]
    };
  }

  /**
   * Creates a builder initialized with the JSON template
   */
  public static fromTemplate(): WikiPageBuilder {
    const builder = new WikiPageBuilder();
    if (wikiPageTemplate && wikiPageTemplate.sample) {
      builder.page = { ...wikiPageTemplate.sample } as WikiPage;
    }
    return builder;
  }

  /**
   * Instantiates a WikiPageBuilder from a raw JSON object or JSON string
   */
  public static fromJSON(jsonInput: string | object): WikiPageBuilder {
    try {
      const data = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput;
      const builder = new WikiPageBuilder(data.title || 'Untitled', data.category || 'items');
      builder.page = { ...builder.page, ...data };
      return builder;
    } catch (e) {
      console.error('Failed to parse JSON for WikiPageBuilder:', e);
      return new WikiPageBuilder('Invalid JSON Entry', 'items');
    }
  }

  /**
   * Validates a WikiPage structure
   */
  public static validate(page: Partial<WikiPage>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!page.id) errors.push('Missing unique id (slug)');
    if (!page.title) errors.push('Missing title');
    if (!page.category) errors.push('Missing category');
    if (!page.description) errors.push('Missing description');
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  public setId(id: string): this {
    this.page.id = id;
    return this;
  }

  public setTitle(title: string): this {
    this.page.title = title;
    if (!this.page.id || this.page.id === 'new-entry') {
      this.page.id = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (!this.page.namespace || this.page.namespace.startsWith('etherium:new_entry')) {
      this.page.namespace = `etherium:${this.page.id.replace(/-/g, '_')}`;
    }
    return this;
  }

  public setCategory(category: CategoryType): this {
    this.page.category = category;
    return this;
  }

  public setDescription(description: string): this {
    this.page.description = description;
    return this;
  }

  public setIcon(icon: string): this {
    this.page.icon = icon;
    return this;
  }

  public setBadge(badge: string, color: 'purple' | 'emerald' | 'amber' | 'blue' | 'rose' | 'red' = 'blue'): this {
    this.page.badge = badge;
    this.page.badgeColor = color;
    return this;
  }

  public setImageUrl(url: string): this {
    this.page.imageUrl = url;
    return this;
  }

  public setTags(tags: string[]): this {
    this.page.tags = tags;
    return this;
  }

  public setMobStats(stats: MobStats): this {
    this.page.mobStats = stats;
    this.page.category = 'mobs';
    return this;
  }

  public setItemStats(stats: ItemStats): this {
    this.page.itemStats = stats;
    this.page.category = 'items';
    return this;
  }

  public setBlockStats(stats: BlockStats): this {
    this.page.blockStats = stats;
    this.page.category = 'blocks';
    return this;
  }

  public setBiomeStats(stats: BiomeStats): this {
    this.page.biomeStats = stats;
    this.page.category = 'biomes';
    return this;
  }

  public addSection(title: string, content: string): this {
    if (!this.page.sections) this.page.sections = [];
    this.page.sections.push({ title, content });
    return this;
  }

  public addRecipe(recipe: CraftingRecipe): this {
    if (!this.page.recipes) this.page.recipes = [];
    this.page.recipes.push(recipe);
    return this;
  }

  public addGalleryItem(url: string, title?: string, caption?: string, is3D: boolean = false): this {
    if (!this.page.gallery) this.page.gallery = [];
    this.page.gallery.push({ url, title, caption, is3D });
    return this;
  }

  public setBehaviorBullets(bullets: string[]): this {
    this.page.behaviorBullets = bullets;
    return this;
  }

  /**
   * Finalizes and builds the WikiPage object
   */
  public build(): WikiPage {
    const validation = WikiPageBuilder.validate(this.page);
    if (!validation.valid) {
      console.warn('WikiPageBuilder built page with warnings:', validation.errors);
    }
    return { ...this.page };
  }

  /**
   * Exports the current page to formatted JSON
   */
  public toJSON(): string {
    return JSON.stringify(this.page, null, 2);
  }
}
