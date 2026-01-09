import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/subscription/status
 * Get subscription status for current user
 */
router.get('/status', (req: Request, res: Response) => {
  // TODO: Implement with actual subscription system
  // For now, return a free tier status

  res.json({
    success: true,
    subscription: {
      plan: 'free',
      status: 'active',
      expiresAt: null,
      features: [
        'birth_chart',
        'summary_reading',
        'love_reading',
      ],
    },
  });
});

export default router;
