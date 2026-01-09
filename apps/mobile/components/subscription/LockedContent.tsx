/**
 * LockedContent Component
 * Wrapper that shows blurred preview for locked content
 */

import { useState, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/colors';
import { useSubscriptionStore, ReadingCategory } from '../../stores';
import { useEntitlement } from '../../hooks/useEntitlement';
import { Paywall } from './Paywall';

interface LockedContentProps {
  category: ReadingCategory;
  children: ReactNode;
  preview?: ReactNode;
  showPreview?: boolean;
}

export function LockedContent({
  category,
  children,
  preview,
  showPreview = true,
}: LockedContentProps) {
  const [showPaywall, setShowPaywall] = useState(false);
  const { hasAccess, loading } = useEntitlement(category);

  // If user has access, show the content
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show locked state
  return (
    <View style={styles.container}>
      {/* Blurred Preview */}
      {showPreview && preview && (
        <View style={styles.previewContainer}>
          {preview}
          <BlurView intensity={80} style={styles.blurOverlay} tint="dark" />
        </View>
      )}

      {/* Lock Overlay */}
      <View style={styles.lockOverlay}>
        <View style={styles.lockContent}>
          <Text style={styles.lockIcon}>	</Text>
          <Text style={styles.lockTitle}>Premium Content</Text>
          <Text style={styles.lockDescription}>
            Upgrade to unlock {category.charAt(0).toUpperCase() + category.slice(1)} readings
            and all premium features
          </Text>
          <Button
            mode="contained"
            onPress={() => setShowPaywall(true)}
            style={styles.unlockButton}
            buttonColor={Colors.primary}
            textColor={Colors.background}
            icon="lock-open"
          >
            Unlock Now
          </Button>
        </View>
      </View>

      {/* Paywall Modal */}
      <Paywall
        visible={showPaywall}
        onDismiss={() => setShowPaywall(false)}
      />
    </View>
  );
}

/**
 * Simple locked overlay without preview
 */
interface LockedOverlayProps {
  message?: string;
  onUnlock?: () => void;
}

export function LockedOverlay({ message, onUnlock }: LockedOverlayProps) {
  const [showPaywall, setShowPaywall] = useState(false);

  const handleUnlock = () => {
    if (onUnlock) {
      onUnlock();
    } else {
      setShowPaywall(true);
    }
  };

  return (
    <>
      <View style={styles.simpleOverlay}>
        <Text style={styles.lockIcon}>	</Text>
        <Text style={styles.overlayText}>
          {message || 'This feature requires Premium'}
        </Text>
        <Button
          mode="contained"
          onPress={handleUnlock}
          style={styles.overlayButton}
          buttonColor={Colors.primary}
          textColor={Colors.background}
          compact
        >
          Upgrade
        </Button>
      </View>

      <Paywall
        visible={showPaywall}
        onDismiss={() => setShowPaywall(false)}
      />
    </>
  );
}

/**
 * Lock badge for category cards
 */
interface LockBadgeProps {
  size?: 'small' | 'medium' | 'large';
}

export function LockBadge({ size = 'medium' }: LockBadgeProps) {
  const sizeStyles = {
    small: { width: 16, height: 16, fontSize: 10 },
    medium: { width: 24, height: 24, fontSize: 14 },
    large: { width: 32, height: 32, fontSize: 18 },
  };

  const { width, height, fontSize } = sizeStyles[size];

  return (
    <View style={[styles.lockBadge, { width, height }]}>
      <Text style={[styles.lockBadgeIcon, { fontSize }]}>	</Text>
    </View>
  );
}

/**
 * Question limit indicator
 */
interface QuestionLimitProps {
  remaining: number;
  total: number;
  onUpgrade?: () => void;
}

export function QuestionLimit({ remaining, total, onUpgrade }: QuestionLimitProps) {
  const [showPaywall, setShowPaywall] = useState(false);
  const isLow = remaining <= 2;
  const isDepleted = remaining <= 0;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setShowPaywall(true);
    }
  };

  return (
    <>
      <View style={[styles.questionLimit, isDepleted && styles.questionLimitDepleted]}>
        <Text style={[styles.questionLimitText, isLow && styles.questionLimitLow]}>
          {isDepleted
            ? 'No questions remaining'
            : `${remaining} of ${total} questions remaining`}
        </Text>
        {isDepleted && (
          <Button
            mode="text"
            onPress={handleUpgrade}
            textColor={Colors.primary}
            compact
          >
            Upgrade for unlimited
          </Button>
        )}
      </View>

      <Paywall
        visible={showPaywall}
        onDismiss={() => setShowPaywall(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  previewContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.overlay,
  },
  lockContent: {
    alignItems: 'center',
    padding: 24,
    maxWidth: 280,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  lockDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  unlockButton: {
    borderRadius: 24,
    paddingHorizontal: 8,
  },
  simpleOverlay: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overlayText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  overlayButton: {
    borderRadius: 20,
  },
  lockBadge: {
    backgroundColor: Colors.primary + '30',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadgeIcon: {
    color: Colors.primary,
  },
  questionLimit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 20,
  },
  questionLimitDepleted: {
    backgroundColor: Colors.error + '20',
    flexDirection: 'column',
  },
  questionLimitText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  questionLimitLow: {
    color: Colors.warning,
  },
});

export default LockedContent;
