// Client-safe progress constants (no "server-only"), shared by the progress
// service and the video player UI so the completion rule stays in one place.

// A lecture is completed once ≥90% is watched (or the video fires 'ended').
// Deterministic threshold — never randomized — so completion is reproducible.
export const COMPLETION_THRESHOLD = 0.9;
