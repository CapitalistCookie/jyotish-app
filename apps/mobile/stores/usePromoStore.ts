/**
 * Promo Store
 * Manages affiliate codes and promo codes
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, AffiliateInfo, PromoCodeInfo } from '../services/api/client';

const AFFILIATE_CODE_KEY = '@jyotish/affiliate_code';
const PROMO_CODE_KEY = '@jyotish/promo_code';

interface PromoState {
  // Affiliate
  affiliateCode: string | null;
  affiliateInfo: AffiliateInfo | null;
  affiliateLoading: boolean;

  // Promo
  promoCode: string | null;
  promoInfo: PromoCodeInfo | null;
  promoLoading: boolean;

  // Applied benefits
  appliedDiscount: number;
  extendedTrialDays: number;

  // Error
  error: string | null;
}

interface PromoActions {
  // Initialization
  loadStoredCodes: () => Promise<void>;

  // Affiliate
  setAffiliateCode: (code: string) => Promise<void>;
  validateAffiliateCode: (code: string) => Promise<AffiliateInfo>;
  applyAffiliateCode: (userId: string) => Promise<boolean>;
  clearAffiliateCode: () => Promise<void>;

  // Promo
  setPromoCode: (code: string) => void;
  validatePromoCode: (code: string) => Promise<PromoCodeInfo>;
  applyPromoCode: (userId: string) => Promise<boolean>;
  clearPromoCode: () => void;

  // Clear
  reset: () => void;
}

const initialState: PromoState = {
  affiliateCode: null,
  affiliateInfo: null,
  affiliateLoading: false,
  promoCode: null,
  promoInfo: null,
  promoLoading: false,
  appliedDiscount: 0,
  extendedTrialDays: 0,
  error: null,
};

export const usePromoStore = create<PromoState & PromoActions>((set, get) => ({
  ...initialState,

  /**
   * Load stored codes from AsyncStorage
   */
  loadStoredCodes: async () => {
    try {
      const [affiliateCode, promoCode] = await Promise.all([
        AsyncStorage.getItem(AFFILIATE_CODE_KEY),
        AsyncStorage.getItem(PROMO_CODE_KEY),
      ]);

      if (affiliateCode) {
        set({ affiliateCode });
        // Validate the stored affiliate code
        get().validateAffiliateCode(affiliateCode);
      }

      if (promoCode) {
        set({ promoCode });
      }
    } catch (error) {
      console.error('Failed to load stored codes:', error);
    }
  },

  /**
   * Set and store affiliate code
   */
  setAffiliateCode: async (code: string) => {
    const upperCode = code.toUpperCase().trim();
    set({ affiliateCode: upperCode, affiliateLoading: true, error: null });

    try {
      // Store in AsyncStorage for persistence
      await AsyncStorage.setItem(AFFILIATE_CODE_KEY, upperCode);

      // Track the click (increments click count on backend)
      const info = await apiClient.trackAffiliateClick(upperCode);

      if (info.valid) {
        set({
          affiliateInfo: info,
          extendedTrialDays: info.trialDays || 7,
          appliedDiscount: info.discountPercent || 0,
          affiliateLoading: false,
        });
      } else {
        set({
          affiliateInfo: null,
          affiliateLoading: false,
          error: info.error || 'Invalid affiliate code',
        });
        await AsyncStorage.removeItem(AFFILIATE_CODE_KEY);
      }
    } catch (error) {
      console.error('Failed to set affiliate code:', error);
      set({ affiliateLoading: false, error: 'Failed to validate affiliate code' });
    }
  },

  /**
   * Validate affiliate code without tracking
   */
  validateAffiliateCode: async (code: string) => {
    const upperCode = code.toUpperCase().trim();
    set({ affiliateLoading: true, error: null });

    try {
      const info = await apiClient.validateAffiliateCode(upperCode);

      if (info.valid) {
        set({
          affiliateInfo: info,
          extendedTrialDays: info.trialDays || 7,
          appliedDiscount: info.discountPercent || 0,
          affiliateLoading: false,
        });
      } else {
        set({ affiliateInfo: null, affiliateLoading: false });
      }

      return info;
    } catch (error) {
      console.error('Failed to validate affiliate code:', error);
      set({ affiliateLoading: false });
      return { valid: false, error: 'Validation failed' };
    }
  },

  /**
   * Apply affiliate code during registration
   */
  applyAffiliateCode: async (userId: string) => {
    const { affiliateCode, affiliateInfo } = get();

    if (!affiliateCode || !affiliateInfo?.valid) {
      return false;
    }

    try {
      const result = await apiClient.applyAffiliateCode(affiliateCode, userId);

      if (result.applied && result.benefits) {
        set({
          extendedTrialDays: result.benefits.trialDays,
          appliedDiscount: result.benefits.discountPercent,
        });
        return true;
      }

      set({ error: result.error });
      return false;
    } catch (error) {
      console.error('Failed to apply affiliate code:', error);
      set({ error: 'Failed to apply affiliate code' });
      return false;
    }
  },

  /**
   * Clear affiliate code
   */
  clearAffiliateCode: async () => {
    try {
      await AsyncStorage.removeItem(AFFILIATE_CODE_KEY);
      set({
        affiliateCode: null,
        affiliateInfo: null,
        extendedTrialDays: 0,
        appliedDiscount: 0,
      });
    } catch (error) {
      console.error('Failed to clear affiliate code:', error);
    }
  },

  /**
   * Set promo code (doesn't persist)
   */
  setPromoCode: (code: string) => {
    set({ promoCode: code.toUpperCase().trim(), promoInfo: null, error: null });
  },

  /**
   * Validate promo code
   */
  validatePromoCode: async (code: string) => {
    const upperCode = code.toUpperCase().trim();
    set({ promoLoading: true, error: null });

    try {
      const info = await apiClient.validatePromoCode(upperCode);

      if (info.valid) {
        set({
          promoCode: upperCode,
          promoInfo: info,
          promoLoading: false,
        });

        // Apply discount if it's a discount code
        if (info.type === 'discount' && info.value) {
          set({ appliedDiscount: info.value });
        }
      } else {
        set({
          promoInfo: null,
          promoLoading: false,
          error: info.error || 'Invalid promo code',
        });
      }

      return info;
    } catch (error) {
      console.error('Failed to validate promo code:', error);
      set({ promoLoading: false, error: 'Failed to validate promo code' });
      return { valid: false, error: 'Validation failed' };
    }
  },

  /**
   * Apply promo code
   */
  applyPromoCode: async (userId: string) => {
    const { promoCode, promoInfo } = get();

    if (!promoCode || !promoInfo?.valid) {
      return false;
    }

    try {
      const result = await apiClient.applyPromoCode(promoCode, userId);

      if (result.success && result.benefits) {
        // Clear promo code after successful application
        set({ promoCode: null, promoInfo: null });
        return true;
      }

      set({ error: result.error });
      return false;
    } catch (error) {
      console.error('Failed to apply promo code:', error);
      set({ error: 'Failed to apply promo code' });
      return false;
    }
  },

  /**
   * Clear promo code
   */
  clearPromoCode: () => {
    set({ promoCode: null, promoInfo: null });
  },

  /**
   * Reset store
   */
  reset: () => {
    set(initialState);
  },
}));

export default usePromoStore;
