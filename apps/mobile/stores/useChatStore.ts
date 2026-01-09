import { create } from 'zustand';
import {
  apiClient,
  ChatMessage,
  QuestionQuota,
  QuotaExceededError,
} from '../services/api/client';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  chartId: string | null;
  questionsRemaining: number | null;
  questionLimit: number;
  resetAt: string | null;
  quotaExceeded: boolean;
}

interface ChatActions {
  sendMessage: (question: string) => Promise<void>;
  loadHistory: (chartId: string) => Promise<void>;
  clearChat: () => Promise<void>;
  setChartId: (chartId: string) => void;
  loadQuota: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
  chartId: null,
  questionsRemaining: null,
  questionLimit: 5,
  resetAt: null,
  quotaExceeded: false,
};

export const useChatStore = create<ChatState & ChatActions>()((set, get) => ({
  ...initialState,

  setChartId: (chartId: string) => {
    set({ chartId, messages: [], error: null });
  },

  loadHistory: async (chartId: string) => {
    set({ isLoading: true, error: null, chartId });

    try {
      const history = await apiClient.getChatHistory(chartId);
      set({ messages: history, isLoading: false });
    } catch (error) {
      console.error('Error loading chat history:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load chat history',
        isLoading: false,
      });
    }
  },

  loadQuota: async () => {
    try {
      const quota = await apiClient.getRemainingQuestions();
      set({
        questionsRemaining: quota.questionsRemaining,
        questionLimit: quota.limit,
        resetAt: quota.resetAt,
        quotaExceeded: quota.questionsRemaining <= 0,
      });
    } catch (error) {
      console.error('Error loading quota:', error);
      // Don't show error to user, just use default values
    }
  },

  sendMessage: async (question: string) => {
    const { chartId, messages, quotaExceeded } = get();

    if (!chartId) {
      set({ error: 'No chart selected' });
      return;
    }

    if (quotaExceeded) {
      set({ error: 'Monthly question limit reached. Upgrade to Premium for unlimited questions.' });
      return;
    }

    // Optimistically add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };

    set({
      messages: [...messages, userMessage],
      isLoading: true,
      error: null,
    });

    try {
      const response = await apiClient.sendChatMessage(chartId, question, messages);

      // Add assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
      };

      set(state => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
        questionsRemaining: response.questionsRemaining,
        quotaExceeded: response.questionsRemaining <= 0,
      }));
    } catch (error) {
      console.error('Error sending message:', error);

      if (error instanceof QuotaExceededError) {
        set({
          error: error.message,
          isLoading: false,
          questionsRemaining: error.questionsRemaining,
          resetAt: error.resetAt,
          quotaExceeded: true,
          // Remove the optimistic user message
          messages: messages,
        });
      } else {
        set({
          error: error instanceof Error ? error.message : 'Failed to send message',
          isLoading: false,
          // Remove the optimistic user message on error
          messages: messages,
        });
      }
    }
  },

  clearChat: async () => {
    const { chartId } = get();

    if (!chartId) {
      set({ messages: [] });
      return;
    }

    try {
      await apiClient.clearChatHistory(chartId);
      set({ messages: [], error: null });
    } catch (error) {
      console.error('Error clearing chat:', error);
      // Still clear locally even if server fails
      set({ messages: [] });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
