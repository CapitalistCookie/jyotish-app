// Re-export generated types and services
export {
  OpenAPI,
  ApiError,
  // Types
  type ChartRequest,
  type ChartResponse,
  type BirthChart,
  type Planet,
  type House,
  type DashaPeriod,
  type Reading,
  type ReadingResponse,
  type ReadingCategory,
  type CategoriesResponse,
  type ChatRequest,
  type ChatResponse,
  type RegisterRequest,
  type LoginRequest,
  type AuthResponse,
  type User,
  type UserResponse,
  type SubscriptionStatus,
  type CachedReadingsResponse,
  // Services
  ChartService,
  ReadingService,
  AuthService,
  SubscriptionService,
  DefaultService,
} from './generated';

import { OpenAPI } from './generated';

// Server IP where the backend is running
const SERVER_IP = '192.168.1.225';

// Configure the generated client's base URL
OpenAPI.BASE = `http://${SERVER_IP}:3001`;

// Type alias for backward compatibility
export type ReadingCategoryId = 'summary' | 'love' | 'career' | 'finances' | 'health' | 'timeline';

// Legacy API client wrapper for backward compatibility
// New code should use the generated services directly (ChartService, ReadingService, etc.)
import {
  ChartService,
  ReadingService,
  DefaultService,
  type ChartRequest as GeneratedChartRequest,
  type BirthChart,
  type Reading,
  type ReadingCategory,
} from './generated';

class ApiClient {
  async generateChart(request: GeneratedChartRequest): Promise<BirthChart> {
    const response = await ChartService.generateChart(request);
    if (!response.success || !response.chart) {
      throw new Error('Failed to generate chart');
    }
    return response.chart;
  }

  async getChart(id: string): Promise<BirthChart> {
    const response = await ChartService.getChart(id);
    if (!response.success || !response.chart) {
      throw new Error('Chart not found');
    }
    return response.chart;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await DefaultService.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  async getReadingCategories(): Promise<ReadingCategory[]> {
    const response = await ReadingService.getReadingCategories();
    return response.categories || [];
  }

  async getReading(chartId: string, category: string): Promise<Reading> {
    const response = await ReadingService.getCategoryReading(
      chartId,
      category as ReadingCategoryId
    );
    if (!response.success || !response.reading) {
      throw new Error('Failed to get reading');
    }
    return response.reading;
  }

  async askQuestion(chartId: string, question: string, previousReadings: string[] = []): Promise<string> {
    const response = await ReadingService.askQuestion(chartId, {
      question,
      previousReadings,
    });
    if (!response.success || !response.response) {
      throw new Error('Failed to get answer');
    }
    return response.response;
  }

  /**
   * Send a chat message with conversation history support
   */
  async sendChatMessage(
    chartId: string,
    question: string,
    history: ChatMessage[] = [],
    userId?: string
  ): Promise<ChatApiResponse> {
    const response = await fetch(`${OpenAPI.BASE}/api/reading/${chartId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, history, userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 429) {
        throw new QuotaExceededError(data.message || 'Monthly question limit reached', data.questionsRemaining, data.resetAt);
      }
      throw new Error(data.error || 'Failed to send message');
    }

    return data;
  }

  /**
   * Get chat history for a chart
   */
  async getChatHistory(chartId: string, userId?: string): Promise<ChatMessage[]> {
    const url = new URL(`${OpenAPI.BASE}/api/reading/${chartId}/chat/history`);
    if (userId) url.searchParams.set('userId', userId);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get chat history');
    }

    return data.history || [];
  }

  /**
   * Clear chat history for a chart
   */
  async clearChatHistory(chartId: string, userId?: string): Promise<void> {
    const url = new URL(`${OpenAPI.BASE}/api/reading/${chartId}/chat/history`);
    if (userId) url.searchParams.set('userId', userId);

    const response = await fetch(url.toString(), { method: 'DELETE' });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to clear chat history');
    }
  }

  /**
   * Get remaining questions for a user
   */
  async getRemainingQuestions(userId?: string): Promise<QuestionQuota> {
    const url = new URL(`${OpenAPI.BASE}/api/reading/questions/remaining`);
    if (userId) url.searchParams.set('userId', userId);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get question quota');
    }

    return {
      questionsUsed: data.questionsUsed,
      questionsRemaining: data.questionsRemaining,
      limit: data.limit,
      resetAt: data.resetAt,
    };
  }

  /**
   * Get subscription status for a user
   */
  async getSubscriptionStatus(userId?: string): Promise<SubscriptionStatusResponse> {
    const url = new URL(`${OpenAPI.BASE}/api/subscription/status`);
    if (userId) url.searchParams.set('userId', userId);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get subscription status');
    }

    return {
      isPremium: data.subscription?.isPremium || false,
      tier: data.subscription?.tier || 'free',
      expiresAt: data.subscription?.expiresAt || null,
      provider: data.subscription?.provider || null,
      entitlements: data.subscription?.entitlements || [],
    };
  }

  /**
   * Get reading categories with access info
   */
  async getReadingCategoriesWithAccess(userId?: string): Promise<CategoryWithAccess[]> {
    const url = new URL(`${OpenAPI.BASE}/api/reading/categories`);
    if (userId) url.searchParams.set('userId', userId);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get categories');
    }

    return data.categories || [];
  }
}

// Chat-related types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatApiResponse {
  success: boolean;
  response: string;
  chartId: string;
  timestamp: string;
  provider?: string;
  questionsRemaining: number;
}

export interface QuestionQuota {
  questionsUsed: number;
  questionsRemaining: number;
  limit: number;
  resetAt: string;
}

export class QuotaExceededError extends Error {
  questionsRemaining: number;
  resetAt: string;

  constructor(message: string, questionsRemaining: number, resetAt: string) {
    super(message);
    this.name = 'QuotaExceededError';
    this.questionsRemaining = questionsRemaining;
    this.resetAt = resetAt;
  }
}

// Subscription-related types
export interface SubscriptionStatusResponse {
  isPremium: boolean;
  tier: 'free' | 'premium' | 'pro';
  expiresAt: string | null;
  provider: string | null;
  entitlements: string[];
}

export interface CategoryWithAccess {
  id: string;
  name: string;
  description: string;
  accessLevel: 'free' | 'premium';
  isLocked: boolean;
}

export const apiClient = new ApiClient();
