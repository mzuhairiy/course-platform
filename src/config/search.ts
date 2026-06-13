/** Debounce for live search input. Fixed (not random) so automation can rely on it. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Minimum keystrokes before the live search fires. */
export const SEARCH_MIN_QUERY_LENGTH = 2;

/** Max results shown in the search suggestions dropdown. */
export const SEARCH_MAX_RESULTS = 6;

/** Max accepted search query length (input cap + URL param parsing). */
export const SEARCH_MAX_QUERY_LENGTH = 100;
