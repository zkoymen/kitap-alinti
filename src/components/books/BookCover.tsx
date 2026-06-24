import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookCoverProps {
  title?: string;
  author?: string;
  size?: "sm" | "lg";
}

export function BookCover({ title, author, size = "sm" }: BookCoverProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 flex-col justify-between overflow-hidden rounded-md border border-[#F4C0D1] bg-[#FBEAF0] p-3 text-[#3C2030] shadow-[0_10px_24px_rgba(153,53,86,0.12)]",
        size === "sm" ? "h-24 w-16" : "h-52 w-36 p-4"
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-y-0 left-0 w-2 bg-primary/85" />
      <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(circle_at_18px_18px,rgba(212,83,126,0.36)_1.4px,transparent_1.6px)] [background-size:18px_18px]" />
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/45" />
      <div className="absolute bottom-3 left-4 right-4 h-px bg-[#D4537E]/20" />
      <div className="absolute bottom-6 left-4 right-6 h-px bg-[#D4537E]/15" />
      <div className="relative flex flex-1 items-center justify-center">
        <div className={cn("flex items-center justify-center rounded-full bg-white/75 text-primary shadow-soft", size === "sm" ? "h-10 w-10" : "h-16 w-16")}>
          <BookOpen className={cn(size === "sm" ? "h-5 w-5" : "h-8 w-8")} />
        </div>
      </div>
      {size === "lg" && title && (
        <div className="relative space-y-1">
          <p className="line-clamp-3 text-xs font-semibold uppercase leading-5 text-[#3C2030]">{title}</p>
          {author && <p className="line-clamp-1 text-[11px] text-[#8B6F5E]">{author}</p>}
        </div>
      )}
    </div>
  );
}
