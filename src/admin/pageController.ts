import { Request, Response, Router } from 'express';
import { PageService, defaultPageService } from './pageService.js';
import { PageError } from './errors.js';

export class PageController {
  private service: PageService;

  constructor(service: PageService = defaultPageService) {
    this.service = service;
  }

  createPage = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = await this.service.createPage(req.body);
      res.status(201).json(page);
    } catch (err: unknown) {
      if (err instanceof PageError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  getPage = async (req: Request, res: Response): Promise<void> => {
    try {
      const slug = req.params.slug;
      const page = await this.service.getPage(slug);
      if (!page) {
        res.status(404).json({ error: `Page with slug '${slug}' not found` });
        return;
      }
      res.status(200).json(page);
    } catch (err: unknown) {
      if (err instanceof PageError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  listPages = async (_req: Request, res: Response): Promise<void> => {
    try {
      const pages = await this.service.listPages();
      res.status(200).json(pages);
    } catch (err: unknown) {
      if (err instanceof PageError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  updatePage = async (req: Request, res: Response): Promise<void> => {
    try {
      const slug = req.params.slug;
      const updated = await this.service.updatePage(slug, req.body);
      res.status(200).json(updated);
    } catch (err: unknown) {
      if (err instanceof PageError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  deletePage = async (req: Request, res: Response): Promise<void> => {
    try {
      const slug = req.params.slug;
      await this.service.deletePage(slug);
      res.status(204).send();
    } catch (err: unknown) {
      if (err instanceof PageError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  getRouter(): Router {
    const router = Router();
    router.post('/pages', this.createPage);
    router.get('/pages', this.listPages);
    router.get('/pages/:slug', this.getPage);
    router.put('/pages/:slug', this.updatePage);
    router.delete('/pages/:slug', this.deletePage);
    return router;
  }
}

export const createPageRouter = (service?: PageService): Router => {
  const controller = new PageController(service);
  return controller.getRouter();
};
