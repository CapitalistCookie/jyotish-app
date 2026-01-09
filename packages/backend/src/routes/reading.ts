import { Router, Request, Response } from 'express';
import {
  generateReading,
  generateReadingStream,
  isValidCategory,
  getCachedReading,
  getAllCachedReadings,
  getAvailableProviders,
} from '../services/ai/interpreter.js';
import {
  chatWithChart,
  getChatHistory,
  addToChatHistory,
  clearChatHistory,
  ChatMessage,
} from '../services/ai/chat.js';
import { READING_CATEGORIES } from '../services/ai/prompts.js';
import type { ReadingCategory } from '../services/ai/prompts.js';
import { getChartById } from './chart.js';
import {
  getSubscriptionStatus,
  canAskQuestion,
  incrementQuestionUsage,
  getQuestionUsage,
  READING_ACCESS,
  FREE_QUESTION_LIMIT,
} from '../services/subscription/index.js';

const router = Router();

// Helper to get chart from shared storage
function getChart(chartId: string) {
  return getChartById(chartId) || null;
}

/**
 * GET /api/reading/categories
 * Get available reading categories with access level info
 */
router.get('/categories', async (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'anonymous';
  const status = await getSubscriptionStatus(userId);

  res.json({
    success: true,
    categories: READING_CATEGORIES.map(cat => {
      const accessConfig = READING_ACCESS[cat];
      return {
        id: cat,
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        description: getCategoryDescription(cat),
        accessLevel: accessConfig?.accessLevel || 'free',
        isLocked: accessConfig?.accessLevel === 'premium' && !status.isPremium,
      };
    }),
    userTier: status.tier,
    isPremium: status.isPremium,
  });
});

/**
 * GET /api/reading/questions/remaining
 * Get remaining questions for a user
 */
router.get('/questions/remaining', async (req: Request, res: Response) => {
  const { userId } = req.query;
  const userIdForLimit = (userId as string) || 'anonymous';

  const status = await getSubscriptionStatus(userIdForLimit);

  // Premium users have unlimited questions
  if (status.isPremium) {
    res.json({
      success: true,
      questionsUsed: 0,
      questionsRemaining: -1, // Unlimited
      limit: -1,
      resetAt: null,
      isPremium: true,
    });
    return;
  }

  const usage = getQuestionUsage(userIdForLimit);

  res.json({
    success: true,
    questionsUsed: usage.count,
    questionsRemaining: usage.remaining,
    limit: FREE_QUESTION_LIMIT,
    resetAt: usage.resetAt.toISOString(),
    isPremium: false,
  });
});

function getCategoryDescription(category: ReadingCategory): string {
  const descriptions: Record<ReadingCategory, string> = {
    summary: 'A comprehensive overview of your birth chart and life themes',
    love: 'Insights about relationships, romance, and partnership',
    career: 'Guidance on profession, purpose, and professional growth',
    finances: 'Analysis of wealth patterns and financial opportunities',
    health: 'Understanding of physical constitution and wellness',
    timeline: 'Timing of events based on planetary periods',
  };
  return descriptions[category];
}

/**
 * GET /api/reading/:chartId/summary
 * Get the summary reading for a chart (free for all users)
 */
router.get('/:chartId/summary', async (req: Request, res: Response) => {
  try {
    const { chartId } = req.params;
    const { provider: preferredProvider } = req.query;
    const chart = getChart(chartId);

    if (!chart) {
      res.status(404).json({
        success: false,
        error: 'Chart not found',
      });
      return;
    }

    // Check for available AI providers
    const providers = getAvailableProviders();
    if (providers.length === 0) {
      res.status(503).json({
        success: false,
        error: 'No AI providers configured. Please set up at least one API key.',
      });
      return;
    }

    const { content, cached, provider } = await generateReading(
      chart,
      'summary',
      true,
      preferredProvider as string | undefined
    );

    res.json({
      success: true,
      reading: {
        category: 'summary',
        content,
        cached,
        chartId,
        generatedAt: new Date().toISOString(),
        provider,
      },
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate reading',
    });
  }
});

/**
 * GET /api/reading/:chartId/:category
 * Get a specific category reading for a chart
 */
router.get('/:chartId/:category', async (req: Request, res: Response) => {
  try {
    const { chartId, category } = req.params;
    const { provider: preferredProvider } = req.query;

    // Validate category
    if (!isValidCategory(category)) {
      res.status(400).json({
        success: false,
        error: 'Invalid category',
        validCategories: READING_CATEGORIES,
      });
      return;
    }

    const chart = getChart(chartId);

    if (!chart) {
      res.status(404).json({
        success: false,
        error: 'Chart not found',
      });
      return;
    }

    // Check for available AI providers
    const providers = getAvailableProviders();
    if (providers.length === 0) {
      res.status(503).json({
        success: false,
        error: 'No AI providers configured. Please set up at least one API key.',
      });
      return;
    }

    // Check subscription for premium categories
    const accessConfig = READING_ACCESS[category];
    if (accessConfig?.accessLevel === 'premium') {
      const userId = (req.query.userId as string) || 'anonymous';
      const status = await getSubscriptionStatus(userId);

      if (!status.isPremium) {
        res.status(403).json({
          success: false,
          error: 'Premium subscription required',
          message: `The ${category} reading requires a Premium subscription.`,
          category,
          upgradeRequired: true,
          currentTier: status.tier,
          freeCategories: ['summary', 'love'],
        });
        return;
      }
    }

    const { content, cached, provider } = await generateReading(
      chart,
      category,
      true,
      preferredProvider as string | undefined
    );

    res.json({
      success: true,
      reading: {
        category,
        content,
        cached,
        chartId,
        generatedAt: new Date().toISOString(),
        provider,
      },
    });
  } catch (error) {
    console.error('Error generating reading:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate reading',
    });
  }
});

/**
 * GET /api/reading/:chartId/:category/stream
 * Stream a reading for real-time display
 */
router.get('/:chartId/:category/stream', async (req: Request, res: Response) => {
  try {
    const { chartId, category } = req.params;
    const { provider: preferredProvider } = req.query;

    // Validate category
    if (!isValidCategory(category)) {
      res.status(400).json({
        success: false,
        error: 'Invalid category',
      });
      return;
    }

    const chart = getChart(chartId);

    if (!chart) {
      res.status(404).json({
        success: false,
        error: 'Chart not found',
      });
      return;
    }

    // Check for available AI providers
    const providers = getAvailableProviders();
    if (providers.length === 0) {
      res.status(503).json({
        success: false,
        error: 'No AI providers configured. Please set up at least one API key.',
      });
      return;
    }

    // Check for cached version first
    const cached = getCachedReading(chartId, category);
    if (cached) {
      // Return cached version as a single chunk
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ text: cached.content, done: false })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, cached: true })}\n\n`);
      res.end();
      return;
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the reading
    const stream = generateReadingStream(chart, category, preferredProvider as string | undefined);

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ text: chunk, done: false })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true, cached: false })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error streaming reading:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to stream reading', done: true })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/reading/:chartId/chat
 * Handle follow-up questions about a chart with conversation history
 */
router.post('/:chartId/chat', async (req: Request, res: Response) => {
  try {
    const { chartId } = req.params;
    const { provider: preferredProvider } = req.query;
    const { question, history = [], userId } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Question is required',
      });
      return;
    }

    if (question.length > 500) {
      res.status(400).json({
        success: false,
        error: 'Question too long. Maximum 500 characters.',
      });
      return;
    }

    const chart = getChart(chartId);

    if (!chart) {
      res.status(404).json({
        success: false,
        error: 'Chart not found',
      });
      return;
    }

    // Check for available AI providers
    const providers = getAvailableProviders();
    if (providers.length === 0) {
      res.status(503).json({
        success: false,
        error: 'No AI providers configured. Please set up at least one API key.',
      });
      return;
    }

    // Check question limit for free users
    const userIdForLimit = userId || 'anonymous';
    const questionCheck = await canAskQuestion(userIdForLimit);

    if (!questionCheck.allowed) {
      const usage = getQuestionUsage(userIdForLimit);
      res.status(429).json({
        success: false,
        error: 'Monthly question limit reached',
        message: questionCheck.reason || 'You have used all your free questions for this month. Upgrade to Premium for unlimited questions.',
        questionsRemaining: 0,
        resetAt: usage.resetAt.toISOString(),
        upgradeRequired: true,
      });
      return;
    }

    // Use provided history or get stored history
    const chatHistory: ChatMessage[] = history.length > 0
      ? history
      : getChatHistory(chartId, userId);

    const timestamp = new Date().toISOString();

    // Add user message to history
    const userMessage: ChatMessage = {
      role: 'user',
      content: question,
      timestamp,
    };
    addToChatHistory(chartId, userMessage, userId);

    // Generate response
    const { response, provider } = await chatWithChart(
      chart,
      question,
      chatHistory,
      preferredProvider as string | undefined
    );

    // Add assistant response to history
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    };
    addToChatHistory(chartId, assistantMessage, userId);

    // Increment question count for non-premium users
    const status = await getSubscriptionStatus(userIdForLimit);
    let newRemaining = -1; // Unlimited for premium

    if (!status.isPremium) {
      const usage = incrementQuestionUsage(userIdForLimit);
      newRemaining = usage.remaining;
    }

    res.json({
      success: true,
      response,
      chartId,
      timestamp: assistantMessage.timestamp,
      provider,
      questionsRemaining: newRemaining,
    });
  } catch (error) {
    console.error('Error handling chat:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process question',
    });
  }
});

/**
 * GET /api/reading/:chartId/chat/history
 * Get chat history for a chart
 */
router.get('/:chartId/chat/history', (req: Request, res: Response) => {
  const { chartId } = req.params;
  const { userId } = req.query;

  const chart = getChart(chartId);
  if (!chart) {
    res.status(404).json({
      success: false,
      error: 'Chart not found',
    });
    return;
  }

  const history = getChatHistory(chartId, userId as string | undefined);

  res.json({
    success: true,
    chartId,
    history,
    messageCount: history.length,
  });
});

/**
 * DELETE /api/reading/:chartId/chat/history
 * Clear chat history for a chart
 */
router.delete('/:chartId/chat/history', (req: Request, res: Response) => {
  const { chartId } = req.params;
  const { userId } = req.query;

  const chart = getChart(chartId);
  if (!chart) {
    res.status(404).json({
      success: false,
      error: 'Chart not found',
    });
    return;
  }

  clearChatHistory(chartId, userId as string | undefined);

  res.json({
    success: true,
    message: 'Chat history cleared',
  });
});

/**
 * GET /api/reading/:chartId/cached
 * Get all cached readings for a chart
 */
router.get('/:chartId/cached', (req: Request, res: Response) => {
  const { chartId } = req.params;

  const chart = getChart(chartId);
  if (!chart) {
    res.status(404).json({
      success: false,
      error: 'Chart not found',
    });
    return;
  }

  const cachedReadings = getAllCachedReadings(chartId);

  const readings = Object.entries(cachedReadings)
    .filter(([, reading]) => reading !== null)
    .map(([category, reading]) => ({
      category,
      createdAt: reading!.createdAt,
      hasContent: true,
    }));

  res.json({
    success: true,
    chartId,
    cachedReadings: readings,
  });
});

export default router;
