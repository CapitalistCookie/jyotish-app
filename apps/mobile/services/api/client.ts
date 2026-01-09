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
}

export const apiClient = new ApiClient();
