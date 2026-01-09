import { Router, Request, Response } from 'express';
import {
  generateReading,
  handleChatQuestion,
  generateReadingStream,
  isValidCategory,
  getCachedReading,
  getAllCachedReadings,
  getAvailableProviders,
  getProviderInfo,
  getDefaultProvider,
} from '../services/ai/interpreter.js';
import { READING_CATEGORIES } from '../services/ai/prompts.js';
import type { ReadingCategory } from '../services/ai/prompts.js';
import { getChartById } from './chart.js';

const router = Router();

// Helper to get chart from shared storage
function getChart(chartId: string) {
  return getChartById(chartId) || null;
}

/**
 * GET /api/reading/categories
 * Get available reading categories
 */
router.get('/categories', (req: Request, res: Response) => {
  res.json({
    success: true,
    categories: READING_CATEGORIES.map(cat => ({
      id: cat,
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      description: getCategoryDescription(cat),
    })),
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

    // TODO: Check subscription for non-summary categories
    // For now, all categories are accessible

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
 * Handle follow-up questions about a chart
 */
router.post('/:chartId/chat', async (req: Request, res: Response) => {
  try {
    const { chartId } = req.params;
    const { provider: preferredProvider } = req.query;
    const { question, previousReadings = [] } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Question is required',
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

    const { content, provider } = await handleChatQuestion(
      chart,
      question,
      previousReadings,
      preferredProvider as string | undefined
    );

    res.json({
      success: true,
      response: content,
      chartId,
      timestamp: new Date().toISOString(),
      provider,
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
