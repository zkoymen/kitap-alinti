import { db } from "@/db/db";
import { nowIso } from "@/lib/dates";
import { normalizeSearch } from "@/lib/utils";
import type { AppMeta, Book, BookWithCount, Quote } from "@/types";

export async function listBooksWithCounts(search = ""): Promise<BookWithCount[]> {
  const [books, quotes] = await Promise.all([
    db.books.orderBy("updatedAt").reverse().toArray(),
    db.quotes.toArray()
  ]);

  const counts = new Map<string, number>();
  for (const quote of quotes) {
    counts.set(quote.bookId, (counts.get(quote.bookId) ?? 0) + 1);
  }

  const query = normalizeSearch(search);
  const matchingBookIds = new Set<string>();

  if (query) {
    for (const quote of quotes) {
      const quoteText = [quote.text, quote.note, quote.page, ...(quote.tags ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();

      if (quoteText.includes(query)) {
        matchingBookIds.add(quote.bookId);
      }
    }
  }

  return books
    .filter((book) => {
      if (!query) return true;

      const bookText = [book.title, book.author].filter(Boolean).join(" ").toLocaleLowerCase();
      return bookText.includes(query) || matchingBookIds.has(book.id);
    })
    .map((book) => ({
      ...book,
      quoteCount: counts.get(book.id) ?? 0
    }));
}

export async function getBook(bookId: string) {
  return db.books.get(bookId);
}

export async function createBook(input: Pick<Book, "title" | "author">) {
  const now = nowIso();
  const book: Book = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    author: input.author?.trim() || undefined,
    createdAt: now,
    updatedAt: now
  };

  await db.books.add(book);
  return book;
}

export async function updateBook(
  bookId: string,
  input: Pick<Book, "title" | "author">
) {
  const updatedAt = nowIso();
  await db.books.update(bookId, {
    title: input.title.trim(),
    author: input.author?.trim() || undefined,
    updatedAt
  });

  return db.books.get(bookId);
}

export async function deleteBook(bookId: string) {
  await db.transaction("rw", db.books, db.quotes, async () => {
    await db.quotes.where("bookId").equals(bookId).delete();
    await db.books.delete(bookId);
  });
}

export async function listQuotesForBook(bookId: string) {
  const quotes = await db.quotes.where("bookId").equals(bookId).toArray();
  return quotes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createQuote(
  input: Pick<Quote, "bookId" | "text" | "note" | "page" | "tags">
) {
  const now = nowIso();
  const quote: Quote = {
    id: crypto.randomUUID(),
    bookId: input.bookId,
    text: input.text.trim(),
    note: input.note?.trim() || undefined,
    page: input.page?.trim() || undefined,
    tags: input.tags?.filter(Boolean),
    createdAt: now,
    updatedAt: now
  };

  await db.transaction("rw", db.quotes, db.books, async () => {
    await db.quotes.add(quote);
    await db.books.update(input.bookId, { updatedAt: now });
  });

  return quote;
}

export async function updateQuote(
  quoteId: string,
  input: Pick<Quote, "text" | "note" | "page" | "tags">
) {
  const quote = await db.quotes.get(quoteId);
  if (!quote) throw new Error("Quote not found.");

  const now = nowIso();
  await db.transaction("rw", db.quotes, db.books, async () => {
    await db.quotes.update(quoteId, {
      text: input.text.trim(),
      note: input.note?.trim() || undefined,
      page: input.page?.trim() || undefined,
      tags: input.tags?.filter(Boolean),
      updatedAt: now
    });
    await db.books.update(quote.bookId, { updatedAt: now });
  });
}

export async function deleteQuote(quoteId: string) {
  const quote = await db.quotes.get(quoteId);
  if (!quote) return;

  await db.transaction("rw", db.quotes, db.books, async () => {
    await db.quotes.delete(quoteId);
    await db.books.update(quote.bookId, { updatedAt: nowIso() });
  });
}

export async function getMeta<T = unknown>(key: string): Promise<T | undefined> {
  const item = await db.meta.get(key);
  return item?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown) {
  const item: AppMeta = { key, value };
  await db.meta.put(item);
}

export async function getLocalStats() {
  const [bookCount, quoteCount, storage] = await Promise.all([
    db.books.count(),
    db.quotes.count(),
    navigator.storage?.estimate?.()
  ]);

  return {
    bookCount,
    quoteCount,
    usage: storage?.usage ?? 0,
    quota: storage?.quota ?? 0
  };
}
