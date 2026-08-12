import { PageTemplate, WikiPage } from '../types/wiki';

export const ITEM_IMAGES: Record<string, string> = {};

export function getItemImage(idOrPage: string | WikiPage | any, customImages?: any): string | undefined {
  return undefined;
}

export function getPageCoverImage(idOrPage: string | WikiPage | any): string | undefined {
  return undefined;
}

export const AVAILABLE_TEMPLATES: PageTemplate[] = [];

export function createPageFromTemplate(templateId: string, options: Partial<WikiPage> & any): WikiPage {
  return {
    id: options.id || crypto.randomUUID(),
    title: options.title || 'Untitled',
    namespace: options.namespace || '',
    category: (options.category || 'items') as any,
    description: options.description || '',
    sections: options.sections || [],
    tags: options.tags || [],
    author: options.author,
  } as WikiPage;
}
