import Anthropic from '@anthropic-ai/sdk';
import { BirthChart } from '../../astrology/types.js';
import { AIProvider, AIConfig, ReadingCategory, DEFAULT_CONFIGS } from './types.js';

/**
 * Anthropic Claude AI Provider
 */
export class ClaudeProvider implements AIProvider {
  readonly name = 'Claude';
  readonly model: string;
  private client: Anthropic | null = null;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = {
      ...DEFAULT_CONFIGS.claude,
      ...config,
    };
    this.model = this.config.model || DEFAULT_CONFIGS.claude.model!;
  }

  private getClient(): Anthropic {
    if (!this.client) {
      const apiKey = this.config.apiKey || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
      }
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  isAvailable(): boolean {
    return !!(this.config.apiKey || process.env.ANTHROPIC_API_KEY);
  }

  async generateReading(
    _chart: BirthChart,
    _category: ReadingCategory,
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    const response = await this.getClient().messages.create({
      model: this.model,
      max_tokens: this.config.maxTokens || 2048,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    });

    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');
  }

  async chat(
    _chart: BirthChart,
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    const response = await this.getClient().messages.create({
      model: this.model,
      max_tokens: this.config.maxTokens || 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    });

    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');
  }

  async *streamReading(
    _chart: BirthChart,
    _category: ReadingCategory,
    systemPrompt: string,
    userPrompt: string
  ): AsyncGenerator<string, void, unknown> {
    const stream = await this.getClient().messages.stream({
      model: this.model,
      max_tokens: this.config.maxTokens || 2048,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }
}
