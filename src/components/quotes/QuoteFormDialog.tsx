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
import { Textarea } from "@/components/ui/textarea";
import { parseTags, tagsToInput } from "@/lib/utils";
import type { Quote } from "@/types";

interface QuoteFormDialogProps {
  open: boolean;
  quote?: Quote | null;
  bookTitle: string;
  initialText?: string;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { text: string; note?: string; page?: string; tags?: string[] }) => Promise<void>;
}

export function QuoteFormDialog({
  open,
  quote,
  bookTitle,
  initialText,
  busy,
  onOpenChange,
  onSubmit
}: QuoteFormDialogProps) {
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [page, setPage] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!open) return;

    setText(quote?.text ?? initialText ?? "");
    setNote(quote?.note ?? "");
    setPage(quote?.page ?? "");
    setTags(tagsToInput(quote?.tags));
  }, [open, quote, initialText]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) return;

    await onSubmit({
      text,
      note,
      page,
      tags: parseTags(tags)
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{quote ? "Edit quote" : "Capture quote"}</DialogTitle>
            <DialogDescription>Source: {bookTitle}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-5">
            <label className="grid gap-2 text-sm font-semibold">
              The quote
              <Textarea
                autoFocus
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="What a great thing it is to be a person of one book."
                className="min-h-36 font-serif text-base italic leading-8"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Reflections
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add your note here..."
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Page
                <Input value={page} onChange={(event) => setPage(event.target.value)} placeholder="142" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Tags
                <Input
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="philosophy, focus"
                />
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !text.trim()}>
              {busy ? "Saving..." : "Save quote"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
