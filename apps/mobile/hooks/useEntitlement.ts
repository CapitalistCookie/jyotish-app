/**
 * useEntitlement Hook
 * Check if user has access to specific features based on subscription
 */

import { useMemo } from 'react';
import { useSubscriptionStore, READING_ACCESS, ReadingCategory } from '../stores';

interface EntitlementResult {
  hasAccess: boolean;
  loading: boolean;
  isPremium: boolean;
  reason?: string;
}

/**
 * Hook to check if user has access to a reading category
 */
export function useEntitlement(category: ReadingCategory): EntitlementResult {
  const { isPremium, isLoading, isInitialized } = useSubscriptionStore();

  return useMemo(() => {
    const accessLevel = READING_ACCESS[category];
    const loading = isLoading || !isInitialized;

    if (accessLevel === 'free') {
      return {
        hasAccess: true,
        loading,
        isPremium,
      };
    }

    // Premium required
    if (isPremium) {
      return {
        hasAccess: true,
        loading,
        isPremium: true,
      };
    }

    return {
      hasAccess: false,
      loading,
      isPremium: false,
      reason: `${category.charAt(0).toUpperCase() + category.slice(1)} reading requires a Premium subscription`,
    };
  }, [category, isPremium, isLoading, isInitialized]);
}

/**
 * Hook to check if user can ask questions
 */
export function useCanAskQuestion(): {
  canAsk: boolean;
  remaining: number;
  loading: boolean;
  isPremium: boolean;
} {
  const {
    isPremium,
    questionsRemaining,
    isLoading,
    isInitialized,
  } = useSubscriptionStore();

  return useMemo(() => {
    const loading = isLoading || !isInitialized;

    if (isPremium) {
      return {
        canAsk: true,
        remaining: -1, // Unlimited
        loading,
        isPremium: true,
      };
    }

    return {
      canAsk: questionsRemaining > 0,
      remaining: questionsRemaining,
      loading,
      isPremium: false,
    };
  }, [isPremium, questionsRemaining, isLoading, isInitialized]);
}

/**
 * Hook to get all category access info
 */
export function useCategoryAccess(): {
  categories: Array<{
    id: ReadingCategory;
    name: string;
    accessLevel: 'free' | 'premium';
    hasAccess: boolean;
    isLocked: boolean;
  }>;
  loading: boolean;
} {
  const { isPremium, isLoading, isInitialized } = useSubscriptionStore();

  return useMemo(() => {
    const loading = isLoading || !isInitialized;

    const categoryInfo: Array<{
      id: ReadingCategory;
      name: string;
      description: string;
    }> = [
      { id: 'summary', name: 'Summary', description: 'Overview of your chart' },
      { id: 'love', name: 'Love', description: 'Relationships and romance' },
      { id: 'career', name: 'Career', description: 'Work and purpose' },
      { id: 'finances', name: 'Finances', description: 'Wealth and abundance' },
      { id: 'health', name: 'Health', description: 'Wellness and vitality' },
      { id: 'timeline', name: 'Timeline', description: 'Life periods' },
    ];

    const categories = categoryInfo.map((cat) => {
      const accessLevel = READING_ACCESS[cat.id];
      const hasAccess = accessLevel === 'free' || isPremium;

      return {
        id: cat.id,
        name: cat.name,
        accessLevel,
        hasAccess,
        isLocked: !hasAccess,
      };
    });

    return { categories, loading };
  }, [isPremium, isLoading, isInitialized]);
}

export default useEntitlement;
