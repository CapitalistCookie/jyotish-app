import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { BirthChart } from '../../astrology/types.js';
import { AIProvider, AIConfig, ReadingCategory, DEFAULT_CONFIGS } from './types.js';

/**
 * Google Gemini AI Provider
 */
export class GeminiProvider implements AIProvider {
  readonly name = 'Gemini';
  readonly model: string;
  private client: GoogleGenerativeAI | null = null;
  private generativeModel: GenerativeModel | null = null;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = {
      ...DEFAULT_CONFIGS.gemini,
      ...config,
    };
    this.model = this.config.model || DEFAULT_CONFIGS.gemini.model!;
  }

  private getClient(): GoogleGenerativeAI {
    if (!this.client) {
      const apiKey = this.config.apiKey || process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_AI_API_KEY is not configured');
      }
      this.client = new GoogleGenerativeAI(apiKey);
    }
    return this.client;
  }

  private getModel(): GenerativeModel {
    if (!this.generativeModel) {
      this.generativeModel = this.getClient().getGenerativeModel({
        model: this.model,
        generationConfig: {
          temperature: this.config.temperature || 0.7,
          maxOutputTokens: this.config.maxTokens || 2048,
        },
      });
    }
    return this.generativeModel;
  }

  isAvailable(): boolean {
    return !!(this.config.apiKey || process.env.GOOGLE_AI_API_KEY);
  }

  async generateReading(
    _chart: BirthChart,
    _category: ReadingCategory,
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    const model = this.getModel();

    // Gemini combines system and user prompts differently
    const combinedPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

    const result = await model.generateContent(combinedPrompt);
    const response = result.response;
    return response.text();
  }

  async chat(
    _chart: BirthChart,
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    const model = this.getClient().getGenerativeModel({
      model: this.model,
      generationConfig: {
        temperature: this.config.temperature || 0.7,
        maxOutputTokens: this.config.maxTokens || 1024,
      },
    });

    // Gemini combines system and user prompts differently
    const combinedPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

    const result = await model.generateContent(combinedPrompt);
    const response = result.response;
    return response.text();
  }

  async *streamReading(
    _chart: BirthChart,
    _category: ReadingCategory,
    systemPrompt: string,
    userPrompt: string
  ): AsyncGenerator<string, void, unknown> {
    const model = this.getModel();

    // Gemini combines system and user prompts differently
    const combinedPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

    const result = await model.generateContentStream(combinedPrompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }
}
