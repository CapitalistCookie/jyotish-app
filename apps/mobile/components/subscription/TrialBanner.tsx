/**
 * TrialBanner Component
 * Shows trial status and upgrade CTA for trial users
 * Dismissable but reappears daily
 */

import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { useSubscriptionStore } from '../../stores';

const DISMISS_KEY = '@jyotish/trial_banner_dismissed';

interface TrialBannerProps {
  onUpgrade: () => void;
}

export function TrialBanner({ onUpgrade }: TrialBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true);
  const { isTrialing, trialDaysRemaining, isPremium } = useSubscriptionStore();

  // Check if banner was dismissed today
  useEffect(() => {
    checkDismissStatus();
  }, []);

  const checkDismissStatus = async () => {
    try {
      const dismissedDate = await AsyncStorage.getItem(DISMISS_KEY);

      if (dismissedDate) {
        const today = new Date().toDateString();
        const dismissed = new Date(dismissedDate).toDateString();

        // If dismissed today, keep hidden
        if (today === dismissed) {
          setIsDismissed(true);
          return;
        }
      }

      // Show banner if not dismissed today
      setIsDismissed(false);
    } catch (error) {
      console.error('Failed to check dismiss status:', error);
      setIsDismissed(false);
    }
  };

  const handleDismiss = useCallback(async () => {
    try {
      // Store today's date as dismiss date
      await AsyncStorage.setItem(DISMISS_KEY, new Date().toISOString());
      setIsDismissed(true);
    } catch (error) {
      console.error('Failed to dismiss banner:', error);
    }
  }, []);

  // Don't show if not on trial, already premium, or dismissed
  if (!isTrialing || isPremium || isDismissed) {
    return null;
  }

  // Determine urgency based on days remaining
  const isUrgent = trialDaysRemaining <= 3;
  const isExpiringSoon = trialDaysRemaining <= 1;

  const getMessage = () => {
    if (isExpiringSoon) {
      return trialDaysRemaining === 0
        ? 'Your trial expires today!'
        : 'Only 1 day left in your trial!';
    }
    return `${trialDaysRemaining} days left in your free trial`;
  };

  return (
    <Animated.View
      entering={SlideInUp.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.container,
        isUrgent && styles.containerUrgent,
        isExpiringSoon && styles.containerExpiring,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.icon}>{isExpiringSoon ? '⏰' : '✨'}</Text>
          <View style={styles.messageContainer}>
            <Text style={[styles.message, isUrgent && styles.messageUrgent]}>
              {getMessage()}
            </Text>
            {!isExpiringSoon && (
              <Text style={styles.subMessage}>
                Unlock all features with premium
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.upgradeButton, isUrgent && styles.upgradeButtonUrgent]}
          onPress={onUpgrade}
          activeOpacity={0.8}
        >
          <Text style={styles.upgradeText}>Upgrade</Text>
        </TouchableOpacity>
      </View>

      <IconButton
        icon="close"
        iconColor={isUrgent ? Colors.textPrimary : Colors.textSecondary}
        size={16}
        onPress={handleDismiss}
        style={styles.closeButton}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  containerUrgent: {
    backgroundColor: Colors.warning + '20',
    borderColor: Colors.warning + '40',
  },
  containerExpiring: {
    backgroundColor: Colors.error + '20',
    borderColor: Colors.error + '40',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 40,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 10,
  },
  messageContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  messageUrgent: {
    color: Colors.warning,
  },
  subMessage: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeButtonUrgent: {
    backgroundColor: Colors.warning,
  },
  upgradeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.background,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    margin: 0,
  },
});

export default TrialBanner;
