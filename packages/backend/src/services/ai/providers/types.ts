import { BirthChart } from '../../astrology/types.js';

/**
 * Message format for chat history
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * AI Provider configuration
 */
export interface AIConfig {
  provider: 'claude' | 'deepseek' | 'gemini' | 'openai';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}

/**
 * Reading category type
 */
export type ReadingCategory = 'summary' | 'love' | 'career' | 'finances' | 'health' | 'timeline';

/**
 * Common interface for AI providers
 */
export interface AIProvider {
  /** Provider name for logging */
  readonly name: string;

  /** Model being used */
  readonly model: string;

  /**
   * Generate a reading for a specific category
   */
  generateReading(
    chart: BirthChart,
    category: ReadingCategory,
    systemPrompt: string,
    userPrompt: string
  ): Promise<string>;

  /**
   * Handle a chat conversation about the chart
   */
  chat(
    chart: BirthChart,
    systemPrompt: string,
    userPrompt: string
  ): Promise<string>;

  /**
   * Generate a streaming reading (optional - not all providers support this)
   */
  streamReading?(
    chart: BirthChart,
    category: ReadingCategory,
    systemPrompt: string,
    userPrompt: string
  ): AsyncGenerator<string, void, unknown>;

  /**
   * Check if the provider is available (has API key configured)
   */
  isAvailable(): boolean;
}

/**
 * Provider constructor type
 */
export type AIProviderConstructor = new (config: AIConfig) => AIProvider;

/**
 * Default configurations for each provider
 */
export const DEFAULT_CONFIGS: Record<AIConfig['provider'], Partial<AIConfig>> = {
  claude: {
    model: 'claude-sonnet-4-20250514',
    temperature: 0.7,
    maxTokens: 2048,
  },
  deepseek: {
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 2048,
  },
  gemini: {
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 2048,
  },
  openai: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2048,
  },
};
