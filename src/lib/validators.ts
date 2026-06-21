import type { BackupExport, Book, Quote } from "@/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

export function isBook(value: unknown): value is Book {
  if (!isRecord(value)) return false;

  return (
    isString(value.id) &&
    isString(value.title) &&
    (value.author === undefined || isString(value.author)) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

export function isQuote(value: unknown): value is Quote {
  if (!isRecord(value)) return false;

  return (
    isString(value.id) &&
    isString(value.bookId) &&
    isString(value.text) &&
    (value.note === undefined || isString(value.note)) &&
    (value.page === undefined || isString(value.page)) &&
    (value.tags === undefined || isStringArray(value.tags)) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

export function validateBackupExport(value: unknown): BackupExport {
  if (!isRecord(value)) {
    throw new Error("The selected file is not a valid backup.");
  }

  if (value.version !== 1) {
    throw new Error("Unsupported backup version.");
  }

  if (!isString(value.exportedAt)) {
    throw new Error("Backup is missing an export date.");
  }

  if (!Array.isArray(value.books) || !value.books.every(isBook)) {
    throw new Error("Backup contains invalid books.");
  }

  if (!Array.isArray(value.quotes) || !value.quotes.every(isQuote)) {
    throw new Error("Backup contains invalid quotes.");
  }

  if (!isRecord(value.meta)) {
    throw new Error("Backup contains invalid metadata.");
  }

  const bookIds = new Set(value.books.map((book) => book.id));
  const orphanQuote = value.quotes.find((quote) => !bookIds.has(quote.bookId));

  if (orphanQuote) {
    throw new Error("Backup contains quotes for missing books.");
  }

  return {
    version: 1,
    exportedAt: value.exportedAt,
    books: value.books,
    quotes: value.quotes,
    meta: value.meta
  };
}
