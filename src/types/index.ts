export interface Book {
  id: string;
  title: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  bookId: string;
  text: string;
  note?: string;
  page?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppMeta {
  key: string;
  value: unknown;
}

export interface BookWithCount extends Book {
  quoteCount: number;
}

export interface BackupExport {
  version: 1;
  exportedAt: string;
  books: Book[];
  quotes: Quote[];
  meta: Record<string, unknown>;
}
