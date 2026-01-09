/**
 * RevenueCat API Client
 * Handles subscription verification and webhook processing
 */

import crypto from 'crypto';
import {
  SubscriptionStatus,
  SubscriptionTier,
  Entitlement,
  RevenueCatSubscriber,
  RevenueCatWebhookPayload,
  WebhookEventType,
  FREE_QUESTION_LIMIT,
} from './types.js';

const REVENUECAT_API_URL = 'https://api.revenuecat.com/v1';
const REVENUECAT_API_KEY = process.env.REVENUECAT_API_KEY || '';
const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET || '';

// In-memory store for subscription status (replace with database in production)
const subscriptionStore = new Map<string, SubscriptionStatus>();
const questionUsageStore = new Map<string, { count: number; resetAt: Date }>();

/**
 * Check if RevenueCat is configured
 */
export function isRevenueCatConfigured(): boolean {
  return !!REVENUECAT_API_KEY;
}

/**
 * Get subscriber info from RevenueCat API
 */
export async function getSubscriber(userId: string): Promise<RevenueCatSubscriber | null> {
  if (!isRevenueCatConfigured()) {
    console.warn('RevenueCat API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${REVENUECAT_API_URL}/subscribers/${userId}`, {
      headers: {
        Authorization: `Bearer ${REVENUECAT_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // New user, no subscription record
        return null;
      }
      throw new Error(`RevenueCat API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching RevenueCat subscriber:', error);
    return null;
  }
}

/**
 * Get subscription status for a user
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  // Check in-memory cache first
  const cached = subscriptionStore.get(userId);
  if (cached && cached.expiresAt && new Date(cached.expiresAt) > new Date()) {
    return cached;
  }

  // Default free status
  const defaultStatus: SubscriptionStatus = {
    isPremium: false,
    tier: 'free',
    expiresAt: null,
    provider: null,
    entitlements: [],
  };

  if (!isRevenueCatConfigured()) {
    return defaultStatus;
  }

  try {
    const subscriber = await getSubscriber(userId);
    if (!subscriber) {
      return defaultStatus;
    }

    const status = parseSubscriberStatus(subscriber);
    subscriptionStore.set(userId, status);
    return status;
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return defaultStatus;
  }
}

/**
 * Parse RevenueCat subscriber data into SubscriptionStatus
 */
function parseSubscriberStatus(subscriber: RevenueCatSubscriber): SubscriptionStatus {
  const entitlements = subscriber.subscriber.entitlements;
  const hasPremiuimAccess = 'premium_access' in entitlements;

  if (!hasPremiuimAccess) {
    return {
      isPremium: false,
      tier: 'free',
      expiresAt: null,
      provider: null,
      entitlements: [],
    };
  }

  const premiumEntitlement = entitlements['premium_access'];
  const expiresAt = premiumEntitlement.expires_date
    ? new Date(premiumEntitlement.expires_date)
    : null;

  // Check if subscription is still active
  const isActive = !expiresAt || expiresAt > new Date();

  const userEntitlements: Entitlement[] = [];
  if (isActive) {
    userEntitlements.push('premium_access');
    userEntitlements.push('unlimited_questions');
    userEntitlements.push('all_readings');
  }

  return {
    isPremium: isActive,
    tier: isActive ? 'premium' : 'free',
    expiresAt,
    provider: 'revenuecat',
    entitlements: userEntitlements,
  };
}

/**
 * Verify webhook signature from RevenueCat
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!REVENUECAT_WEBHOOK_SECRET) {
    console.warn('RevenueCat webhook secret not configured');
    // In development, allow unsigned webhooks
    return process.env.NODE_ENV === 'development';
  }

  const expectedSignature = crypto
    .createHmac('sha256', REVENUECAT_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Handle webhook events from RevenueCat
 */
export async function handleWebhookEvent(
  payload: RevenueCatWebhookPayload
): Promise<{ success: boolean; message: string }> {
  const { event } = payload;
  const userId = event.app_user_id;
  const eventType = event.type;

  console.log(`Processing RevenueCat webhook: ${eventType} for user ${userId}`);

  switch (eventType) {
    case 'INITIAL_PURCHASE':
      return handleInitialPurchase(userId, event);

    case 'RENEWAL':
      return handleRenewal(userId, event);

    case 'CANCELLATION':
      return handleCancellation(userId, event);

    case 'EXPIRATION':
      return handleExpiration(userId, event);

    case 'UNCANCELLATION':
      return handleUncancellation(userId, event);

    case 'BILLING_ISSUE':
      return handleBillingIssue(userId, event);

    case 'PRODUCT_CHANGE':
      return handleProductChange(userId, event);

    default:
      console.log(`Unhandled webhook event type: ${eventType}`);
      return { success: true, message: `Event ${eventType} acknowledged` };
  }
}

/**
 * Handle initial purchase event
 */
async function handleInitialPurchase(
  userId: string,
  event: RevenueCatWebhookPayload['event']
): Promise<{ success: boolean; message: string }> {
  const expiresAt = event.expiration_at_ms
    ? new Date(event.expiration_at_ms)
    : null;

  const status: SubscriptionStatus = {
    isPremium: true,
    tier: determineTier(event.product_id),
    expiresAt,
    provider: 'revenuecat',
    entitlements: ['premium_access', 'unlimited_questions', 'all_readings'],
  };

  subscriptionStore.set(userId, status);

  // TODO: Update database when Prisma is set up
  console.log(`User ${userId} subscribed to ${status.tier}`);

  return {
    success: true,
    message: `Initial purchase processed for user ${userId}`,
  };
}

/**
 * Handle subscription renewal event
 */
async function handleRenewal(
  userId: string,
  event: RevenueCatWebhookPayload['event']
): Promise<{ success: boolean; message: string }> {
  const expiresAt = event.expiration_at_ms
    ? new Date(event.expiration_at_ms)
    : null;

  const existing = subscriptionStore.get(userId);
  if (existing) {
    existing.expiresAt = expiresAt;
    subscriptionStore.set(userId, existing);
  } else {
    const status: SubscriptionStatus = {
      isPremium: true,
      tier: determineTier(event.product_id),
      expiresAt,
      provider: 'revenuecat',
      entitlements: ['premium_access', 'unlimited_questions', 'all_readings'],
    };
    subscriptionStore.set(userId, status);
  }

  console.log(`User ${userId} subscription renewed until ${expiresAt}`);

  return {
    success: true,
    message: `Renewal processed for user ${userId}`,
  };
}

/**
 * Handle cancellation event (user cancelled but still has access until expiry)
 */
async function handleCancellation(
  userId: string,
  event: RevenueCatWebhookPayload['event']
): Promise<{ success: boolean; message: string }> {
  // User still has access until expiration_at_ms
  console.log(`User ${userId} cancelled subscription, expires at ${event.expiration_at_ms}`);

  return {
    success: true,
    message: `Cancellation processed for user ${userId}`,
  };
}

/**
 * Handle expiration event (subscription access ended)
 */
async function handleExpiration(
  userId: string,
  event: RevenueCatWebhookPayload['event']
): Promise<{ success: boolean; message: string }> {
  const status: SubscriptionStatus = {
    isPremium: false,
    tier: 'free',
    expiresAt: null,
    provider: null,
    entitlements: [],
  };

  subscriptionStore.set(userId, status);

  // Reset question count for downgraded user
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  nextMonth.setHours(0, 0, 0, 0);

  questionUsageStore.set(userId, { count: 0, resetAt: nextMonth });

  console.log(`User ${userId} subscription expired, downgraded to free`);

  return {
    success: true,
    message: `Expiration processed for user ${userId}`,
  };
}

/**
 * Handle uncancellation event (user re-subscribed before expiry)
 */
async function handleUncancellation(
  userId: string,
  event: RevenueCatWebhookPayload['event']
): Promise<{ success: boolean; message: string }> {
  console.log(`User ${userId} uncancelled subscription`);

  return {
    success: true,
    message: `Uncancellation processed for user ${userId}`,
  };
}

/**
 * Handle billing issue event
 */
async function handleBillingIssue(
  userId: string,
  event: RevenueCatWebhookPayload['event']
): Promise<{ success: boolean; message: string }> {
  // User may have grace period
  console.log(`User ${userId} has billing issue`);

  return {
    success: true,
    message: `Billing issue noted for user ${userId}`,
  };
}

/**
 * Handle product change event (upgrade/downgrade)
 */
async function handleProductChange(
  userId: string,
  event: RevenueCatWebhookPayload['event']
): Promise<{ success: boolean; message: string }> {
  const newTier = determineTier(event.product_id);
  const existing = subscriptionStore.get(userId);

  if (existing) {
    existing.tier = newTier;
    subscriptionStore.set(userId, existing);
  }

  console.log(`User ${userId} changed to ${newTier} plan`);

  return {
    success: true,
    message: `Product change processed for user ${userId}`,
  };
}

/**
 * Determine subscription tier from product ID
 */
function determineTier(productId: string): SubscriptionTier {
  if (productId.includes('pro')) {
    return 'pro';
  }
  if (productId.includes('premium')) {
    return 'premium';
  }
  return 'free';
}

/**
 * Check if user has specific entitlement
 */
export async function hasEntitlement(
  userId: string,
  entitlement: Entitlement
): Promise<boolean> {
  const status = await getSubscriptionStatus(userId);
  return status.entitlements.includes(entitlement);
}

/**
 * Check if user has premium access
 */
export async function hasPremiumAccess(userId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(userId);
  return status.isPremium;
}

/**
 * Get question usage for a user
 */
export function getQuestionUsage(userId: string): { count: number; resetAt: Date; remaining: number } {
  const usage = questionUsageStore.get(userId);
  const now = new Date();

  // Calculate next reset date (first of next month)
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  nextMonth.setHours(0, 0, 0, 0);

  if (!usage || usage.resetAt <= now) {
    // Reset if no usage or past reset date
    const newUsage = { count: 0, resetAt: nextMonth };
    questionUsageStore.set(userId, newUsage);
    return { ...newUsage, remaining: FREE_QUESTION_LIMIT };
  }

  return {
    count: usage.count,
    resetAt: usage.resetAt,
    remaining: Math.max(0, FREE_QUESTION_LIMIT - usage.count),
  };
}

/**
 * Increment question usage for a user
 */
export function incrementQuestionUsage(userId: string): { count: number; remaining: number } {
  const usage = getQuestionUsage(userId);
  const newCount = usage.count + 1;

  questionUsageStore.set(userId, {
    count: newCount,
    resetAt: usage.resetAt,
  });

  return {
    count: newCount,
    remaining: Math.max(0, FREE_QUESTION_LIMIT - newCount),
  };
}

/**
 * Check if user can ask a question (has premium or remaining free questions)
 */
export async function canAskQuestion(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  remaining?: number;
}> {
  const status = await getSubscriptionStatus(userId);

  // Premium users have unlimited questions
  if (status.isPremium) {
    return { allowed: true };
  }

  // Free users have limited questions
  const usage = getQuestionUsage(userId);
  if (usage.remaining > 0) {
    return { allowed: true, remaining: usage.remaining };
  }

  return {
    allowed: false,
    reason: 'Monthly question limit reached. Upgrade to Premium for unlimited questions.',
    remaining: 0,
  };
}

/**
 * Clear subscription cache for a user (useful after webhook updates)
 */
export function clearSubscriptionCache(userId: string): void {
  subscriptionStore.delete(userId);
}

/**
 * Export stores for testing
 */
export const _testing = {
  subscriptionStore,
  questionUsageStore,
};
