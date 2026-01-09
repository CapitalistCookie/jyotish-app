import Anthropic from '@anthropic-ai/sdk';
import { BirthChart } from '../astrology/types.js';
import {
  SYSTEM_PROMPT,
  ReadingCategory,
  READING_CATEGORIES,
  getCategoryPrompt,
  getChatPrompt,
} from './prompts.js';

// Lazy-initialize Anthropic client (to ensure env vars are loaded first)
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// In-memory cache for readings
const readingCache = new Map<string, CachedReading>();

interface CachedReading {
  content: string;
  createdAt: Date;
  category: ReadingCategory;
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
function cacheReading(chartId: string, category: ReadingCategory, content: string): void {
  const key = getCacheKey(chartId, category);
  readingCache.set(key, {
    content,
    createdAt: new Date(),
    category,
  });
}

/**
 * Generate a reading for a specific category
 */
export async function generateReading(
  chart: BirthChart,
  category: ReadingCategory,
  useCache: boolean = true
): Promise<{ content: string; cached: boolean }> {
  // Check cache first
  if (useCache) {
    const cached = getCachedReading(chart.id, category);
    if (cached) {
      return { content: cached.content, cached: true };
    }
  }

  // Generate new reading
  const prompt = getCategoryPrompt(chart, category);

  try {
    const response = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content
    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Cache the reading
    cacheReading(chart.id, category, content);

    return { content, cached: false };
  } catch (error) {
    console.error('Error generating reading:', error);
    throw new Error('Failed to generate astrological reading');
  }
}

/**
 * Handle a follow-up chat question about a chart
 */
export async function handleChatQuestion(
  chart: BirthChart,
  question: string,
  previousReadings: string[] = []
): Promise<string> {
  const prompt = getChatPrompt(chart, previousReadings, question);

  try {
    const response = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content
    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return content;
  } catch (error) {
    console.error('Error handling chat question:', error);
    throw new Error('Failed to process your question');
  }
}

/**
 * Generate a streaming reading (for real-time display)
 */
export async function* generateReadingStream(
  chart: BirthChart,
  category: ReadingCategory
): AsyncGenerator<string, void, unknown> {
  const prompt = getCategoryPrompt(chart, category);

  try {
    const stream = await getAnthropicClient().messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    let fullContent = '';

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text;
        fullContent += text;
        yield text;
      }
    }

    // Cache the complete reading
    cacheReading(chart.id, category, fullContent);
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
