/**
 * RevenueCat Service
 * Handles in-app purchases and subscription management
 */

import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys
const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

// Entitlement identifier
export const PREMIUM_ENTITLEMENT = 'premium_access';

// Product identifiers
export const PRODUCTS = {
  MONTHLY: 'jyotish_premium_monthly',
  ANNUAL: 'jyotish_premium_annual',
} as const;

let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Should be called after user authentication
 */
export async function initializeRevenueCat(userId?: string): Promise<void> {
  if (isInitialized) {
    console.log('RevenueCat already initialized');
    return;
  }

  const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

  if (!apiKey) {
    console.warn('RevenueCat API key not configured for', Platform.OS);
    return;
  }

  try {
    // Configure SDK
    Purchases.configure({
      apiKey,
      appUserID: userId || null,
    });

    // Set log level in development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    isInitialized = true;
    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    throw error;
  }
}

/**
 * Set user ID for RevenueCat
 * Call this after user logs in
 */
export async function setRevenueCatUserId(userId: string): Promise<CustomerInfo> {
  try {
    const customerInfo = await Purchases.logIn(userId);
    return customerInfo.customerInfo;
  } catch (error) {
    console.error('Failed to set RevenueCat user ID:', error);
    throw error;
  }
}

/**
 * Clear user ID on logout
 */
export async function clearRevenueCatUser(): Promise<void> {
  try {
    await Purchases.logOut();
  } catch (error) {
    console.error('Failed to log out from RevenueCat:', error);
  }
}

/**
 * Get current customer info
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Failed to get customer info:', error);
    throw error;
  }
}

/**
 * Check if user has premium access
 */
export async function checkPremiumStatus(): Promise<{
  isPremium: boolean;
  expiresAt: Date | null;
  willRenew: boolean;
}> {
  try {
    const customerInfo = await getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];

    if (entitlement) {
      return {
        isPremium: true,
        expiresAt: entitlement.expirationDate
          ? new Date(entitlement.expirationDate)
          : null,
        willRenew: !entitlement.willRenew === false,
      };
    }

    return {
      isPremium: false,
      expiresAt: null,
      willRenew: false,
    };
  } catch (error) {
    console.error('Failed to check premium status:', error);
    return {
      isPremium: false,
      expiresAt: null,
      willRenew: false,
    };
  }
}

/**
 * Get available subscription offerings
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return null;
  }
}

/**
 * Get available packages
 */
export async function getPackages(): Promise<PurchasesPackage[]> {
  try {
    const offering = await getOfferings();
    return offering?.availablePackages || [];
  } catch (error) {
    console.error('Failed to get packages:', error);
    return [];
  }
}

/**
 * Purchase a subscription package
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);

    const hasPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];

    return {
      success: !!hasPremium,
      customerInfo,
    };
  } catch (error: any) {
    // Check if user cancelled
    if (error.userCancelled) {
      return {
        success: false,
        error: 'Purchase cancelled',
      };
    }

    console.error('Purchase failed:', error);
    return {
      success: false,
      error: error.message || 'Purchase failed',
    };
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  isPremium: boolean;
  error?: string;
}> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const hasPremium = !!customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];

    return {
      success: true,
      isPremium: hasPremium,
    };
  } catch (error: any) {
    console.error('Restore failed:', error);
    return {
      success: false,
      isPremium: false,
      error: error.message || 'Failed to restore purchases',
    };
  }
}

/**
 * Add listener for customer info updates
 */
export function addCustomerInfoListener(
  callback: (customerInfo: CustomerInfo) => void
): () => void {
  const listener = Purchases.addCustomerInfoUpdateListener(callback);
  return () => listener.remove();
}

/**
 * Format price for display
 */
export function formatPrice(pkg: PurchasesPackage): string {
  return pkg.product.priceString;
}

/**
 * Get subscription period text
 */
export function getSubscriptionPeriod(pkg: PurchasesPackage): string {
  const identifier = pkg.identifier;

  if (identifier.includes('monthly')) {
    return 'month';
  }
  if (identifier.includes('annual') || identifier.includes('yearly')) {
    return 'year';
  }
  if (identifier.includes('weekly')) {
    return 'week';
  }

  return 'period';
}

/**
 * Calculate savings percentage for annual vs monthly
 */
export function calculateSavings(
  monthlyPkg: PurchasesPackage,
  annualPkg: PurchasesPackage
): number {
  const monthlyPrice = monthlyPkg.product.price;
  const annualPrice = annualPkg.product.price;
  const annualMonthlyEquivalent = annualPrice / 12;

  const savings = ((monthlyPrice - annualMonthlyEquivalent) / monthlyPrice) * 100;
  return Math.round(savings);
}

export default {
  initializeRevenueCat,
  setRevenueCatUserId,
  clearRevenueCatUser,
  getCustomerInfo,
  checkPremiumStatus,
  getOfferings,
  getPackages,
  purchasePackage,
  restorePurchases,
  addCustomerInfoListener,
  formatPrice,
  getSubscriptionPeriod,
  calculateSavings,
};
