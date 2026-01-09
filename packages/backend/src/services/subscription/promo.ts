/**
 * Promo Code Service
 * Handles promotional codes validation and redemption
 */

import { PrismaClient } from '../../generated/prisma/index.js';
import { extendTrial } from './trial.js';

const prisma = new PrismaClient();

export type PromoCodeType = 'trial_extension' | 'discount' | 'full_access';

export interface PromoCodeInfo {
  id: string;
  code: string;
  type: PromoCodeType;
  value: number;
  isValid: boolean;
  reason?: string;
}

export interface ApplyCodeResult {
  success: boolean;
  error?: string;
  benefits?: {
    type: PromoCodeType;
    value: number;
    description: string;
  };
}

/**
 * Validate a promo code
 */
export async function validateCode(code: string): Promise<PromoCodeInfo | null> {
  try {
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      return null;
    }

    const now = new Date();
    let isValid = promoCode.isActive;
    let reason: string | undefined;

    // Check if expired
    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < now) {
      isValid = false;
      reason = 'Promo code has expired';
    }

    // Check if max uses reached
    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      isValid = false;
      reason = 'Promo code has reached maximum uses';
    }

    return {
      id: promoCode.id,
      code: promoCode.code,
      type: promoCode.type as PromoCodeType,
      value: promoCode.value,
      isValid,
      reason,
    };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return null;
  }
}

/**
 * Apply a promo code to a user
 */
export async function applyCode(
  userId: string,
  code: string
): Promise<ApplyCodeResult> {
  try {
    const promoInfo = await validateCode(code);

    if (!promoInfo) {
      return { success: false, error: 'Invalid promo code' };
    }

    if (!promoInfo.isValid) {
      return { success: false, error: promoInfo.reason || 'Code is not valid' };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Apply based on type
    switch (promoInfo.type) {
      case 'trial_extension': {
        const result = await extendTrial(userId, promoInfo.value);
        if (!result.success) {
          return { success: false, error: result.error };
        }

        // Increment usage
        await incrementUsage(promoInfo.id);

        return {
          success: true,
          benefits: {
            type: 'trial_extension',
            value: promoInfo.value,
            description: `Trial extended by ${promoInfo.value} days`,
          },
        };
      }

      case 'discount': {
        // For discounts, we just validate and return the info
        // The discount is applied at checkout via RevenueCat
        await incrementUsage(promoInfo.id);

        return {
          success: true,
          benefits: {
            type: 'discount',
            value: promoInfo.value,
            description: `${promoInfo.value}% off your purchase`,
          },
        };
      }

      case 'full_access': {
        // Grant premium for X days
        const now = new Date();
        const expiresAt = new Date(now.getTime() + promoInfo.value * 24 * 60 * 60 * 1000);

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: 'premium',
            subscriptionExpiresAt: expiresAt,
            subscriptionProvider: 'promo',
          },
        });

        await incrementUsage(promoInfo.id);

        return {
          success: true,
          benefits: {
            type: 'full_access',
            value: promoInfo.value,
            description: `Premium access granted for ${promoInfo.value} days`,
          },
        };
      }

      default:
        return { success: false, error: 'Unknown promo code type' };
    }
  } catch (error) {
    console.error('Error applying promo code:', error);
    return { success: false, error: 'Failed to apply promo code' };
  }
}

/**
 * Increment usage count for a promo code
 */
async function incrementUsage(promoId: string): Promise<void> {
  await prisma.promoCode.update({
    where: { id: promoId },
    data: {
      usedCount: {
        increment: 1,
      },
    },
  });
}

/**
 * Create a new promo code (admin only)
 */
export async function createPromoCode(params: {
  code: string;
  type: PromoCodeType;
  value: number;
  maxUses?: number;
  expiresAt?: Date;
}): Promise<{ success: boolean; promoCode?: PromoCodeInfo; error?: string }> {
  try {
    const promoCode = await prisma.promoCode.create({
      data: {
        code: params.code.toUpperCase(),
        type: params.type,
        value: params.value,
        maxUses: params.maxUses ?? null,
        expiresAt: params.expiresAt ?? null,
        isActive: true,
      },
    });

    return {
      success: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        type: promoCode.type as PromoCodeType,
        value: promoCode.value,
        isValid: true,
      },
    };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Promo code already exists' };
    }
    console.error('Error creating promo code:', error);
    return { success: false, error: 'Failed to create promo code' };
  }
}

/**
 * Deactivate a promo code (admin only)
 */
export async function deactivatePromoCode(
  codeOrId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Try to find by code first, then by id
    const promoCode = await prisma.promoCode.findFirst({
      where: {
        OR: [{ code: codeOrId.toUpperCase() }, { id: codeOrId }],
      },
    });

    if (!promoCode) {
      return { success: false, error: 'Promo code not found' };
    }

    await prisma.promoCode.update({
      where: { id: promoCode.id },
      data: { isActive: false },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deactivating promo code:', error);
    return { success: false, error: 'Failed to deactivate promo code' };
  }
}

/**
 * List all promo codes (admin only)
 */
export async function listPromoCodes(params?: {
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<PromoCodeInfo[]> {
  try {
    const promoCodes = await prisma.promoCode.findMany({
      where: params?.activeOnly ? { isActive: true } : undefined,
      take: params?.limit ?? 100,
      skip: params?.offset ?? 0,
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    return promoCodes.map((pc) => ({
      id: pc.id,
      code: pc.code,
      type: pc.type as PromoCodeType,
      value: pc.value,
      isValid:
        pc.isActive &&
        (!pc.expiresAt || new Date(pc.expiresAt) > now) &&
        (!pc.maxUses || pc.usedCount < pc.maxUses),
    }));
  } catch (error) {
    console.error('Error listing promo codes:', error);
    return [];
  }
}
