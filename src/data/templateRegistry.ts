import { PageTemplate, CategoryType, WikiPage } from '../types/wiki';
import itemTemplate from '../templates/item-template.json';
import mobTemplate from '../templates/mob-template.json';
import blockTemplate from '../templates/block-template.json';
import recipeTemplate from '../templates/recipe-template.json';
import biomeTemplate from '../templates/biome-template.json';
import guideTemplate from '../templates/guide-template.json';

export const TEMPLATE_REGISTRY: Record<string, PageTemplate> = {
  'item-template': itemTemplate as PageTemplate,
  'mob-template': mobTemplate as PageTemplate,
  'block-template': blockTemplate as PageTemplate,
  'recipe-template': recipeTemplate as PageTemplate,
  'biome-template': biomeTemplate as PageTemplate,
  'guide-template': guideTemplate as PageTemplate,
};

export const AVAILABLE_TEMPLATES: PageTemplate[] = [
  itemTemplate as PageTemplate,
  mobTemplate as PageTemplate,
  blockTemplate as PageTemplate,
  recipeTemplate as PageTemplate,
  biomeTemplate as PageTemplate,
  guideTemplate as PageTemplate,
];

export function createPageFromTemplate(
  templateId: string,
  overrides: { title: string; namespace: string; description?: string }
): WikiPage {
  const tmpl = TEMPLATE_REGISTRY[templateId] || itemTemplate;
  const now = new Date().toISOString().split('T')[0];
  const slug = overrides.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const defaultData = tmpl.defaultData as Partial<WikiPage>;

  const newPage: WikiPage = {
    id: slug || `page-${Date.now()}`,
    title: overrides.title,
    namespace: overrides.namespace || `my_addon:${slug}`,
    category: (tmpl.category as CategoryType) || 'items',
    description: overrides.description || defaultData.description || 'Page created with Minecraft Addon Wiki template.',
    addonVersion: defaultData.addonVersion || 'v1.0.0',
    icon: defaultData.icon || '📄',
    tags: defaultData.tags || [tmpl.category],
    lastUpdated: now,
    author: 'Addon Creator',
    itemStats: defaultData.itemStats ? { ...defaultData.itemStats } as any : undefined,
    mobStats: defaultData.mobStats ? { ...defaultData.mobStats } as any : undefined,
    blockStats: defaultData.blockStats ? { ...defaultData.blockStats } as any : undefined,
    biomeStats: defaultData.biomeStats ? { ...defaultData.biomeStats } : undefined,
    recipes: defaultData.recipes ? JSON.parse(JSON.stringify(defaultData.recipes)) : undefined,
    sections: defaultData.sections ? JSON.parse(JSON.stringify(defaultData.sections)) : [
      {
        title: 'Overview',
        content: 'Describe the purpose and function of this page here.',
      },
    ],
    customProperties: defaultData.customProperties ? { ...defaultData.customProperties } : undefined,
  };

  return newPage;
}
