/**
 * Trial System Service
 * Handles free trial management
 */

import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

const DEFAULT_TRIAL_DAYS = 7;

export interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  endsAt: Date | null;
  hasUsedTrial: boolean;
}

/**
 * Start a free trial for a user
 */
export async function startTrial(
  userId: string,
  days: number = DEFAULT_TRIAL_DAYS
): Promise<{ success: boolean; error?: string; endsAt?: Date }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if user has already used their trial
    if (user.trialUsed) {
      return { success: false, error: 'Trial already used' };
    }

    // Check if user already has premium
    if (user.subscriptionStatus === 'premium' || user.subscriptionStatus === 'admin') {
      return { success: false, error: 'User already has premium access' };
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'trial',
        trialStartedAt: now,
        trialEndsAt: endsAt,
        trialUsed: true,
      },
    });

    console.log(`Trial started for user ${userId}, ends at ${endsAt}`);

    return { success: true, endsAt };
  } catch (error) {
    console.error('Error starting trial:', error);
    return { success: false, error: 'Failed to start trial' };
  }
}

/**
 * Extend an existing trial
 */
export async function extendTrial(
  userId: string,
  days: number
): Promise<{ success: boolean; error?: string; endsAt?: Date }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.subscriptionStatus !== 'trial' || !user.trialEndsAt) {
      return { success: false, error: 'User is not on a trial' };
    }

    const currentEnds = new Date(user.trialEndsAt);
    const newEndsAt = new Date(currentEnds.getTime() + days * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        trialEndsAt: newEndsAt,
      },
    });

    console.log(`Trial extended for user ${userId}, now ends at ${newEndsAt}`);

    return { success: true, endsAt: newEndsAt };
  } catch (error) {
    console.error('Error extending trial:', error);
    return { success: false, error: 'Failed to extend trial' };
  }
}

/**
 * Check trial status for a user
 */
export async function checkTrialStatus(userId: string): Promise<TrialStatus> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        isActive: false,
        daysRemaining: 0,
        endsAt: null,
        hasUsedTrial: false,
      };
    }

    const now = new Date();

    // Check if trial is active
    if (user.subscriptionStatus === 'trial' && user.trialEndsAt) {
      const endsAt = new Date(user.trialEndsAt);
      const isActive = endsAt > now;
      const daysRemaining = isActive
        ? Math.ceil((endsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        : 0;

      return {
        isActive,
        daysRemaining,
        endsAt,
        hasUsedTrial: user.trialUsed,
      };
    }

    return {
      isActive: false,
      daysRemaining: 0,
      endsAt: user.trialEndsAt,
      hasUsedTrial: user.trialUsed,
    };
  } catch (error) {
    console.error('Error checking trial status:', error);
    return {
      isActive: false,
      daysRemaining: 0,
      endsAt: null,
      hasUsedTrial: false,
    };
  }
}

/**
 * Expire all ended trials - meant to be run as a cron job
 */
export async function expireTrials(): Promise<{ expired: number }> {
  try {
    const now = new Date();

    const result = await prisma.user.updateMany({
      where: {
        subscriptionStatus: 'trial',
        trialEndsAt: {
          lt: now,
        },
      },
      data: {
        subscriptionStatus: 'free',
      },
    });

    if (result.count > 0) {
      console.log(`Expired ${result.count} trials`);
    }

    return { expired: result.count };
  } catch (error) {
    console.error('Error expiring trials:', error);
    return { expired: 0 };
  }
}

/**
 * Grant trial access for affiliate signup
 */
export async function grantAffiliateTrial(
  userId: string,
  affiliateCode: string,
  trialDays: number
): Promise<{ success: boolean; error?: string; endsAt?: Date }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // For affiliate signups, we allow trial even if trialUsed was set
    // as a special promotion
    if (user.subscriptionStatus === 'premium' || user.subscriptionStatus === 'admin') {
      return { success: false, error: 'User already has premium access' };
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'trial',
        trialStartedAt: now,
        trialEndsAt: endsAt,
        trialUsed: true,
        referredBy: affiliateCode,
      },
    });

    console.log(`Affiliate trial started for user ${userId} with code ${affiliateCode}, ends at ${endsAt}`);

    return { success: true, endsAt };
  } catch (error) {
    console.error('Error granting affiliate trial:', error);
    return { success: false, error: 'Failed to grant affiliate trial' };
  }
}
