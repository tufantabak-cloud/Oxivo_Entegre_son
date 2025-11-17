/**
 * Global Search Engine
 * Fuzzy search with scoring and categorization
 */

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'Müşteri' | 'Banka/PF' | 'Ürün' | 'TABELA' | 'Hakediş' | 'Satış Temsilcisi';
  score: number;
  metadata?: Record<string, any>;
  moduleLink: string; // Which module to navigate to
}

interface SearchableItem {
  id: string;
  searchableText: string;
  category: SearchResult['category'];
  title: string;
  subtitle: string;
  metadata?: Record<string, any>;
  moduleLink: string;
}

/**
 * Simple fuzzy search implementation
 * Scores based on:
 * - Exact match (highest score)
 * - Start of word match
 * - Contains match
 * - Fuzzy character match
 */
export function fuzzySearch(query: string, text: string): number {
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedText = text.toLowerCase();

  // Empty query matches everything with low score
  if (!normalizedQuery) return 0;

  // Exact match
  if (normalizedText === normalizedQuery) return 100;

  // Contains exact match
  if (normalizedText.includes(normalizedQuery)) {
    // Bonus if it's at the start
    if (normalizedText.startsWith(normalizedQuery)) return 90;
    return 70;
  }

  // Word boundary match
  const words = normalizedText.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(normalizedQuery)) return 60;
    if (word.includes(normalizedQuery)) return 50;
  }

  // Fuzzy character-by-character match
  let queryIndex = 0;
  let textIndex = 0;
  let matchCount = 0;

  while (queryIndex < normalizedQuery.length && textIndex < normalizedText.length) {
    if (normalizedQuery[queryIndex] === normalizedText[textIndex]) {
      matchCount++;
      queryIndex++;
    }
    textIndex++;
  }

  // If all query characters found in order
  if (queryIndex === normalizedQuery.length) {
    const matchPercentage = (matchCount / normalizedQuery.length) * 100;
    return Math.min(40, matchPercentage * 0.4); // Max 40 for fuzzy match
  }

  return 0;
}

/**
 * Search across all items
 */
export function performSearch(
  query: string,
  items: SearchableItem[],
  minScore: number = 10
): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];

  for (const item of items) {
    const score = fuzzySearch(query, item.searchableText);

    if (score >= minScore) {
      results.push({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        category: item.category,
        score,
        metadata: item.metadata,
        moduleLink: item.moduleLink,
      });
    }
  }

  // Sort by score (descending), then by title
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Null/undefined check for title
    const titleA = a.title || '';
    const titleB = b.title || '';
    return titleA.localeCompare(titleB, 'tr');
  });

  return results;
}

/**
 * Group results by category
 */
export function groupResultsByCategory(results: SearchResult[]): Map<string, SearchResult[]> {
  const grouped = new Map<string, SearchResult[]>();

  for (const result of results) {
    const existing = grouped.get(result.category) || [];
    existing.push(result);
    grouped.set(result.category, existing);
  }

  return grouped;
}

/**
 * Highlight matching text in a string
 */
export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;

  const normalizedQuery = query.toLowerCase().trim();
  const index = text.toLowerCase().indexOf(normalizedQuery);

  if (index === -1) return text;

  return (
    text.substring(0, index) +
    '<mark class="bg-yellow-200 text-gray-900 rounded px-0.5">' +
    text.substring(index, index + query.length) +
    '</mark>' +
    text.substring(index + query.length)
  );
}

/**
 * Save search history to localStorage
 */
export function saveSearchHistory(query: string): void {
  if (!query.trim()) return;

  const STORAGE_KEY = 'global_search_history';
  const MAX_HISTORY = 10;

  try {
    const historyJson = localStorage.getItem(STORAGE_KEY);
    const history: string[] = historyJson ? JSON.parse(historyJson) : [];

    // Remove duplicate if exists
    const filtered = history.filter(h => h.toLowerCase() !== query.toLowerCase());

    // Add to front
    filtered.unshift(query.trim());

    // Keep only last MAX_HISTORY items
    const trimmed = filtered.slice(0, MAX_HISTORY);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
}

/**
 * Get search history from localStorage
 */
export function getSearchHistory(): string[] {
  const STORAGE_KEY = 'global_search_history';

  try {
    const historyJson = localStorage.getItem(STORAGE_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Failed to load search history:', error);
    return [];
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
  const STORAGE_KEY = 'global_search_history';
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
}
