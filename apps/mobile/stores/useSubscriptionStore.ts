/**
 * Subscription Store
 * Manages subscription state and actions using Zustand
 */

import { create } from 'zustand';
import { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import {
  initializeRevenueCat,
  checkPremiumStatus,
  getPackages,
  purchasePackage,
  restorePurchases,
  addCustomerInfoListener,
  PREMIUM_ENTITLEMENT,
} from '../services/subscription/revenuecat';
import { apiClient } from '../services/api/client';

// Reading categories and their access levels
export const READING_ACCESS = {
  summary: 'free',
  love: 'free',
  career: 'premium',
  finances: 'premium',
  health: 'premium',
  timeline: 'premium',
} as const;

export type ReadingCategory = keyof typeof READING_ACCESS;
export type AccessLevel = 'free' | 'premium';

interface SubscriptionState {
  // Status
  isPremium: boolean;
  tier: 'free' | 'trial' | 'premium' | 'pro';
  expiresAt: Date | null;
  willRenew: boolean;

  // Trial status
  isTrialing: boolean;
  trialDaysRemaining: number;
  trialEndsAt: Date | null;
  hasUsedTrial: boolean;

  // Question usage for free users
  questionsRemaining: number;
  questionsLimit: number;
  questionResetAt: Date | null;

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;

  // Packages
  packages: PurchasesPackage[];
  monthlyPackage: PurchasesPackage | null;
  annualPackage: PurchasesPackage | null;

  // Error
  error: string | null;
}

interface SubscriptionActions {
  // Initialization
  initialize: (userId?: string) => Promise<void>;

  // Status checks
  checkStatus: () => Promise<void>;
  syncWithBackend: (userId: string) => Promise<void>;
  checkTrialStatus: (userId: string) => Promise<void>;

  // Purchases
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;

  // Question usage
  refreshQuestionUsage: (userId: string) => Promise<void>;
  decrementQuestions: () => void;

  // Helpers
  hasAccess: (category: ReadingCategory) => boolean;
  canAskQuestion: () => boolean;
  hasPremiumOrTrial: () => boolean;

  // Clear
  reset: () => void;
}

const initialState: SubscriptionState = {
  isPremium: false,
  tier: 'free',
  expiresAt: null,
  willRenew: false,
  isTrialing: false,
  trialDaysRemaining: 0,
  trialEndsAt: null,
  hasUsedTrial: false,
  questionsRemaining: 5,
  questionsLimit: 5,
  questionResetAt: null,
  isLoading: false,
  isInitialized: false,
  isPurchasing: false,
  isRestoring: false,
  packages: [],
  monthlyPackage: null,
  annualPackage: null,
  error: null,
};

export const useSubscriptionStore = create<SubscriptionState & SubscriptionActions>(
  (set, get) => ({
    ...initialState,

    /**
     * Initialize RevenueCat and check subscription status
     */
    initialize: async (userId?: string) => {
      if (get().isInitialized) return;

      set({ isLoading: true, error: null });

      try {
        // Initialize RevenueCat SDK
        await initializeRevenueCat(userId);

        // Check current subscription status
        const status = await checkPremiumStatus();
        set({
          isPremium: status.isPremium,
          tier: status.isPremium ? 'premium' : 'free',
          expiresAt: status.expiresAt,
          willRenew: status.willRenew,
        });

        // Load available packages
        const packages = await getPackages();
        const monthlyPkg = packages.find(
          (p) => p.identifier.includes('monthly')
        ) || null;
        const annualPkg = packages.find(
          (p) => p.identifier.includes('annual') || p.identifier.includes('yearly')
        ) || null;

        set({
          packages,
          monthlyPackage: monthlyPkg,
          annualPackage: annualPkg,
        });

        // Set up listener for subscription changes
        addCustomerInfoListener((customerInfo: CustomerInfo) => {
          const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];
          set({
            isPremium: !!entitlement,
            tier: entitlement ? 'premium' : 'free',
            expiresAt: entitlement?.expirationDate
              ? new Date(entitlement.expirationDate)
              : null,
            willRenew: entitlement ? !entitlement.willRenew === false : false,
          });
        });

        set({ isInitialized: true, isLoading: false });
      } catch (error) {
        console.error('Failed to initialize subscription:', error);
        set({
          isLoading: false,
          error: 'Failed to initialize subscription',
          isInitialized: true,
        });
      }
    },

    /**
     * Check current subscription status
     */
    checkStatus: async () => {
      set({ isLoading: true, error: null });

      try {
        const status = await checkPremiumStatus();
        set({
          isPremium: status.isPremium,
          tier: status.isPremium ? 'premium' : 'free',
          expiresAt: status.expiresAt,
          willRenew: status.willRenew,
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to check status:', error);
        set({ isLoading: false, error: 'Failed to check subscription status' });
      }
    },

    /**
     * Sync subscription status with backend
     */
    syncWithBackend: async (userId: string) => {
      try {
        const response = await apiClient.getSubscriptionStatus(userId);

        const isPremiumOrTrial = response.isPremium || response.tier === 'trial';

        set({
          isPremium: response.isPremium,
          tier: response.tier as 'free' | 'trial' | 'premium' | 'pro',
        });

        // Check trial status
        await get().checkTrialStatus(userId);

        // Refresh question usage for free users (not premium or trial)
        if (!isPremiumOrTrial) {
          await get().refreshQuestionUsage(userId);
        } else {
          // Premium/trial users have unlimited questions
          set({ questionsRemaining: -1 });
        }
      } catch (error) {
        console.error('Failed to sync with backend:', error);
      }
    },

    /**
     * Check trial status from backend
     */
    checkTrialStatus: async (userId: string) => {
      try {
        const trialStatus = await apiClient.getTrialStatus(userId);

        set({
          isTrialing: trialStatus.isActive,
          trialDaysRemaining: trialStatus.daysRemaining,
          trialEndsAt: trialStatus.endsAt ? new Date(trialStatus.endsAt) : null,
          hasUsedTrial: trialStatus.hasUsedTrial,
        });

        // If trial is active, set tier and grant access
        if (trialStatus.isActive) {
          set({
            tier: 'trial',
            questionsRemaining: -1, // Unlimited during trial
          });
        }
      } catch (error) {
        console.error('Failed to check trial status:', error);
      }
    },

    /**
     * Purchase a subscription package
     */
    purchase: async (pkg: PurchasesPackage) => {
      set({ isPurchasing: true, error: null });

      try {
        const result = await purchasePackage(pkg);

        if (result.success && result.customerInfo) {
          const entitlement =
            result.customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];

          set({
            isPremium: !!entitlement,
            tier: entitlement ? 'premium' : 'free',
            expiresAt: entitlement?.expirationDate
              ? new Date(entitlement.expirationDate)
              : null,
            willRenew: entitlement ? !entitlement.willRenew === false : false,
            isPurchasing: false,
            questionsRemaining: -1, // Unlimited for premium
          });

          return true;
        }

        set({
          isPurchasing: false,
          error: result.error || 'Purchase failed',
        });
        return false;
      } catch (error) {
        console.error('Purchase error:', error);
        set({
          isPurchasing: false,
          error: 'Purchase failed. Please try again.',
        });
        return false;
      }
    },

    /**
     * Restore previous purchases
     */
    restore: async () => {
      set({ isRestoring: true, error: null });

      try {
        const result = await restorePurchases();

        if (result.success) {
          set({
            isPremium: result.isPremium,
            tier: result.isPremium ? 'premium' : 'free',
            isRestoring: false,
            questionsRemaining: result.isPremium ? -1 : get().questionsRemaining,
          });

          // Check full status after restore
          await get().checkStatus();

          return result.isPremium;
        }

        set({
          isRestoring: false,
          error: result.error || 'No purchases to restore',
        });
        return false;
      } catch (error) {
        console.error('Restore error:', error);
        set({
          isRestoring: false,
          error: 'Failed to restore purchases',
        });
        return false;
      }
    },

    /**
     * Refresh question usage from backend
     */
    refreshQuestionUsage: async (userId: string) => {
      try {
        const usage = await apiClient.getRemainingQuestions(userId);

        set({
          questionsRemaining: usage.questionsRemaining,
          questionsLimit: usage.limit,
          questionResetAt: usage.resetAt ? new Date(usage.resetAt) : null,
        });
      } catch (error) {
        console.error('Failed to refresh question usage:', error);
      }
    },

    /**
     * Decrement question count locally
     */
    decrementQuestions: () => {
      const { isPremium, questionsRemaining } = get();
      if (!isPremium && questionsRemaining > 0) {
        set({ questionsRemaining: questionsRemaining - 1 });
      }
    },

    /**
     * Check if user has access to a reading category
     */
    hasAccess: (category: ReadingCategory) => {
      const { isPremium, isTrialing } = get();
      const accessLevel = READING_ACCESS[category];

      if (accessLevel === 'free') return true;
      return isPremium || isTrialing;
    },

    /**
     * Check if user can ask a question
     */
    canAskQuestion: () => {
      const { isPremium, isTrialing, questionsRemaining } = get();
      if (isPremium || isTrialing) return true;
      return questionsRemaining > 0;
    },

    /**
     * Check if user has premium or active trial
     */
    hasPremiumOrTrial: () => {
      const { isPremium, isTrialing } = get();
      return isPremium || isTrialing;
    },

    /**
     * Reset store to initial state
     */
    reset: () => {
      set(initialState);
    },
  })
);

export default useSubscriptionStore;
