import OpenAI from 'openai';
import { BirthChart } from '../../astrology/types.js';
import { AIProvider, AIConfig, ReadingCategory, DEFAULT_CONFIGS } from './types.js';

/**
 * DeepSeek AI Provider (uses OpenAI-compatible API)
 */
export class DeepSeekProvider implements AIProvider {
  readonly name = 'DeepSeek';
  readonly model: string;
  private client: OpenAI | null = null;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = {
      ...DEFAULT_CONFIGS.deepseek,
      ...config,
    };
    this.model = this.config.model || DEFAULT_CONFIGS.deepseek.model!;
  }

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = this.config.apiKey || process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        throw new Error('DEEPSEEK_API_KEY is not configured');
      }
      this.client = new OpenAI({
        apiKey,
        baseURL: 'https://api.deepseek.com',
      });
    }
    return this.client;
  }

  isAvailable(): boolean {
    return !!(this.config.apiKey || process.env.DEEPSEEK_API_KEY);
  }

  async generateReading(
    _chart: BirthChart,
    _category: ReadingCategory,
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    const response = await this.getClient().chat.completions.create({
      model: this.model,
      max_tokens: this.config.maxTokens || 2048,
      temperature: this.config.temperature || 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    return response.choices[0]?.message?.content || '';
  }

  async chat(
    _chart: BirthChart,
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    const response = await this.getClient().chat.completions.create({
      model: this.model,
      max_tokens: this.config.maxTokens || 1024,
      temperature: this.config.temperature || 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    return response.choices[0]?.message?.content || '';
  }

  async *streamReading(
    _chart: BirthChart,
    _category: ReadingCategory,
    systemPrompt: string,
    userPrompt: string
  ): AsyncGenerator<string, void, unknown> {
    const stream = await this.getClient().chat.completions.create({
      model: this.model,
      max_tokens: this.config.maxTokens || 2048,
      temperature: this.config.temperature || 0.7,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        yield text;
      }
    }
  }
}
