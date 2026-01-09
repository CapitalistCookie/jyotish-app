import { BirthChart } from '../astrology/types.js';
import {
  SYSTEM_PROMPT,
  READING_CATEGORIES,
  getCategoryPrompt,
  getChatPrompt,
} from './prompts.js';
import type { ReadingCategory } from './prompts.js';
import {
  getProviderManager,
  resetProviderManager,
  AIProviderManager,
} from './providers/index.js';

// Re-export reading category
export { READING_CATEGORIES } from './prompts.js';
export type { ReadingCategory } from './prompts.js';

// In-memory cache for readings
const readingCache = new Map<string, CachedReading>();

interface CachedReading {
  content: string;
  createdAt: Date;
  category: ReadingCategory;
  provider: string;
}

/**
 * Generate a cache key for a reading
 */
function getCacheKey(chartId: string, category: ReadingCategory): string {
  return `${chartId}:${category}`;
}

/**
 * Check if a category is valid
 */
export function isValidCategory(category: string): category is ReadingCategory {
  return READING_CATEGORIES.includes(category as ReadingCategory);
}

/**
 * Get a cached reading if it exists
 */
export function getCachedReading(chartId: string, category: ReadingCategory): CachedReading | null {
  const key = getCacheKey(chartId, category);
  return readingCache.get(key) || null;
}

/**
 * Store a reading in the cache
 */
function cacheReading(chartId: string, category: ReadingCategory, content: string, provider: string): void {
  const key = getCacheKey(chartId, category);
  readingCache.set(key, {
    content,
    createdAt: new Date(),
    category,
    provider,
  });
}

/**
 * Get the provider manager instance
 */
function getManager(): AIProviderManager {
  return getProviderManager();
}

/**
 * Get list of available AI providers
 */
export function getAvailableProviders(): string[] {
  return getManager().getAvailableProviderNames();
}

/**
 * Get provider info with availability and model details
 */
export function getProviderInfo(): Array<{ name: string; available: boolean; model: string }> {
  return getManager().getProviderInfo();
}

/**
 * Get the default provider name
 */
export function getDefaultProvider(): string {
  return getManager().getDefaultProviderName();
}

/**
 * Generate a reading for a specific category
 * @param preferredProvider - If specified, try this provider first before falling back
 */
export async function generateReading(
  chart: BirthChart,
  category: ReadingCategory,
  useCache: boolean = true,
  preferredProvider?: string
): Promise<{ content: string; cached: boolean; provider?: string }> {
  // Check cache first
  if (useCache) {
    const cached = getCachedReading(chart.id, category);
    if (cached) {
      return { content: cached.content, cached: true, provider: cached.provider };
    }
  }

  // Generate new reading using provider manager (with automatic fallback)
  const prompt = getCategoryPrompt(chart, category);

  try {
    const { content, provider } = await getManager().generateReading(
      chart,
      category,
      SYSTEM_PROMPT,
      prompt,
      preferredProvider
    );

    // Cache the reading
    cacheReading(chart.id, category, content, provider);

    return { content, cached: false, provider };
  } catch (error) {
    console.error('Error generating reading:', error);
    throw new Error('Failed to generate astrological reading. Please try again later.');
  }
}

/**
 * Handle a follow-up chat question about a chart
 * @param preferredProvider - If specified, try this provider first before falling back
 */
export async function handleChatQuestion(
  chart: BirthChart,
  question: string,
  previousReadings: string[] = [],
  preferredProvider?: string
): Promise<{ content: string; provider: string }> {
  const prompt = getChatPrompt(chart, previousReadings, question);

  try {
    const { content, provider } = await getManager().chat(
      chart,
      SYSTEM_PROMPT,
      prompt,
      preferredProvider
    );

    return { content, provider };
  } catch (error) {
    console.error('Error handling chat question:', error);
    throw new Error('Failed to process your question. Please try again later.');
  }
}

/**
 * Generate a streaming reading (for real-time display)
 * @param preferredProvider - If specified, try this provider first before falling back
 */
export async function* generateReadingStream(
  chart: BirthChart,
  category: ReadingCategory,
  preferredProvider?: string
): AsyncGenerator<string, void, unknown> {
  const prompt = getCategoryPrompt(chart, category);

  try {
    let fullContent = '';
    let providerName = '';

    const stream = getManager().streamReading(
      chart,
      category,
      SYSTEM_PROMPT,
      prompt,
      preferredProvider
    );

    for await (const text of stream) {
      fullContent += text;
      yield text;
    }

    // Get provider from stream return value
    try {
      const result = await stream.next();
      if (result.done && result.value) {
        providerName = result.value.provider;
      }
    } catch {
      providerName = 'unknown';
    }

    // Cache the complete reading
    cacheReading(chart.id, category, fullContent, providerName);
  } catch (error) {
    console.error('Error streaming reading:', error);
    throw new Error('Failed to stream astrological reading');
  }
}

/**
 * Clear cached readings for a chart (useful if chart is regenerated)
 */
export function clearChartCache(chartId: string): void {
  for (const category of READING_CATEGORIES) {
    const key = getCacheKey(chartId, category);
    readingCache.delete(key);
  }
}

/**
 * Get all cached readings for a chart
 */
export function getAllCachedReadings(chartId: string): Record<ReadingCategory, CachedReading | null> {
  const result: Record<string, CachedReading | null> = {};

  for (const category of READING_CATEGORIES) {
    result[category] = getCachedReading(chartId, category);
  }

  return result as Record<ReadingCategory, CachedReading | null>;
}

/**
 * Reset the AI provider (useful for testing or when config changes)
 */
export function resetAIProvider(): void {
  resetProviderManager();
}
