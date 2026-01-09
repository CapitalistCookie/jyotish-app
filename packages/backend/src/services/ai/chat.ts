import { BirthChart } from '../astrology/types.js';
import { formatChartForPrompt } from './prompts.js';
import {
  getProviderManager,
  AIProviderManager,
} from './providers/index.js';

/**
 * Message format for chat history
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * Chat session storage (in-memory for now)
 */
const chatSessions = new Map<string, ChatMessage[]>();

/**
 * System prompt for chart-based chat
 */
function buildChatSystemPrompt(chart: BirthChart): string {
  const chartData = formatChartForPrompt(chart);

  return `You are an expert Vedic astrologer having a conversation with someone about their birth chart. You have deep knowledge of Jyotish and have studied the ancient texts.

The person you're speaking with has the following birth chart:

${chartData}

Guidelines for your responses:
- Be conversational and warm, but maintain astrological accuracy
- Reference specific planetary positions to support your insights
- Keep responses focused and concise (2-4 paragraphs typically)
- If asked about timing, reference Dasha periods
- Be encouraging about challenges - frame them as growth opportunities
- If a question is unclear, ask for clarification
- If asked something unrelated to astrology, gently redirect to chart-related topics
- Use accessible language; explain technical terms when first used

Remember: You're having a dialogue, not delivering a lecture. Respond naturally to what the person asks.`;
}

/**
 * Build conversation context from history
 */
function buildConversationContext(history: ChatMessage[]): string {
  if (history.length === 0) return '';

  const recentHistory = history.slice(-10); // Keep last 10 messages for context

  return recentHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Astrologer'}: ${msg.content}`)
    .join('\n\n');
}

/**
 * Get the provider manager instance
 */
function getManager(): AIProviderManager {
  return getProviderManager();
}

/**
 * Chat with the AI about a birth chart
 */
export async function chatWithChart(
  chart: BirthChart,
  question: string,
  history: ChatMessage[] = [],
  preferredProvider?: string
): Promise<{ response: string; provider: string }> {
  const systemPrompt = buildChatSystemPrompt(chart);

  // Build user prompt with conversation context
  let userPrompt = '';

  if (history.length > 0) {
    const context = buildConversationContext(history);
    userPrompt = `Previous conversation:\n${context}\n\nUser's new question: ${question}`;
  } else {
    userPrompt = question;
  }

  try {
    const { content, provider } = await getManager().chat(
      chart,
      systemPrompt,
      userPrompt,
      preferredProvider
    );

    return { response: content, provider };
  } catch (error) {
    console.error('Error in chat:', error);
    throw new Error('Failed to process your question. Please try again.');
  }
}

/**
 * Get chat session key
 */
function getSessionKey(chartId: string, userId?: string): string {
  return userId ? `${chartId}:${userId}` : chartId;
}

/**
 * Get chat history for a chart
 */
export function getChatHistory(chartId: string, userId?: string): ChatMessage[] {
  const key = getSessionKey(chartId, userId);
  return chatSessions.get(key) || [];
}

/**
 * Add a message to chat history
 */
export function addToChatHistory(
  chartId: string,
  message: ChatMessage,
  userId?: string
): void {
  const key = getSessionKey(chartId, userId);
  const history = chatSessions.get(key) || [];
  history.push(message);

  // Keep only last 50 messages to prevent memory bloat
  if (history.length > 50) {
    history.splice(0, history.length - 50);
  }

  chatSessions.set(key, history);
}

/**
 * Clear chat history for a chart
 */
export function clearChatHistory(chartId: string, userId?: string): void {
  const key = getSessionKey(chartId, userId);
  chatSessions.delete(key);
}

/**
 * Get chat statistics for a user (for rate limiting)
 */
export interface ChatStats {
  totalQuestions: number;
  questionsThisMonth: number;
  lastQuestionAt: string | null;
}

// In-memory question tracking (should be replaced with database in production)
const questionCounts = new Map<string, { count: number; resetAt: Date }>();

/**
 * Get question count for rate limiting
 */
export function getQuestionCount(userId: string): { count: number; resetAt: Date } {
  const now = new Date();
  const existing = questionCounts.get(userId);

  if (existing) {
    // Reset if we're in a new month
    if (now >= existing.resetAt) {
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      questionCounts.set(userId, { count: 0, resetAt: nextReset });
      return { count: 0, resetAt: nextReset };
    }
    return existing;
  }

  // Initialize for new user
  const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  questionCounts.set(userId, { count: 0, resetAt: nextReset });
  return { count: 0, resetAt: nextReset };
}

/**
 * Increment question count
 */
export function incrementQuestionCount(userId: string): number {
  const { count, resetAt } = getQuestionCount(userId);
  const newCount = count + 1;
  questionCounts.set(userId, { count: newCount, resetAt });
  return newCount;
}

/**
 * Check if user has questions remaining
 */
export function hasQuestionsRemaining(userId: string, limit: number): boolean {
  const { count } = getQuestionCount(userId);
  return count < limit;
}

/**
 * Get remaining questions for a user
 */
export function getRemainingQuestions(userId: string, limit: number): number {
  const { count } = getQuestionCount(userId);
  return Math.max(0, limit - count);
}
