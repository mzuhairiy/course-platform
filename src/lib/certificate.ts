// Client-safe certificate helpers (no "server-only"): pure formatting/derivation
// shared by the certificate service and tested in isolation.

export const CERTIFICATE_NUMBER_PREFIX = "CERT";

// Unambiguous alphabet for the random code (no 0/O/1/I) so a printed
// certificate number is easy to read back.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CERTIFICATE_CODE_LENGTH = 5;

/**
 * Build a certificate number: `CERT-{YYYY}-{XXXXX}`. The year and 5-char code
 * are supplied by the caller so this stays pure (the service provides the
 * issue year + a random code, then persists the result for reuse).
 */
export function formatCertificateNumber(year: number, code: string): string {
  return `${CERTIFICATE_NUMBER_PREFIX}-${year}-${code}`;
}

/** Generate a random N-char code from the unambiguous alphabet. */
export function generateCertificateCode(
  length = CERTIFICATE_CODE_LENGTH,
  randomInt: (max: number) => number = (max) => Math.floor(Math.random() * max),
): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * Deterministic signature initials from an instructor's name: the first letter
 * of every word, uppercased. "Andi Pratama" → "AP", "Budi" → "B",
 * "Sri Mulyani Indrawati" → "SMI". Returns "" for an empty/missing name.
 */
export function signatureInitials(name?: string | null): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .join("")
    .toUpperCase();
}
