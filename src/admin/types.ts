export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageInput {
  title: string;
  slug?: string;
  content?: string;
}

export interface UpdatePageInput {
  title?: string;
  slug?: string;
  content?: string;
}
