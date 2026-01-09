/**
 * Premium subscription middleware
 * Checks if user has premium access for protected endpoints
 */

import { Request, Response, NextFunction } from 'express';
import {
  getSubscriptionStatus,
  hasEntitlement,
  READING_ACCESS,
} from '../services/subscription/index.js';
import type { Entitlement } from '../services/subscription/types.js';

/**
 * Extract user ID from request
 * Checks query params, body, and auth headers
 */
function getUserIdFromRequest(req: Request): string {
  // Check query params first
  if (req.query.userId) {
    return req.query.userId as string;
  }

  // Check request body
  if (req.body?.userId) {
    return req.body.userId;
  }

  // Check auth header (JWT token would decode to user ID)
  // For now, use a placeholder - in production, decode JWT
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    // In production, decode JWT and extract user ID
    // For now, return anonymous
    return 'anonymous';
  }

  return 'anonymous';
}

/**
 * Middleware to require premium subscription
 * Returns 403 if user doesn't have premium access
 */
export function requirePremium(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = getUserIdFromRequest(req);

  getSubscriptionStatus(userId)
    .then((status) => {
      if (status.isPremium) {
        next();
        return;
      }

      res.status(403).json({
        success: false,
        error: 'Premium subscription required',
        message: 'This feature requires a Premium subscription. Upgrade to unlock all readings.',
        upgradeRequired: true,
        currentTier: status.tier,
      });
    })
    .catch((error) => {
      console.error('Error checking premium status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify subscription status',
      });
    });
}

/**
 * Middleware to require specific entitlement
 */
export function requireEntitlement(entitlement: Entitlement) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = getUserIdFromRequest(req);

    hasEntitlement(userId, entitlement)
      .then((hasAccess) => {
        if (hasAccess) {
          next();
          return;
        }

        res.status(403).json({
          success: false,
          error: 'Access denied',
          message: `This feature requires the ${entitlement} entitlement.`,
          requiredEntitlement: entitlement,
          upgradeRequired: true,
        });
      })
      .catch((error) => {
        console.error('Error checking entitlement:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to verify entitlement',
        });
      });
  };
}

/**
 * Middleware to check reading access based on category
 * Some readings are free, others require premium
 */
export function checkReadingAccess(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const category = req.params.category;
  const userId = getUserIdFromRequest(req);

  // Get access config for this category
  const accessConfig = READING_ACCESS[category];

  // If category not found or is free, allow access
  if (!accessConfig || accessConfig.accessLevel === 'free') {
    next();
    return;
  }

  // Category requires premium - check subscription
  getSubscriptionStatus(userId)
    .then((status) => {
      if (status.isPremium) {
        next();
        return;
      }

      res.status(403).json({
        success: false,
        error: 'Premium subscription required',
        message: `The ${category} reading requires a Premium subscription.`,
        category,
        upgradeRequired: true,
        currentTier: status.tier,
        freeCategories: Object.entries(READING_ACCESS)
          .filter(([, config]) => config.accessLevel === 'free')
          .map(([cat]) => cat),
      });
    })
    .catch((error) => {
      console.error('Error checking reading access:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify subscription status',
      });
    });
}

/**
 * Middleware to attach subscription info to request
 * Useful for routes that want subscription info but don't require premium
 */
export function attachSubscriptionInfo(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = getUserIdFromRequest(req);

  getSubscriptionStatus(userId)
    .then((status) => {
      // Attach to request for downstream handlers
      (req as any).subscriptionStatus = status;
      (req as any).isPremium = status.isPremium;
      (req as any).userId = userId;
      next();
    })
    .catch((error) => {
      console.error('Error fetching subscription info:', error);
      // Continue without subscription info
      (req as any).subscriptionStatus = null;
      (req as any).isPremium = false;
      (req as any).userId = userId;
      next();
    });
}

export default requirePremium;
