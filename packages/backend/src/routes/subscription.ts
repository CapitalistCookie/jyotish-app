import { Router, Request, Response } from 'express';
import {
  getSubscriptionStatus,
  handleWebhookEvent,
  verifyWebhookSignature,
  getQuestionUsage,
  canAskQuestion,
  hasPremiumAccess,
  FREE_QUESTION_LIMIT,
} from '../services/subscription/index.js';
import type { RevenueCatWebhookPayload } from '../services/subscription/types.js';

const router = Router();

/**
 * GET /api/subscription/status
 * Get subscription status for a user
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'anonymous';

    const status = await getSubscriptionStatus(userId);

    res.json({
      success: true,
      subscription: {
        isPremium: status.isPremium,
        tier: status.tier,
        expiresAt: status.expiresAt?.toISOString() || null,
        provider: status.provider,
        entitlements: status.entitlements,
      },
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription status',
    });
  }
});

/**
 * POST /api/subscription/webhook
 * Handle RevenueCat webhook events
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-revenuecat-signature'] as string || '';
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!verifyWebhookSignature(rawBody, signature)) {
        console.error('Invalid webhook signature');
        res.status(400).json({
          success: false,
          error: 'Invalid webhook signature',
        });
        return;
      }
    }

    const payload = req.body as RevenueCatWebhookPayload;

    // Validate payload structure
    if (!payload.event || !payload.event.type || !payload.event.app_user_id) {
      res.status(400).json({
        success: false,
        error: 'Invalid webhook payload',
      });
      return;
    }

    // Process the webhook event
    const result = await handleWebhookEvent(payload);

    res.json({
      received: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
    });
  }
});

/**
 * GET /api/subscription/question-usage
 * Get question usage for a user
 */
router.get('/question-usage', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'anonymous';

    const isPremium = await hasPremiumAccess(userId);

    if (isPremium) {
      res.json({
        success: true,
        usage: {
          count: 0,
          remaining: -1, // Unlimited
          limit: -1,
          resetAt: null,
          isPremium: true,
        },
      });
      return;
    }

    const usage = getQuestionUsage(userId);

    res.json({
      success: true,
      usage: {
        count: usage.count,
        remaining: usage.remaining,
        limit: FREE_QUESTION_LIMIT,
        resetAt: usage.resetAt.toISOString(),
        isPremium: false,
      },
    });
  } catch (error) {
    console.error('Error getting question usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get question usage',
    });
  }
});

/**
 * GET /api/subscription/can-ask
 * Check if user can ask a question
 */
router.get('/can-ask', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'anonymous';

    const result = await canAskQuestion(userId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error checking question permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check question permission',
    });
  }
});

/**
 * GET /api/subscription/entitlements
 * Get list of entitlements for a user
 */
router.get('/entitlements', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'anonymous';

    const status = await getSubscriptionStatus(userId);

    res.json({
      success: true,
      userId,
      entitlements: status.entitlements,
      tier: status.tier,
    });
  } catch (error) {
    console.error('Error getting entitlements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get entitlements',
    });
  }
});

export default router;
