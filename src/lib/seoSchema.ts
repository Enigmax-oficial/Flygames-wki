import { WikiPage, CategoryType } from '../types/wiki';
import { PRESET_CATEGORIES } from '../lib/wikiApi';

const SITE_URL = 'https://flygames.flyerserver.uk';

/**
 * Generates JSON-LD Structured Data for BreadcrumbList (Google Search rich results)
 * Enables Google Search to show hierarchical navigational breadcrumb trees.
 */
export function generateBreadcrumbSchema(page?: WikiPage, category?: CategoryType | 'all' | string) {
  const itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }> = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `${SITE_URL}/`,
    },
  ];

  if (category && category !== 'all') {
    const catObj = PRESET_CATEGORIES.find((c) => c.id === category);
    const catLabel = catObj ? catObj.label : category.charAt(0).toUpperCase() + category.slice(1);
    itemListElement.push({
      '@type': 'ListItem',
      position: 2,
      name: catLabel,
      item: `${SITE_URL}/category/${category}`,
    });
  }

  if (page) {
    const pos = itemListElement.length + 1;
    itemListElement.push({
      '@type': 'ListItem',
      position: pos,
      name: page.title,
      item: `${SITE_URL}/${page.category}/${page.id}`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

/**
 * Generates JSON-LD Structured Data for Article / WebPage / Item for Google Search
 */
export function generateArticleSchema(page: WikiPage) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/${page.category}/${page.id}`,
    },
    headline: page.title,
    description: page.description,
    image: page.renderImageUrl || `${SITE_URL}/images/categories/${page.category}.png`,
    author: {
      '@type': 'Organization',
      name: 'Aetheria Addon Wiki',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Aetheria Wiki Engine',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/images/categories/items.png`,
      },
    },
    datePublished: (page as any).createdAt || page.lastUpdated || '2026-08-09T00:00:00Z',
    dateModified: (page as any).updatedAt || page.lastUpdated || new Date().toISOString(),
    articleSection: page.category,
    keywords: [page.category, page.title, ...(page.tags || [])].join(', '),
  };
}

/**
 * Generates JSON-LD Site Search & WebSite Schema
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Aetheria Minecraft Addon Wiki',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}
