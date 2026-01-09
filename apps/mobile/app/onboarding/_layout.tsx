import { View, StyleSheet, Pressable } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';

const STEPS = ['index', 'name', 'birth-date', 'birth-time', 'birth-place', 'review'];

export default function OnboardingLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();

  const currentSegment = segments[segments.length - 1] || 'index';
  const currentStepIndex = STEPS.indexOf(currentSegment);
  const progress = currentStepIndex > 0 ? currentStepIndex / (STEPS.length - 1) : 0;
  const showBackButton = currentStepIndex > 0;

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {/* Header with progress */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          {showBackButton ? (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>←</Text>
            </Pressable>
          ) : (
            <View style={styles.backButton} />
          )}

          {currentStepIndex > 0 && (
            <Animated.View entering={FadeIn} style={styles.stepIndicator}>
              <Text style={styles.stepText}>
                Step {currentStepIndex} of {STEPS.length - 1}
              </Text>
            </Animated.View>
          )}

          <View style={styles.backButton} />
        </View>

        {/* Progress bar */}
        {currentStepIndex > 0 && (
          <Animated.View entering={FadeIn} style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>
          </Animated.View>
        )}
      </View>

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: Colors.primary,
  },
  stepIndicator: {
    flex: 1,
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  progressBackground: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});
