import { Edit3, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { BookCover } from "@/components/books/BookCover";
import { BookFormDialog } from "@/components/books/BookFormDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createBook,
  deleteBook,
  listBooksWithCounts,
  updateBook
} from "@/db/repositories";
import { relativeDate } from "@/lib/dates";
import type { Book, BookWithCount } from "@/types";

export function BooksPage() {
  const [books, setBooks] = useState<BookWithCount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<BookWithCount | null>(null);

  async function loadBooks() {
    setLoading(true);
    try {
      setBooks(await listBooksWithCounts(search));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Books could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBooks();
  }, [search]);

  function openNewBook() {
    setEditingBook(null);
    setFormOpen(true);
  }

  async function handleSaveBook(input: { title: string; author?: string }) {
    setBusy(true);
    try {
      if (editingBook) {
        await updateBook(editingBook.id, input);
        toast.success("Book updated.");
      } else {
        await createBook(input);
        toast.success("Book created.");
      }

      setFormOpen(false);
      await loadBooks();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Book could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteBook() {
    if (!deletingBook) return;

    setBusy(true);
    try {
      await deleteBook(deletingBook.id);
      toast.success("Book deleted.");
      setDeletingBook(null);
      await loadBooks();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Book could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Library
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Your books</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Manage your collection and highlighted passages.
            </p>
          </div>
          <Button onClick={openNewBook} className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New book
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, author, quote or tag"
            className="pl-10"
            aria-label="Search books and quotes"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-lg border bg-card" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold">{search ? "No matches" : "No books yet"}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
              {search
                ? "Try another search term across titles, authors, quotes, notes or tags."
                : "Create your first book and start collecting passages."}
            </p>
            {!search && (
              <Button onClick={openNewBook} className="mt-5">
                <Plus className="h-4 w-4" aria-hidden="true" />
                New book
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y rounded-lg border bg-card">
            {books.map((book) => (
              <article key={book.id} className="group flex gap-5 p-4 transition-colors hover:bg-muted">
                <Link to={`/books/${book.id}`} className="flex min-w-0 flex-1 gap-5">
                  <BookCover title={book.title} author={book.author} />
                  <div className="min-w-0 flex-1 py-1">
                    <h2 className="truncate text-xl font-semibold">{book.title}</h2>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{book.author || "Unknown author"}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{book.quoteCount} passages</Badge>
                      <span>{relativeDate(book.updatedAt)}</span>
                    </div>
                  </div>
                </Link>
                <div className="flex flex-col items-end gap-2 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${book.title}`}
                    onClick={() => {
                      setEditingBook(book);
                      setFormOpen(true);
                    }}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${book.title}`}
                    onClick={() => setDeletingBook(book)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <MoreHorizontal className="hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden="true" />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Button
        onClick={openNewBook}
        className="fixed bottom-20 right-5 z-40 h-14 w-14 rounded-full shadow-soft sm:hidden"
        size="icon"
        aria-label="New book"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <BookFormDialog
        open={formOpen}
        book={editingBook}
        busy={busy}
        onOpenChange={setFormOpen}
        onSubmit={handleSaveBook}
      />
      <ConfirmDialog
        open={Boolean(deletingBook)}
        onOpenChange={(open) => !open && setDeletingBook(null)}
        title="Delete this book?"
        description={`This will delete "${deletingBook?.title ?? "this book"}" and all quotes saved under it.`}
        confirmLabel="Delete book"
        destructive
        busy={busy}
        onConfirm={handleDeleteBook}
      />
    </>
  );
}
