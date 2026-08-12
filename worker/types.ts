import { D1Database } from '@cloudflare/workers-types';

export interface Env {
  mysql: D1Database;
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
