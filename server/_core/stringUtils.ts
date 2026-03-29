/**
 * Normalize strings for comparison and deduplication
 */
export function normalizeTitle(title: string): string {
  if (!title) return "";
  
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/gi, "") // Remove special characters
    .replace(/\s+/g, " ");    // Collapse multiple spaces
}

/**
 * Check if two titles are "close enough" to be considered the same event
 * Use a simple exact matching first, could be expanded to fuzzy later.
 */
export function isSimilarTitle(title1: string, title2: string): boolean {
  return normalizeTitle(title1) === normalizeTitle(title2);
}
