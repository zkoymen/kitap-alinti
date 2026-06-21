import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Book } from "@/types";

interface BookFormDialogProps {
  open: boolean;
  book?: Book | null;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { title: string; author?: string }) => Promise<void>;
}

export function BookFormDialog({ open, book, busy, onOpenChange, onSubmit }: BookFormDialogProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  useEffect(() => {
    if (!open) return;

    setTitle(book?.title ?? "");
    setAuthor(book?.author ?? "");
  }, [book, open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    await onSubmit({ title, author });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{book ? "Edit book" : "New book"}</DialogTitle>
            <DialogDescription>Save a book so quotes and notes have a home.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-5">
            <label className="grid gap-2 text-sm font-semibold">
              Title
              <Input
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Meditations"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Author
              <Input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="Marcus Aurelius"
              />
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !title.trim()}>
              {busy ? "Saving..." : "Save book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
