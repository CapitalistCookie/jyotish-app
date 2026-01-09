/**
 * Paywall Component
 * Premium subscription upgrade screen
 */

import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  ActivityIndicator,
  Portal,
  Modal,
  IconButton,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PurchasesPackage } from 'react-native-purchases';
import { Colors } from '../../constants/colors';
import { useSubscriptionStore } from '../../stores';
import { formatPrice, getSubscriptionPeriod, calculateSavings } from '../../services/subscription/revenuecat';

interface PaywallProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
}

const BENEFITS = [
  {
    icon: '	',
    title: 'All Life Categories',
    description: 'Career, Finances, Health readings',
  },
  {
    icon: '',
    title: 'Complete Timeline',
    description: 'Full Dasha period analysis',
  },
  {
    icon: '	',
    title: 'Unlimited Questions',
    description: 'Ask AI anything about your chart',
  },
  {
    icon: '',
    title: 'Priority Responses',
    description: 'Faster AI processing',
  },
];

export function Paywall({ visible, onDismiss, onSuccess }: PaywallProps) {
  const insets = useSafeAreaInsets();
  const [selectedPkg, setSelectedPkg] = useState<'monthly' | 'annual'>('annual');

  const {
    monthlyPackage,
    annualPackage,
    isPurchasing,
    isRestoring,
    error,
    purchase,
    restore,
  } = useSubscriptionStore();

  const handlePurchase = async () => {
    const pkg = selectedPkg === 'monthly' ? monthlyPackage : annualPackage;
    if (!pkg) {
      Alert.alert('Error', 'Package not available. Please try again later.');
      return;
    }

    const success = await purchase(pkg);
    if (success) {
      onSuccess?.();
      onDismiss();
    }
  };

  const handleRestore = async () => {
    const restored = await restore();
    if (restored) {
      Alert.alert('Success', 'Your purchase has been restored!');
      onSuccess?.();
      onDismiss();
    } else {
      Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases to restore.');
    }
  };

  const openTerms = () => {
    Linking.openURL('https://jyotish.app/terms');
  };

  const openPrivacy = () => {
    Linking.openURL('https://jyotish.app/privacy');
  };

  const savings = monthlyPackage && annualPackage
    ? calculateSavings(monthlyPackage, annualPackage)
    : 33;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <LinearGradient
          colors={[Colors.surface, Colors.background]}
          style={[styles.container, { paddingTop: insets.top + 10 }]}
        >
          {/* Close Button */}
          <IconButton
            icon="close"
            iconColor={Colors.textSecondary}
            size={24}
            onPress={onDismiss}
            style={styles.closeButton}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerIcon}>	</Text>
              <Text style={styles.title}>Unlock Your Full{'\n'}Cosmic Potential</Text>
              <Text style={styles.subtitle}>
                Get unlimited access to all readings and features
              </Text>
            </View>

            {/* Benefits List */}
            <View style={styles.benefitsContainer}>
              {BENEFITS.map((benefit, index) => (
                <View key={index} style={styles.benefitRow}>
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkMark}>	</Text>
                  </View>
                  <View style={styles.benefitText}>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitDescription}>
                      {benefit.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Pricing Options */}
            <View style={styles.pricingContainer}>
              {/* Annual Option */}
              <PricingOption
                title="Annual"
                price={annualPackage ? formatPrice(annualPackage) : '$79.99'}
                period="year"
                savings={`Save ${savings}%`}
                isSelected={selectedPkg === 'annual'}
                onPress={() => setSelectedPkg('annual')}
                isBestValue
              />

              {/* Monthly Option */}
              <PricingOption
                title="Monthly"
                price={monthlyPackage ? formatPrice(monthlyPackage) : '$9.99'}
                period="month"
                isSelected={selectedPkg === 'monthly'}
                onPress={() => setSelectedPkg('monthly')}
              />
            </View>

            {/* Error Message */}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Purchase Button */}
            <Button
              mode="contained"
              onPress={handlePurchase}
              disabled={isPurchasing || isRestoring}
              loading={isPurchasing}
              style={styles.purchaseButton}
              buttonColor={Colors.primary}
              textColor={Colors.background}
              labelStyle={styles.purchaseButtonLabel}
            >
              {isPurchasing ? 'Processing...' : 'Start Free Trial'}
            </Button>

            <Text style={styles.trialText}>
              7-day free trial, then {selectedPkg === 'annual'
                ? `${annualPackage ? formatPrice(annualPackage) : '$79.99'}/year`
                : `${monthlyPackage ? formatPrice(monthlyPackage) : '$9.99'}/month`}
            </Text>

            {/* Restore Purchases */}
            <Button
              mode="text"
              onPress={handleRestore}
              disabled={isPurchasing || isRestoring}
              loading={isRestoring}
              textColor={Colors.textSecondary}
              style={styles.restoreButton}
            >
              Restore Purchases
            </Button>

            {/* Legal Links */}
            <View style={styles.legalContainer}>
              <Text
                style={styles.legalLink}
                onPress={openTerms}
              >
                Terms of Service
              </Text>
              <Text style={styles.legalSeparator}>|</Text>
              <Text
                style={styles.legalLink}
                onPress={openPrivacy}
              >
                Privacy Policy
              </Text>
            </View>

            <Text style={styles.legalText}>
              Payment will be charged to your {'\n'}
              App Store account at confirmation.
            </Text>
          </ScrollView>
        </LinearGradient>
      </Modal>
    </Portal>
  );
}

interface PricingOptionProps {
  title: string;
  price: string;
  period: string;
  savings?: string;
  isSelected: boolean;
  onPress: () => void;
  isBestValue?: boolean;
}

function PricingOption({
  title,
  price,
  period,
  savings,
  isSelected,
  onPress,
  isBestValue,
}: PricingOptionProps) {
  return (
    <View
      style={[
        styles.pricingOption,
        isSelected && styles.pricingOptionSelected,
      ]}
    >
      {isBestValue && (
        <View style={styles.bestValueBadge}>
          <Text style={styles.bestValueText}>BEST VALUE</Text>
        </View>
      )}

      <Button
        mode="text"
        onPress={onPress}
        style={styles.pricingButton}
        contentStyle={styles.pricingButtonContent}
      >
        <View style={styles.pricingContent}>
          <View style={styles.pricingLeft}>
            <View
              style={[
                styles.radioOuter,
                isSelected && styles.radioOuterSelected,
              ]}
            >
              {isSelected && <View style={styles.radioInner} />}
            </View>
            <View>
              <Text style={styles.pricingTitle}>{title}</Text>
              {savings && (
                <Text style={styles.savingsText}>{savings}</Text>
              )}
            </View>
          </View>
          <View style={styles.pricingRight}>
            <Text style={styles.priceText}>{price}</Text>
            <Text style={styles.periodText}>/{period}</Text>
          </View>
        </View>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    margin: 0,
  },
  container: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  benefitsContainer: {
    marginBottom: 32,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkMark: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  pricingContainer: {
    marginBottom: 24,
  },
  pricingOption: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  pricingOptionSelected: {
    borderColor: Colors.primary,
  },
  bestValueBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 8,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.background,
    letterSpacing: 0.5,
  },
  pricingButton: {
    margin: 0,
  },
  pricingButtonContent: {
    padding: 16,
  },
  pricingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  pricingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  savingsText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
    marginTop: 2,
  },
  pricingRight: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  periodText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  purchaseButton: {
    borderRadius: 12,
    paddingVertical: 4,
  },
  purchaseButtonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  trialText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  restoreButton: {
    marginTop: 16,
  },
  legalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  legalLink: {
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 8,
  },
  legalText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
});

export default Paywall;
