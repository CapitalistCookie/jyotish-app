import { Platform } from 'react-native';

// Use localhost for web, machine IP for native devices
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  }
  // For physical devices/emulators, use your machine's IP
  // TODO: Update this to your actual LXC/machine IP
  return 'http://localhost:3001';
};

const BASE_URL = getBaseUrl();

interface ApiResponse<T> {
  success: boolean;
  chart?: T;
  error?: string;
  message?: string;
}

export interface ChartRequest {
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface Planet {
  name: string;
  sign: string;
  signIndex: number;
  degree: number;
  longitude: number;
  nakshatra: string;
  nakshatraPada: number;
  house: number;
  isRetrograde: boolean;
}

export interface House {
  number: number;
  sign: string;
  signIndex: number;
  degree: number;
  longitude: number;
}

export interface DashaPeriod {
  planet: string;
  startDate: string;
  endDate: string;
  level: 'maha' | 'antar' | 'pratyantar';
}

export interface BirthChart {
  id: string;
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  timezone: string;
  ascendant: Planet;
  planets: Planet[];
  houses: House[];
  dashas: DashaPeriod[];
  ayanamsa: number;
  ayanamsaName: string;
  calculatedAt: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  async generateChart(request: ChartRequest): Promise<BirthChart> {
    const response = await this.request<ApiResponse<BirthChart>>(
      '/api/chart/generate',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    if (!response.success || !response.chart) {
      throw new Error(response.error || 'Failed to generate chart');
    }

    return response.chart;
  }

  async getChart(id: string): Promise<BirthChart> {
    const response = await this.request<ApiResponse<BirthChart>>(
      `/api/chart/${id}`
    );

    if (!response.success || !response.chart) {
      throw new Error(response.error || 'Chart not found');
    }

    return response.chart;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch {
      return false;
    }
  }
}

export const apiClient = new ApiClient();
