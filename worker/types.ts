import { D1Database, Fetcher } from '@cloudflare/workers-types';

export interface Env {
  mysql: D1Database;
  ASSETS?: Fetcher;
}

export interface PageRecord {
  id: string;
  title: string;
  slug: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface PageInput {
  title?: string;
  slug?: string;
  content?: string;
}
