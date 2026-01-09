/**
 * Subscription service types
 */

export type SubscriptionTier = 'free' | 'premium' | 'pro';

export type SubscriptionProvider = 'revenuecat' | 'stripe' | 'manual';

export interface SubscriptionStatus {
  isPremium: boolean;
  tier: SubscriptionTier;
  expiresAt: Date | null;
  provider: SubscriptionProvider | null;
  entitlements: Entitlement[];
}

export type Entitlement = 'premium_access' | 'unlimited_questions' | 'all_readings';

export interface UserSubscription {
  userId: string;
  status: SubscriptionStatus;
  revenuecatId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// RevenueCat specific types
export interface RevenueCatSubscriber {
  request_date: string;
  request_date_ms: number;
  subscriber: {
    entitlements: Record<string, RevenueCatEntitlement>;
    first_seen: string;
    management_url: string | null;
    non_subscriptions: Record<string, unknown>;
    original_app_user_id: string;
    original_application_version: string | null;
    original_purchase_date: string | null;
    other_purchases: Record<string, unknown>;
    subscriptions: Record<string, RevenueCatSubscription>;
  };
}

export interface RevenueCatEntitlement {
  expires_date: string | null;
  grace_period_expires_date: string | null;
  product_identifier: string;
  purchase_date: string;
}

export interface RevenueCatSubscription {
  auto_resume_date: string | null;
  billing_issues_detected_at: string | null;
  expires_date: string;
  grace_period_expires_date: string | null;
  is_sandbox: boolean;
  original_purchase_date: string;
  ownership_type: 'PURCHASED' | 'FAMILY_SHARED';
  period_type: 'normal' | 'trial' | 'intro';
  purchase_date: string;
  refunded_at: string | null;
  store: 'app_store' | 'play_store' | 'stripe' | 'promotional';
  unsubscribe_detected_at: string | null;
}

// Webhook types
export type WebhookEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'NON_RENEWING_PURCHASE'
  | 'SUBSCRIPTION_PAUSED'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE'
  | 'TRANSFER';

export interface RevenueCatWebhookPayload {
  api_version: string;
  event: {
    aliases: string[];
    app_id: string;
    app_user_id: string;
    commission_percentage: number;
    country_code: string;
    currency: string;
    entitlement_id: string | null;
    entitlement_ids: string[];
    environment: 'SANDBOX' | 'PRODUCTION';
    event_timestamp_ms: number;
    expiration_at_ms: number;
    id: string;
    is_family_share: boolean;
    offer_code: string | null;
    original_app_user_id: string;
    original_transaction_id: string;
    period_type: 'NORMAL' | 'TRIAL' | 'INTRO';
    presented_offering_id: string | null;
    price: number;
    price_in_purchased_currency: number;
    product_id: string;
    purchased_at_ms: number;
    store: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL';
    subscriber_attributes: Record<string, { value: string; updated_at_ms: number }>;
    takehome_percentage: number;
    tax_percentage: number;
    transaction_id: string;
    type: WebhookEventType;
  };
}

// Reading access configuration
export interface ReadingAccessConfig {
  category: string;
  accessLevel: 'free' | 'premium';
  freePreview?: boolean;
}

export const READING_ACCESS: Record<string, ReadingAccessConfig> = {
  summary: { category: 'summary', accessLevel: 'free' },
  love: { category: 'love', accessLevel: 'free', freePreview: true },
  career: { category: 'career', accessLevel: 'premium' },
  finances: { category: 'finances', accessLevel: 'premium' },
  health: { category: 'health', accessLevel: 'premium' },
  timeline: { category: 'timeline', accessLevel: 'premium' },
};

export const FREE_QUESTION_LIMIT = 5;
