import { Router, Request, Response } from 'express';
import { calculateChart, testCalculation } from '../services/astrology/calculator.js';
import { ChartRequest } from '../services/astrology/types.js';

const router = Router();

// In-memory storage for charts (replace with database later)
const chartStorage = new Map<string, any>();

/**
 * POST /api/chart/generate
 * Generate a new birth chart from birth details
 */
router.post('/generate', (req: Request, res: Response) => {
  try {
    const { birthDate, birthTime, latitude, longitude, timezone } = req.body as ChartRequest;

    // Validate required fields
    if (!birthDate || !birthTime || latitude === undefined || longitude === undefined) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['birthDate', 'birthTime', 'latitude', 'longitude', 'timezone'],
      });
      return;
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      res.status(400).json({
        error: 'Invalid birthDate format. Expected YYYY-MM-DD',
      });
      return;
    }

    // Validate time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(birthTime)) {
      res.status(400).json({
        error: 'Invalid birthTime format. Expected HH:MM',
      });
      return;
    }

    // Calculate the chart
    const chart = calculateChart({
      birthDate,
      birthTime,
      latitude,
      longitude,
      timezone: timezone || 'UTC',
    });

    // Store the chart
    chartStorage.set(chart.id, chart);

    res.json({
      success: true,
      chart,
    });
  } catch (error) {
    console.error('Error generating chart:', error);
    res.status(500).json({
      error: 'Failed to generate chart',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/chart/:id
 * Retrieve a saved chart by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const chart = chartStorage.get(id);

    if (!chart) {
      res.status(404).json({
        error: 'Chart not found',
      });
      return;
    }

    res.json({
      success: true,
      chart,
    });
  } catch (error) {
    console.error('Error retrieving chart:', error);
    res.status(500).json({
      error: 'Failed to retrieve chart',
    });
  }
});

/**
 * GET /api/chart/test/calculate
 * Test endpoint with hardcoded date
 */
router.get('/test/calculate', (_req: Request, res: Response) => {
  try {
    const chart = testCalculation();

    res.json({
      success: true,
      message: 'Test calculation for Jan 1, 2000, 12:00 PM, New York',
      chart,
    });
  } catch (error) {
    console.error('Error in test calculation:', error);
    res.status(500).json({
      error: 'Test calculation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
