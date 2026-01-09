/**
 * Role-Based Access Control Middleware
 * Handles user roles and access permissions
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

export type UserRole = 'user' | 'developer' | 'admin';

export interface AccessCheckResult {
  hasAccess: boolean;
  reason: string;
  role?: UserRole;
  subscriptionStatus?: string;
}

/**
 * Middleware to require specific roles
 */
export function requireRole(...roles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const userRole = user.role as UserRole;

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: roles,
          current: userRole,
        });
      }

      // Attach role to request for downstream use
      (req as any).userRole = userRole;
      next();
    } catch (error) {
      console.error('Error in requireRole middleware:', error);
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware to require developer or admin role
 */
export const requireDeveloper = requireRole('developer', 'admin');

/**
 * Check if user has access to premium features
 * Order of checks:
 * 1. Role is developer/admin → full access
 * 2. Active premium subscription → full access
 * 3. Active trial → full access
 * 4. Free user → limited access
 */
export async function checkAccess(userId: string): Promise<AccessCheckResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        trialEndsAt: true,
      },
    });

    if (!user) {
      return {
        hasAccess: false,
        reason: 'User not found',
      };
    }

    const role = user.role as UserRole;
    const now = new Date();

    // 1. Check role-based access (developer/admin)
    if (role === 'developer' || role === 'admin') {
      return {
        hasAccess: true,
        reason: `${role} role has full access`,
        role,
        subscriptionStatus: user.subscriptionStatus,
      };
    }

    // 2. Check active premium subscription
    if (user.subscriptionStatus === 'premium') {
      // Verify subscription hasn't expired
      if (!user.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) > now) {
        return {
          hasAccess: true,
          reason: 'Active premium subscription',
          role,
          subscriptionStatus: 'premium',
        };
      }
    }

    // 3. Check active trial
    if (user.subscriptionStatus === 'trial' && user.trialEndsAt) {
      if (new Date(user.trialEndsAt) > now) {
        return {
          hasAccess: true,
          reason: 'Active trial',
          role,
          subscriptionStatus: 'trial',
        };
      }
    }

    // 4. Free user - limited access
    return {
      hasAccess: false,
      reason: 'Free tier - upgrade for full access',
      role,
      subscriptionStatus: 'free',
    };
  } catch (error) {
    console.error('Error checking access:', error);
    return {
      hasAccess: false,
      reason: 'Access check failed',
    };
  }
}

/**
 * Middleware to check premium access
 * Blocks free users from premium features
 */
export function requirePremiumAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const access = await checkAccess(userId);

      if (!access.hasAccess) {
        return res.status(403).json({
          error: 'Premium access required',
          reason: access.reason,
          upgrade: true,
        });
      }

      // Attach access info to request
      (req as any).accessInfo = access;
      next();
    } catch (error) {
      console.error('Error in requirePremiumAccess middleware:', error);
      return res.status(500).json({ error: 'Access check failed' });
    }
  };
}

/**
 * Set user role (admin only)
 */
export async function setUserRole(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    console.log(`User ${userId} role updated to ${role}`);
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2025') {
      return { success: false, error: 'User not found' };
    }
    console.error('Error setting user role:', error);
    return { success: false, error: 'Failed to update role' };
  }
}

/**
 * Grant premium manually (admin only)
 */
export async function grantPremium(
  userId: string,
  days: number,
  reason: string
): Promise<{ success: boolean; error?: string; expiresAt?: Date }> {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'premium',
        subscriptionExpiresAt: expiresAt,
        subscriptionProvider: 'manual',
      },
    });

    console.log(`Premium granted to user ${userId} for ${days} days. Reason: ${reason}`);

    return { success: true, expiresAt };
  } catch (error: any) {
    if (error.code === 'P2025') {
      return { success: false, error: 'User not found' };
    }
    console.error('Error granting premium:', error);
    return { success: false, error: 'Failed to grant premium' };
  }
}
