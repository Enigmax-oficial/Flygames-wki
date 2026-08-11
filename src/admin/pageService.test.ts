import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import fs from 'fs/promises';
import { PageService, slugify } from './pageService.js';
import { ValidationError, PageAlreadyExistsError, PageNotFoundError } from './errors.js';

jest.mock('fs/promises');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('slugify', () => {
  it('converts titles to url-safe slugs', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
    expect(slugify('  New   Admin   Page  ')).toBe('new-admin-page');
    expect(slugify('TypeScript & Node.js 100%')).toBe('typescript-nodejs-100');
  });
});

describe('PageService', () => {
  let service: PageService;
  const testPagesDir = '/mock/data/pages';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PageService(testPagesDir);
  });

  describe('createPage', () => {
    it('creates a page and writes JSON file to disk', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined as never);
      mockedFs.access.mockRejectedValue(new Error('ENOENT') as never);
      mockedFs.writeFile.mockResolvedValue(undefined as never);

      const page = await service.createPage({
        title: 'Welcome Guide',
        content: '# Hello World',
      });

      expect(page).toBeDefined();
      expect(page.id).toBeDefined();
      expect(page.title).toBe('Welcome Guide');
      expect(page.slug).toBe('welcome-guide');
      expect(page.content).toBe('# Hello World');
      expect(new Date(page.createdAt).getTime()).not.toBeNaN();
      expect(new Date(page.updatedAt).getTime()).not.toBeNaN();

      expect(mockedFs.mkdir).toHaveBeenCalledWith(testPagesDir, { recursive: true });
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        '/mock/data/pages/welcome-guide.json',
        expect.stringContaining('"title": "Welcome Guide"'),
        'utf-8'
      );
    });

    it('throws ValidationError if title is missing or empty', async () => {
      await expect(service.createPage({ title: '   ' })).rejects.toThrow(ValidationError);
      await expect(service.createPage({ title: '' } as any)).rejects.toThrow(ValidationError);
    });

    it('throws PageAlreadyExistsError if slug file already exists', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined as never);
      mockedFs.access.mockResolvedValue(undefined as never); // File exists

      await expect(
        service.createPage({
          title: 'Existing Page',
          slug: 'existing-page',
        })
      ).rejects.toThrow(PageAlreadyExistsError);
    });
  });

  describe('getPage', () => {
    it('returns parsed page if file exists', async () => {
      const mockPage = {
        id: '1234-uuid',
        title: 'About Us',
        slug: 'about-us',
        content: 'About company',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      mockedFs.readFile.mockResolvedValue(JSON.stringify(mockPage) as never);

      const page = await service.getPage('about-us');

      expect(page).toEqual(mockPage);
      expect(mockedFs.readFile).toHaveBeenCalledWith('/mock/data/pages/about-us.json', 'utf-8');
    });

    it('returns null if file does not exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockedFs.readFile.mockRejectedValue(error as never);

      const page = await service.getPage('non-existent');

      expect(page).toBeNull();
    });
  });

  describe('listPages', () => {
    it('returns array of pages from directory', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined as never);
      mockedFs.readdir.mockResolvedValue(['page1.json', 'page2.json'] as never);

      const page1 = { id: '1', title: 'P1', slug: 'p1', content: '', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
      const page2 = { id: '2', title: 'P2', slug: 'p2', content: '', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' };

      mockedFs.readFile
        .mockResolvedValueOnce(JSON.stringify(page1) as never)
        .mockResolvedValueOnce(JSON.stringify(page2) as never);

      const pages = await service.listPages();

      expect(pages).toHaveLength(2);
      expect(pages[0].slug).toBe('p2'); // Newer page first
      expect(pages[1].slug).toBe('p1');
    });
  });

  describe('updatePage', () => {
    it('updates existing page content and writes file', async () => {
      const existingPage = {
        id: '1234-uuid',
        title: 'Original Title',
        slug: 'original-title',
        content: 'Original Content',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      mockedFs.readFile.mockResolvedValue(JSON.stringify(existingPage) as never);
      mockedFs.mkdir.mockResolvedValue(undefined as never);
      mockedFs.writeFile.mockResolvedValue(undefined as never);

      const updated = await service.updatePage('original-title', {
        content: 'Updated Content',
      });

      expect(updated.content).toBe('Updated Content');
      expect(updated.updatedAt).not.toBe(existingPage.updatedAt);
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        '/mock/data/pages/original-title.json',
        expect.stringContaining('"content": "Updated Content"'),
        'utf-8'
      );
    });

    it('throws PageNotFoundError if page to update does not exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockedFs.readFile.mockRejectedValue(error as never);

      await expect(
        service.updatePage('missing-slug', { content: 'test' })
      ).rejects.toThrow(PageNotFoundError);
    });
  });

  describe('deletePage', () => {
    it('deletes page file from disk', async () => {
      mockedFs.unlink.mockResolvedValue(undefined as never);

      await service.deletePage('some-page');

      expect(mockedFs.unlink).toHaveBeenCalledWith('/mock/data/pages/some-page.json');
    });

    it('throws PageNotFoundError if page file does not exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockedFs.unlink.mockRejectedValue(error as never);

      await expect(service.deletePage('non-existent')).rejects.toThrow(PageNotFoundError);
    });
  });
});
