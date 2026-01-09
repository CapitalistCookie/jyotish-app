/**
 * Affiliate Routes
 * Handles affiliate link tracking and management
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { grantAffiliateTrial } from '../services/subscription/trial.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/affiliate/track/:code
 * Track affiliate link click
 */
router.get('/track/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const affiliate = await prisma.affiliatePartner.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!affiliate || !affiliate.isActive) {
      return res.status(404).json({
        valid: false,
        error: 'Affiliate code not found',
      });
    }

    // Increment click count
    await prisma.affiliatePartner.update({
      where: { id: affiliate.id },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });

    res.json({
      valid: true,
      name: affiliate.name,
      discountPercent: affiliate.discountPercent,
      trialDays: affiliate.trialDays,
    });
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    res.status(500).json({ error: 'Failed to track affiliate click' });
  }
});

/**
 * POST /api/affiliate/apply
 * Apply affiliate code during signup
 */
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Code and userId are required' });
    }

    const affiliate = await prisma.affiliatePartner.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!affiliate || !affiliate.isActive) {
      return res.status(404).json({
        applied: false,
        error: 'Affiliate code not found or inactive',
      });
    }

    // Grant extended trial
    const trialResult = await grantAffiliateTrial(
      userId,
      affiliate.code,
      affiliate.trialDays
    );

    if (!trialResult.success) {
      return res.status(400).json({
        applied: false,
        error: trialResult.error,
      });
    }

    // Increment signup count
    await prisma.affiliatePartner.update({
      where: { id: affiliate.id },
      data: {
        signups: {
          increment: 1,
        },
      },
    });

    res.json({
      applied: true,
      benefits: {
        trialDays: affiliate.trialDays,
        trialEndsAt: trialResult.endsAt,
        discountPercent: affiliate.discountPercent,
        affiliateName: affiliate.name,
      },
    });
  } catch (error) {
    console.error('Error applying affiliate code:', error);
    res.status(500).json({ error: 'Failed to apply affiliate code' });
  }
});

/**
 * GET /api/affiliate/stats
 * Get affiliate's performance stats (protected, affiliate only)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const affiliate = await prisma.affiliatePartner.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      return res.status(403).json({ error: 'Not an affiliate partner' });
    }

    // Calculate conversion rate
    const conversionRate = affiliate.signups > 0
      ? ((affiliate.conversions / affiliate.signups) * 100).toFixed(2)
      : '0.00';

    res.json({
      code: affiliate.code,
      name: affiliate.name,
      clicks: affiliate.clicks,
      signups: affiliate.signups,
      conversions: affiliate.conversions,
      conversionRate: `${conversionRate}%`,
      pendingPayout: Number(affiliate.pendingPayout),
      totalPaid: Number(affiliate.totalPaid),
      discountPercent: affiliate.discountPercent,
      commissionPercent: affiliate.commissionPercent,
      trialDays: affiliate.trialDays,
      isActive: affiliate.isActive,
      createdAt: affiliate.createdAt,
    });
  } catch (error) {
    console.error('Error getting affiliate stats:', error);
    res.status(500).json({ error: 'Failed to get affiliate stats' });
  }
});

/**
 * POST /api/affiliate/record-conversion
 * Record a conversion (internal use, called after purchase)
 */
router.post('/record-conversion', async (req: Request, res: Response) => {
  try {
    const { userId, purchaseAmount } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Find user's referral code
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referredBy: true },
    });

    if (!user?.referredBy) {
      return res.json({ recorded: false, reason: 'User has no referral' });
    }

    // Find affiliate by code
    const affiliate = await prisma.affiliatePartner.findUnique({
      where: { code: user.referredBy },
    });

    if (!affiliate) {
      return res.json({ recorded: false, reason: 'Affiliate not found' });
    }

    // Calculate commission
    const commission = purchaseAmount
      ? (purchaseAmount * affiliate.commissionPercent) / 100
      : 0;

    // Update affiliate stats
    await prisma.affiliatePartner.update({
      where: { id: affiliate.id },
      data: {
        conversions: {
          increment: 1,
        },
        pendingPayout: {
          increment: commission,
        },
      },
    });

    res.json({
      recorded: true,
      affiliateCode: affiliate.code,
      commission,
    });
  } catch (error) {
    console.error('Error recording conversion:', error);
    res.status(500).json({ error: 'Failed to record conversion' });
  }
});

/**
 * GET /api/affiliate/validate/:code
 * Validate an affiliate code without tracking
 */
router.get('/validate/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const affiliate = await prisma.affiliatePartner.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        name: true,
        isActive: true,
        discountPercent: true,
        trialDays: true,
      },
    });

    if (!affiliate || !affiliate.isActive) {
      return res.status(404).json({
        valid: false,
        error: 'Invalid affiliate code',
      });
    }

    res.json({
      valid: true,
      name: affiliate.name,
      discountPercent: affiliate.discountPercent,
      trialDays: affiliate.trialDays,
    });
  } catch (error) {
    console.error('Error validating affiliate code:', error);
    res.status(500).json({ error: 'Failed to validate affiliate code' });
  }
});

export default router;
