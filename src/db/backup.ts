import { db } from "@/db/db";
import { validateBackupExport } from "@/lib/validators";
import type { BackupExport } from "@/types";

export async function createBackupExport(): Promise<BackupExport> {
  const [books, quotes, metaRows] = await Promise.all([
    db.books.toArray(),
    db.quotes.toArray(),
    db.meta.toArray()
  ]);

  const meta = Object.fromEntries(metaRows.map((item) => [item.key, item.value]));

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    books,
    quotes,
    meta
  };
}

export function downloadBackupJson(data: BackupExport) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `reading-notes-${data.exportedAt.slice(0, 10)}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function parseBackupFile(file: File) {
  const text = await file.text();
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  return validateBackupExport(parsed);
}

export async function replaceLocalData(data: BackupExport) {
  await db.transaction("rw", db.books, db.quotes, db.meta, async () => {
    await Promise.all([db.books.clear(), db.quotes.clear(), db.meta.clear()]);
    await db.books.bulkAdd(data.books);
    await db.quotes.bulkAdd(data.quotes);
    await db.meta.bulkAdd(Object.entries(data.meta).map(([key, value]) => ({ key, value })));
  });
}
