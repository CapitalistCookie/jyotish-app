/**
 * Admin Routes
 * Protected routes for admin management
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { requireAdmin } from '../middleware/roles.js';
import { setUserRole, grantPremium, UserRole } from '../middleware/roles.js';
import { createPromoCode, deactivatePromoCode, listPromoCodes, PromoCodeType } from '../services/subscription/promo.js';

const router = Router();
const prisma = new PrismaClient();

// All admin routes require admin role
router.use(requireAdmin);

/**
 * GET /api/admin/users
 * List all users with filters
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const {
      role,
      subscriptionStatus,
      search,
      limit = '50',
      offset = '0',
    } = req.query;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (subscriptionStatus) {
      where.subscriptionStatus = subscriptionStatus;
    }

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          subscriptionStatus: true,
          subscriptionExpiresAt: true,
          trialEndsAt: true,
          trialUsed: true,
          referralCode: true,
          referredBy: true,
          questionsUsedThisMonth: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/**
 * GET /api/admin/users/:id
 * Get user details
 */
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        charts: {
          select: { id: true, name: true, createdAt: true },
        },
        affiliatePartner: true,
        _count: {
          select: {
            charts: true,
            chatSessions: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't expose password
    const { password, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * POST /api/admin/users/:id/grant-premium
 * Grant premium access manually
 */
router.post('/users/:id/grant-premium', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { days, reason } = req.body;

    if (!days || days <= 0) {
      return res.status(400).json({ error: 'Days must be a positive number' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    const result = await grantPremium(id, days, reason);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      userId: id,
      expiresAt: result.expiresAt,
      days,
      reason,
    });
  } catch (error) {
    console.error('Error granting premium:', error);
    res.status(500).json({ error: 'Failed to grant premium' });
  }
});

/**
 * POST /api/admin/users/:id/set-role
 * Set user role
 */
router.post('/users/:id/set-role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles: UserRole[] = ['user', 'developer', 'admin'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        validRoles,
      });
    }

    const result = await setUserRole(id, role);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      userId: id,
      role,
    });
  } catch (error) {
    console.error('Error setting role:', error);
    res.status(500).json({ error: 'Failed to set role' });
  }
});

/**
 * GET /api/admin/affiliates
 * List all affiliates
 */
router.get('/affiliates', async (req: Request, res: Response) => {
  try {
    const { activeOnly = 'false' } = req.query;

    const affiliates = await prisma.affiliatePartner.findMany({
      where: activeOnly === 'true' ? { isActive: true } : undefined,
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      affiliates: affiliates.map((a) => ({
        id: a.id,
        name: a.name,
        code: a.code,
        discountPercent: a.discountPercent,
        commissionPercent: a.commissionPercent,
        trialDays: a.trialDays,
        isActive: a.isActive,
        clicks: a.clicks,
        signups: a.signups,
        conversions: a.conversions,
        conversionRate: a.signups > 0 ? ((a.conversions / a.signups) * 100).toFixed(2) : '0.00',
        pendingPayout: Number(a.pendingPayout),
        totalPaid: Number(a.totalPaid),
        user: a.user,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error listing affiliates:', error);
    res.status(500).json({ error: 'Failed to list affiliates' });
  }
});

/**
 * POST /api/admin/affiliates
 * Create new affiliate partner
 */
router.post('/affiliates', async (req: Request, res: Response) => {
  try {
    const {
      name,
      code,
      discountPercent = 0,
      commissionPercent = 0,
      trialDays = 7,
      userId,
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const affiliate = await prisma.affiliatePartner.create({
      data: {
        name,
        code: code.toUpperCase(),
        discountPercent,
        commissionPercent,
        trialDays,
        userId: userId || null,
      },
    });

    res.status(201).json({
      success: true,
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        code: affiliate.code,
        discountPercent: affiliate.discountPercent,
        commissionPercent: affiliate.commissionPercent,
        trialDays: affiliate.trialDays,
      },
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Affiliate code already exists' });
    }
    console.error('Error creating affiliate:', error);
    res.status(500).json({ error: 'Failed to create affiliate' });
  }
});

/**
 * PATCH /api/admin/affiliates/:id
 * Update affiliate partner
 */
router.patch('/affiliates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      discountPercent,
      commissionPercent,
      trialDays,
      isActive,
    } = req.body;

    const affiliate = await prisma.affiliatePartner.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(discountPercent !== undefined && { discountPercent }),
        ...(commissionPercent !== undefined && { commissionPercent }),
        ...(trialDays !== undefined && { trialDays }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      success: true,
      affiliate,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Affiliate not found' });
    }
    console.error('Error updating affiliate:', error);
    res.status(500).json({ error: 'Failed to update affiliate' });
  }
});

/**
 * POST /api/admin/affiliates/:id/payout
 * Record payout to affiliate
 */
router.post('/affiliates/:id/payout', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const affiliate = await prisma.affiliatePartner.findUnique({
      where: { id },
    });

    if (!affiliate) {
      return res.status(404).json({ error: 'Affiliate not found' });
    }

    if (Number(affiliate.pendingPayout) < amount) {
      return res.status(400).json({
        error: 'Payout amount exceeds pending balance',
        pendingPayout: Number(affiliate.pendingPayout),
      });
    }

    await prisma.affiliatePartner.update({
      where: { id },
      data: {
        pendingPayout: {
          decrement: amount,
        },
        totalPaid: {
          increment: amount,
        },
      },
    });

    res.json({
      success: true,
      affiliateId: id,
      amount,
      newPendingPayout: Number(affiliate.pendingPayout) - amount,
      newTotalPaid: Number(affiliate.totalPaid) + amount,
    });
  } catch (error) {
    console.error('Error recording payout:', error);
    res.status(500).json({ error: 'Failed to record payout' });
  }
});

/**
 * GET /api/admin/promo-codes
 * List all promo codes
 */
router.get('/promo-codes', async (req: Request, res: Response) => {
  try {
    const { activeOnly = 'false' } = req.query;

    const promoCodes = await listPromoCodes({
      activeOnly: activeOnly === 'true',
    });

    res.json({ promoCodes });
  } catch (error) {
    console.error('Error listing promo codes:', error);
    res.status(500).json({ error: 'Failed to list promo codes' });
  }
});

/**
 * POST /api/admin/promo-codes
 * Create new promo code
 */
router.post('/promo-codes', async (req: Request, res: Response) => {
  try {
    const { code, type, value, maxUses, expiresAt } = req.body;

    if (!code || !type || value === undefined) {
      return res.status(400).json({
        error: 'Code, type, and value are required',
      });
    }

    const validTypes: PromoCodeType[] = ['trial_extension', 'discount', 'full_access'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid type',
        validTypes,
      });
    }

    const result = await createPromoCode({
      code,
      type,
      value,
      maxUses: maxUses || undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      success: true,
      promoCode: result.promoCode,
    });
  } catch (error) {
    console.error('Error creating promo code:', error);
    res.status(500).json({ error: 'Failed to create promo code' });
  }
});

/**
 * DELETE /api/admin/promo-codes/:code
 * Deactivate promo code
 */
router.delete('/promo-codes/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const result = await deactivatePromoCode(code);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json({
      success: true,
      code,
      message: 'Promo code deactivated',
    });
  } catch (error) {
    console.error('Error deactivating promo code:', error);
    res.status(500).json({ error: 'Failed to deactivate promo code' });
  }
});

/**
 * GET /api/admin/stats
 * Dashboard stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersThisMonth,
      premiumUsers,
      trialUsers,
      totalCharts,
      affiliateStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.user.count({
        where: { subscriptionStatus: 'premium' },
      }),
      prisma.user.count({
        where: { subscriptionStatus: 'trial' },
      }),
      prisma.chart.count(),
      prisma.affiliatePartner.aggregate({
        _sum: {
          clicks: true,
          signups: true,
          conversions: true,
          pendingPayout: true,
        },
      }),
    ]);

    // Calculate trial conversion rate
    const usersWithTrialUsed = await prisma.user.count({
      where: { trialUsed: true },
    });
    const trialConversionRate = usersWithTrialUsed > 0
      ? ((premiumUsers / usersWithTrialUsed) * 100).toFixed(2)
      : '0.00';

    res.json({
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        premium: premiumUsers,
        trial: trialUsers,
        free: totalUsers - premiumUsers - trialUsers,
      },
      content: {
        totalCharts,
      },
      affiliates: {
        totalClicks: affiliateStats._sum.clicks || 0,
        totalSignups: affiliateStats._sum.signups || 0,
        totalConversions: affiliateStats._sum.conversions || 0,
        pendingPayouts: Number(affiliateStats._sum.pendingPayout || 0),
      },
      conversion: {
        trialToSubscription: `${trialConversionRate}%`,
      },
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
