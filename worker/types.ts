import { D1Database, Fetcher } from '@cloudflare/workers-types';

export interface Env {
  mysql: D1Database;
  ASSETS?: Fetcher;
  JWT_SECRET?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_USERNAMES?: string;
  ADMIN_EMAILS?: string;
  AVATAR_BUCKET?: any;
}

export interface PageRecord {
  id: string;
  title: string;
  slug: string;
  content: string;
  category?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PageInput {
  title?: string;
  slug?: string;
  content?: string;
  category?: string;
  image_url?: string;
  imageUrl?: string;
}
