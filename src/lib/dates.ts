export function nowIso() {
  return new Date().toISOString();
}

export function formatShortDate(value?: string) {
  if (!value) return "Never";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(date);
}

export function formatDateTime(value?: string) {
  if (!value) return "Never";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function relativeDate(value?: string) {
  if (!value) return "Never";

  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const day = 1000 * 60 * 60 * 24;

  if (Number.isNaN(date.getTime())) return "Unknown";
  if (diff < day) return "Today";
  if (diff < day * 2) return "Yesterday";
  if (diff < day * 7) return `${Math.floor(diff / day)} days ago`;

  return formatShortDate(value);
}
