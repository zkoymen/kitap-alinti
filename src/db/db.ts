import Dexie, { type Table } from "dexie";
import type { AppMeta, Book, Quote } from "@/types";

export class ReadingNotesDatabase extends Dexie {
  books!: Table<Book, string>;
  quotes!: Table<Quote, string>;
  meta!: Table<AppMeta, string>;

  constructor() {
    super("reading-notes");

    this.version(1).stores({
      books: "&id, title, author, createdAt, updatedAt",
      quotes: "&id, bookId, createdAt, updatedAt, *tags",
      meta: "&key"
    });
  }
}

export const db = new ReadingNotesDatabase();
