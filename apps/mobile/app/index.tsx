import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {/* Decorative elements */}
      <View style={styles.decorativeCircle} />
      <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />

      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        {/* Logo area */}
        <View style={styles.logoContainer}>
          <View style={styles.logoRing}>
            <Text style={styles.logoSymbol}>☉</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Jyotish</Text>
        <Text style={styles.subtitle}>Vedic Astrology</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Discover the ancient wisdom of the stars
        </Text>
      </View>

      {/* Bottom section */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 40 }]}>
        <Button
          mode="outlined"
          onPress={() => router.push('/(auth)/login')}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
        >
          Begin Your Journey
        </Button>

        <Text style={styles.footerText}>
          Unlock your celestial blueprint
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorativeCircle: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    borderWidth: 1,
    borderColor: Colors.primary + '10',
    top: -width * 0.5,
    left: -width * 0.25,
  },
  decorativeCircle2: {
    top: -width * 0.3,
    borderColor: Colors.primary + '08',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
  },
  logoSymbol: {
    fontSize: 48,
    color: Colors.primary,
  },
  title: {
    fontSize: 52,
    fontWeight: '300',
    color: Colors.primary,
    letterSpacing: 8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 40,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  bottomSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  button: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    borderRadius: 30,
    marginBottom: 20,
    minWidth: 240,
  },
  buttonContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonLabel: {
    color: Colors.primary,
    fontSize: 16,
    letterSpacing: 1,
    fontWeight: '500',
  },
  footerText: {
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
});
