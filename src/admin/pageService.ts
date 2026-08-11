import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Page, CreatePageInput, UpdatePageInput } from './types.js';
import { ValidationError, PageAlreadyExistsError, PageNotFoundError } from './errors.js';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove invalid chars
    .replace(/\s+/g, '-')         // replace spaces with hyphens
    .replace(/-+/g, '-')          // collapse multiple hyphens
    .replace(/^-+|-+$/g, '');     // strip leading/trailing hyphens
}

export class PageService {
  private pagesDir: string;

  constructor(pagesDir?: string) {
    this.pagesDir = pagesDir || path.join(process.cwd(), 'data', 'pages');
  }

  private async ensurePagesDir(): Promise<void> {
    await fs.mkdir(this.pagesDir, { recursive: true });
  }

  private getFilePath(slug: string): string {
    return path.join(this.pagesDir, `${slug}.json`);
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async createPage(data: CreatePageInput): Promise<Page> {
    if (!data || typeof data.title !== 'string' || !data.title.trim()) {
      throw new ValidationError('Title is required and cannot be empty.');
    }

    const title = data.title.trim();
    const rawSlug = data.slug && data.slug.trim() ? data.slug.trim() : title;
    const slug = slugify(rawSlug);

    if (!slug) {
      throw new ValidationError('Generated slug is invalid or empty.');
    }

    await this.ensurePagesDir();
    const filePath = this.getFilePath(slug);

    if (await this.fileExists(filePath)) {
      throw new PageAlreadyExistsError(`Page with slug '${slug}' already exists.`);
    }

    const now = new Date().toISOString();
    const page: Page = {
      id: crypto.randomUUID(),
      title,
      slug,
      content: data.content ?? '',
      createdAt: now,
      updatedAt: now,
    };

    await fs.writeFile(filePath, JSON.stringify(page, null, 2), 'utf-8');
    return page;
  }

  async getPage(slug: string): Promise<Page | null> {
    if (!slug || !slug.trim()) {
      return null;
    }

    const normalizedSlug = slugify(slug);
    const filePath = this.getFilePath(normalizedSlug);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as Page;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }

  async listPages(): Promise<Page[]> {
    await this.ensurePagesDir();

    try {
      const files = await fs.readdir(this.pagesDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      const pages = await Promise.all(
        jsonFiles.map(async file => {
          try {
            const filePath = path.join(this.pagesDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content) as Page;
          } catch {
            return null;
          }
        })
      );

      return pages
        .filter((page): page is Page => page !== null)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  }

  async updatePage(slug: string, data: UpdatePageInput): Promise<Page> {
    const existingPage = await this.getPage(slug);
    if (!existingPage) {
      throw new PageNotFoundError(`Page with slug '${slug}' not found.`);
    }

    const oldSlug = existingPage.slug;
    let newSlug = oldSlug;

    if (data.slug && data.slug.trim()) {
      newSlug = slugify(data.slug.trim());
      if (!newSlug) {
        throw new ValidationError('New slug is invalid or empty.');
      }
    } else if (data.title && data.title.trim() && !data.slug) {
      // If title changed but slug was not explicitly provided, update slug
      newSlug = slugify(data.title.trim());
    }

    if (newSlug !== oldSlug) {
      const newFilePath = this.getFilePath(newSlug);
      if (await this.fileExists(newFilePath)) {
        throw new PageAlreadyExistsError(`Page with slug '${newSlug}' already exists.`);
      }
    }

    const now = new Date().toISOString();
    const updatedPage: Page = {
      ...existingPage,
      title: data.title !== undefined ? data.title.trim() : existingPage.title,
      slug: newSlug,
      content: data.content !== undefined ? data.content : existingPage.content,
      updatedAt: now,
    };

    if (!updatedPage.title) {
      throw new ValidationError('Title cannot be updated to an empty value.');
    }

    await this.ensurePagesDir();

    if (newSlug !== oldSlug) {
      const oldFilePath = this.getFilePath(oldSlug);
      try {
        await fs.unlink(oldFilePath);
      } catch {
        // Ignore if old file doesn't exist
      }
    }

    const targetFilePath = this.getFilePath(newSlug);
    await fs.writeFile(targetFilePath, JSON.stringify(updatedPage, null, 2), 'utf-8');

    return updatedPage;
  }

  async deletePage(slug: string): Promise<void> {
    const normalizedSlug = slugify(slug);
    const filePath = this.getFilePath(normalizedSlug);

    try {
      await fs.unlink(filePath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new PageNotFoundError(`Page with slug '${slug}' not found.`);
      }
      throw err;
    }
  }
}

export const defaultPageService = new PageService();
