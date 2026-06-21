import { ArrowLeft, Edit3, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { BookCover } from "@/components/books/BookCover";
import { QuoteFormDialog } from "@/components/quotes/QuoteFormDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createQuote,
  deleteQuote,
  getBook,
  listQuotesForBook,
  updateQuote
} from "@/db/repositories";
import { formatShortDate, relativeDate } from "@/lib/dates";
import type { Book, Quote } from "@/types";

export function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<Quote | null>(null);

  async function loadDetail() {
    if (!bookId) return;

    setLoading(true);
    try {
      const [bookRecord, quoteRecords] = await Promise.all([
        getBook(bookId),
        listQuotesForBook(bookId)
      ]);
      setBook(bookRecord ?? null);
      setQuotes(quoteRecords);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Book could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDetail();
  }, [bookId]);

  function openNewQuote() {
    setEditingQuote(null);
    setFormOpen(true);
  }

  async function handleSaveQuote(input: { text: string; note?: string; page?: string; tags?: string[] }) {
    if (!bookId) return;

    setBusy(true);
    try {
      if (editingQuote) {
        await updateQuote(editingQuote.id, input);
        toast.success("Quote updated.");
      } else {
        await createQuote({ bookId, ...input });
        toast.success("Quote saved.");
      }

      setFormOpen(false);
      await loadDetail();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Quote could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteQuote() {
    if (!deletingQuote) return;

    setBusy(true);
    try {
      await deleteQuote(deletingQuote.id);
      toast.success("Quote deleted.");
      setDeletingQuote(null);
      await loadDetail();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Quote could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="mx-auto h-96 max-w-2xl animate-pulse rounded-lg border bg-card" />;
  }

  if (!book) {
    return (
      <section className="mx-auto max-w-2xl rounded-lg border bg-card p-8 text-center">
        <h1 className="text-2xl font-semibold">Book not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This book may have been deleted.</p>
        <Button className="mt-5" onClick={() => navigate("/books")}>
          Back to books
        </Button>
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="-ml-3">
            <Link to="/books">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Link>
          </Button>
        </div>

        <header className="mb-8 flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
          <BookCover title={book.title} author={book.author} size="lg" />
          <div className="min-w-0 flex-1 pt-2">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Reading log
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{book.title}</h1>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {book.author || "Unknown author"}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
              <Badge variant="secondary">{quotes.length} entries</Badge>
              <span>Updated {relativeDate(book.updatedAt)}</span>
            </div>
          </div>
        </header>

        <div className="mb-8">
          <Button onClick={openNewQuote} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add entry
          </Button>
        </div>

        <div className="border-t">
          <div className="py-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
              Passages
            </h2>
          </div>

          {quotes.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <h3 className="text-xl font-semibold">No quotes yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
                Capture a passage, page number, tags and your reflection for this book.
              </p>
              <Button onClick={openNewQuote} className="mt-5">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add entry
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {quotes.map((quote) => (
                <article key={quote.id} className="group py-8">
                  <div className="mb-5 flex items-baseline justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        {quote.page ? `Page ${quote.page}` : "No page"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatShortDate(quote.createdAt)}</span>
                  </div>
                  <blockquote className="notebook-lines font-serif text-lg italic leading-8">
                    "{quote.text}"
                  </blockquote>
                  {quote.note && (
                    <div className="mt-5 border-l-2 border-primary bg-muted p-4 text-sm leading-7 text-muted-foreground">
                      {quote.note}
                    </div>
                  )}
                  <div className="mt-5 flex items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      {quote.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="uppercase">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit quote"
                        onClick={() => {
                          setEditingQuote(quote);
                          setFormOpen(true);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete quote"
                        onClick={() => setDeletingQuote(quote)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <QuoteFormDialog
        open={formOpen}
        quote={editingQuote}
        bookTitle={book.title}
        busy={busy}
        onOpenChange={setFormOpen}
        onSubmit={handleSaveQuote}
      />
      <ConfirmDialog
        open={Boolean(deletingQuote)}
        onOpenChange={(open) => !open && setDeletingQuote(null)}
        title="Delete this quote?"
        description="This removes the quote and its note from local storage."
        confirmLabel="Delete quote"
        destructive
        busy={busy}
        onConfirm={handleDeleteQuote}
      />
    </>
  );
}
