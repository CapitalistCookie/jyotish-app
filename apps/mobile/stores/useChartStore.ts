import { create } from 'zustand';
import { apiClient, BirthChart, ChartRequest } from '../services/api/client';

interface ChartState {
  chart: BirthChart | null;
  isLoading: boolean;
  error: string | null;
}

interface ChartActions {
  generateChart: (request: ChartRequest) => Promise<BirthChart | null>;
  loadChart: (id: string) => Promise<void>;
  clearChart: () => void;
  clearError: () => void;
}

const initialState: ChartState = {
  chart: null,
  isLoading: false,
  error: null,
};

export const useChartStore = create<ChartState & ChartActions>()((set, get) => ({
  ...initialState,

  generateChart: async (request: ChartRequest) => {
    set({ isLoading: true, error: null });

    try {
      const chart = await apiClient.generateChart(request);
      set({ chart, isLoading: false });
      return chart;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate chart';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  loadChart: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const chart = await apiClient.getChart(id);
      set({ chart, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load chart';
      set({ error: message, isLoading: false });
    }
  },

  clearChart: () => set({ chart: null, error: null }),

  clearError: () => set({ error: null }),
}));
