import { AIProvider, AIConfig, ReadingCategory } from './types.js';
import { ClaudeProvider } from './claude.js';
import { DeepSeekProvider } from './deepseek.js';
import { GeminiProvider } from './gemini.js';
import { OpenAIProvider } from './openai.js';
import { BirthChart } from '../../astrology/types.js';

// Re-export types
export * from './types.js';

// Export providers
export { ClaudeProvider } from './claude.js';
export { DeepSeekProvider } from './deepseek.js';
export { GeminiProvider } from './gemini.js';
export { OpenAIProvider } from './openai.js';

/**
 * Provider registry
 */
const PROVIDERS: Record<AIConfig['provider'], new (config: AIConfig) => AIProvider> = {
  claude: ClaudeProvider,
  deepseek: DeepSeekProvider,
  gemini: GeminiProvider,
  openai: OpenAIProvider,
};

/**
 * Default fallback order for providers
 */
const FALLBACK_ORDER: AIConfig['provider'][] = ['claude', 'deepseek', 'gemini', 'openai'];

/**
 * Create a single AI provider instance
 */
export function createProvider(config: AIConfig): AIProvider {
  const ProviderClass = PROVIDERS[config.provider];
  if (!ProviderClass) {
    throw new Error(`Unknown AI provider: ${config.provider}`);
  }
  return new ProviderClass(config);
}

/**
 * Get configured provider from environment
 */
export function getConfiguredProvider(): AIConfig['provider'] {
  const provider = process.env.AI_PROVIDER?.toLowerCase();
  if (provider && provider in PROVIDERS) {
    return provider as AIConfig['provider'];
  }
  return 'claude'; // Default to Claude
}

/**
 * Get the primary AI provider based on environment configuration
 */
export function getAIProvider(config?: Partial<AIConfig>): AIProvider {
  const provider = config?.provider || getConfiguredProvider();
  return createProvider({ provider, ...config });
}

/**
 * Get all available providers (those with API keys configured)
 */
export function getAvailableProviders(): AIProvider[] {
  return FALLBACK_ORDER
    .map(provider => {
      try {
        const instance = createProvider({ provider });
        return instance.isAvailable() ? instance : null;
      } catch {
        return null;
      }
    })
    .filter((p): p is AIProvider => p !== null);
}

/**
 * AI Provider Manager with fallback support
 */
export class AIProviderManager {
  private providers: AIProvider[] = [];
  private primaryProvider: AIProvider | null = null;

  constructor(config?: Partial<AIConfig>) {
    // Initialize primary provider
    const primaryProviderName = config?.provider || getConfiguredProvider();

    try {
      this.primaryProvider = createProvider({ provider: primaryProviderName, ...config });
      if (this.primaryProvider.isAvailable()) {
        this.providers.push(this.primaryProvider);
      } else {
        this.primaryProvider = null;
      }
    } catch (e) {
      console.warn(`Failed to initialize primary provider ${primaryProviderName}:`, e);
    }

    // Initialize fallback providers
    for (const providerName of FALLBACK_ORDER) {
      if (providerName === primaryProviderName) continue; // Skip primary, already added

      try {
        const provider = createProvider({ provider: providerName });
        if (provider.isAvailable()) {
          this.providers.push(provider);
        }
      } catch {
        // Skip unavailable providers
      }
    }

    if (this.providers.length === 0) {
      console.warn('No AI providers are available. Please configure at least one API key.');
    }
  }

  /**
   * Get list of available provider names
   */
  getAvailableProviderNames(): string[] {
    return this.providers.map(p => p.name);
  }

  /**
   * Get provider info with models
   */
  getProviderInfo(): Array<{ name: string; available: boolean; model: string }> {
    return FALLBACK_ORDER.map(providerName => {
      const provider = this.providers.find(p => p.name.toLowerCase() === providerName);
      if (provider) {
        return { name: providerName, available: true, model: provider.model };
      }
      return { name: providerName, available: false, model: '' };
    });
  }

  /**
   * Get the default provider name
   */
  getDefaultProviderName(): string {
    return getConfiguredProvider();
  }

  /**
   * Get a specific provider by name
   */
  getProviderByName(name: string): AIProvider | null {
    return this.providers.find(p => p.name.toLowerCase() === name.toLowerCase()) || null;
  }

  /**
   * Generate a reading with automatic fallback
   * @param preferredProvider - If specified, try this provider first before falling back
   */
  async generateReading(
    chart: BirthChart,
    category: ReadingCategory,
    systemPrompt: string,
    userPrompt: string,
    preferredProvider?: string
  ): Promise<{ content: string; provider: string }> {
    let lastError: Error | null = null;

    // Build provider order - if preferred provider specified, put it first
    let providerOrder = [...this.providers];
    if (preferredProvider) {
      const preferredLower = preferredProvider.toLowerCase();
      const preferred = this.providers.find(p => p.name.toLowerCase() === preferredLower);
      if (preferred) {
        providerOrder = [preferred, ...this.providers.filter(p => p.name.toLowerCase() !== preferredLower)];
      } else {
        console.warn(`Preferred provider '${preferredProvider}' not available, using fallback order`);
      }
    }

    for (const provider of providerOrder) {
      try {
        console.log(`Attempting to generate reading with ${provider.name}...`);
        const content = await provider.generateReading(chart, category, systemPrompt, userPrompt);
        console.log(`Successfully generated reading with ${provider.name}`);
        return { content, provider: provider.name.toLowerCase() };
      } catch (error) {
        console.warn(`${provider.name} failed:`, error instanceof Error ? error.message : error);
        lastError = error instanceof Error ? error : new Error(String(error));
        // Continue to next provider
      }
    }

    throw lastError || new Error('No AI providers available');
  }

  /**
   * Handle a chat question with automatic fallback
   * @param preferredProvider - If specified, try this provider first before falling back
   */
  async chat(
    chart: BirthChart,
    systemPrompt: string,
    userPrompt: string,
    preferredProvider?: string
  ): Promise<{ content: string; provider: string }> {
    let lastError: Error | null = null;

    // Build provider order - if preferred provider specified, put it first
    let providerOrder = [...this.providers];
    if (preferredProvider) {
      const preferredLower = preferredProvider.toLowerCase();
      const preferred = this.providers.find(p => p.name.toLowerCase() === preferredLower);
      if (preferred) {
        providerOrder = [preferred, ...this.providers.filter(p => p.name.toLowerCase() !== preferredLower)];
      } else {
        console.warn(`Preferred provider '${preferredProvider}' not available, using fallback order`);
      }
    }

    for (const provider of providerOrder) {
      try {
        console.log(`Attempting chat with ${provider.name}...`);
        const content = await provider.chat(chart, systemPrompt, userPrompt);
        console.log(`Successfully completed chat with ${provider.name}`);
        return { content, provider: provider.name.toLowerCase() };
      } catch (error) {
        console.warn(`${provider.name} chat failed:`, error instanceof Error ? error.message : error);
        lastError = error instanceof Error ? error : new Error(String(error));
        // Continue to next provider
      }
    }

    throw lastError || new Error('No AI providers available');
  }

  /**
   * Generate a streaming reading (uses first available provider with streaming support)
   * @param preferredProvider - If specified, try this provider first before falling back
   */
  async *streamReading(
    chart: BirthChart,
    category: ReadingCategory,
    systemPrompt: string,
    userPrompt: string,
    preferredProvider?: string
  ): AsyncGenerator<string, { provider: string }, unknown> {
    // Build provider order - if preferred provider specified, put it first
    let providerOrder = [...this.providers];
    if (preferredProvider) {
      const preferredLower = preferredProvider.toLowerCase();
      const preferred = this.providers.find(p => p.name.toLowerCase() === preferredLower);
      if (preferred) {
        providerOrder = [preferred, ...this.providers.filter(p => p.name.toLowerCase() !== preferredLower)];
      } else {
        console.warn(`Preferred provider '${preferredProvider}' not available, using fallback order`);
      }
    }

    for (const provider of providerOrder) {
      if (!provider.streamReading) continue;

      try {
        console.log(`Attempting to stream reading with ${provider.name}...`);
        const stream = provider.streamReading(chart, category, systemPrompt, userPrompt);

        for await (const chunk of stream) {
          yield chunk;
        }

        console.log(`Successfully streamed reading with ${provider.name}`);
        return { provider: provider.name.toLowerCase() };
      } catch (error) {
        console.warn(`${provider.name} streaming failed:`, error instanceof Error ? error.message : error);
        // Continue to next provider
      }
    }

    throw new Error('No AI providers with streaming support available');
  }
}

// Singleton instance
let providerManager: AIProviderManager | null = null;

/**
 * Get the singleton provider manager instance
 */
export function getProviderManager(config?: Partial<AIConfig>): AIProviderManager {
  if (!providerManager) {
    providerManager = new AIProviderManager(config);
  }
  return providerManager;
}

/**
 * Reset the provider manager (useful for testing or when config changes)
 */
export function resetProviderManager(): void {
  providerManager = null;
}
