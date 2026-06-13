import { cn } from "@/lib/utils";

// Tasteful navy/teal/slate/indigo gradients — high contrast against white 3D
// text and on-theme. Index is chosen deterministically from the seed.
const PALETTE: { from: string; to: string }[] = [
  { from: "#0f172a", to: "#1e3a8a" }, // navy → blue
  { from: "#134e4a", to: "#0f766e" }, // teal
  { from: "#1e293b", to: "#475569" }, // slate
  { from: "#312e81", to: "#4338ca" }, // indigo
  { from: "#0c4a6e", to: "#0369a1" }, // deep sky
  { from: "#1e1b4b", to: "#3730a3" }, // deep indigo
  { from: "#083344", to: "#155e75" }, // cyan
  { from: "#172554", to: "#1d4ed8" }, // royal blue
  { from: "#164e63", to: "#0e7490" }, // teal-cyan
  { from: "#1f2937", to: "#374151" }, // graphite
];

// Layered offsets give the white text an extruded, 3D look (CSS only).
const TEXT_3D = [
  "1px 1px 0 rgba(0,0,0,0.35)",
  "2px 2px 0 rgba(0,0,0,0.30)",
  "3px 3px 0 rgba(0,0,0,0.28)",
  "4px 4px 0 rgba(0,0,0,0.24)",
  "5px 5px 0 rgba(0,0,0,0.20)",
  "6px 9px 14px rgba(0,0,0,0.45)",
].join(", ");

/** Deterministic, stable string hash (no Math.random) → non-negative int. */
function hashString(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Auto-fit: shorter labels render larger; longer ones step down and wrap. */
function fontSizeClass(label: string): string {
  const length = label.length;
  if (length <= 5) return "text-5xl md:text-6xl";
  if (length <= 10) return "text-4xl md:text-5xl";
  if (length <= 16) return "text-3xl md:text-4xl";
  return "text-2xl md:text-3xl";
}

/**
 * Generated course cover: a deterministic colored 16:9 area with the course's
 * keyword rendered in extruded 3D text. Same seed (slug) always yields the same
 * color, which keeps it stable for visual regression.
 */
export function CourseCover({
  label,
  seed,
  className,
}: {
  label: string;
  seed: string;
  className?: string;
}) {
  const palette = PALETTE[hashString(seed) % PALETTE.length];

  return (
    <div
      data-testid="course-cover"
      className={cn(
        "relative flex aspect-video w-full items-center justify-center overflow-hidden p-4",
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
      }}
    >
      <span
        className={cn(
          "break-words text-center font-extrabold uppercase leading-tight tracking-tight text-white",
          fontSizeClass(label),
        )}
        style={{ textShadow: TEXT_3D }}
      >
        {label}
      </span>
    </div>
  );
}
