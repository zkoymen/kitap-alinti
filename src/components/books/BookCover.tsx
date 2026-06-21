import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookCoverProps {
  title: string;
  author?: string;
  size?: "sm" | "lg";
}

export function BookCover({ title, author, size = "sm" }: BookCoverProps) {
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={cn(
        "relative flex shrink-0 flex-col justify-between overflow-hidden rounded-md border bg-[#dfeee4] p-3 text-[#121c2c] shadow-soft",
        size === "sm" ? "h-24 w-16" : "h-52 w-36 p-4"
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-y-0 left-0 w-2 bg-primary/80" />
      <BookOpen className={cn("ml-auto opacity-60", size === "sm" ? "h-4 w-4" : "h-6 w-6")} />
      <div>
        <p className={cn("font-bold leading-tight", size === "sm" ? "text-base" : "text-3xl")}>
          {initials || "B"}
        </p>
        {size === "lg" && <p className="mt-2 line-clamp-3 text-xs font-semibold uppercase">{title}</p>}
      </div>
      {size === "lg" && author && <p className="line-clamp-1 text-[11px] text-[#454653]">{author}</p>}
    </div>
  );
}
