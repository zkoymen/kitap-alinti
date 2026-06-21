import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function tagsToInput(tags?: string[]) {
  return tags?.join(", ") ?? "";
}
