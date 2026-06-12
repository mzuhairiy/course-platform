const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Formats a Rupiah amount; 0 (or less) renders as "Free". */
export function formatPrice(amount: number): string {
  if (amount <= 0) return "Free";
  return idrFormatter.format(amount);
}

/** Formats a duration in seconds as "Xh Ym" / "Ym" / "Xs". */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

export function formatDate(date: Date | string): string {
  return dateFormatter.format(new Date(date));
}
