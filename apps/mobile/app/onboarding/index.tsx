import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

export default function OnboardingWelcome() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Decorative symbol */}
        <Text style={styles.symbol}>✦</Text>

        <Text style={styles.title}>Discover Your{'\n'}Cosmic Blueprint</Text>

        <Text style={styles.description}>
          To reveal your Vedic birth chart, we'll need a few details about when and where you entered this world.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What we'll collect:</Text>
          <Text style={styles.infoItem}>• Your name</Text>
          <Text style={styles.infoItem}>• Date of birth</Text>
          <Text style={styles.infoItem}>• Time of birth (if known)</Text>
          <Text style={styles.infoItem}>• Place of birth</Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Button
          mode="contained"
          onPress={() => router.push('/onboarding/name')}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
        >
          Let's Begin
        </Button>

        <Text style={styles.privacyText}>
          Your data is stored securely and never shared
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbol: {
    fontSize: 48,
    color: Colors.primary,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 42,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 300,
  },
  infoBox: {
    backgroundColor: Colors.surface + '60',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 12,
    fontWeight: '500',
  },
  infoItem: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 6,
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    minWidth: 200,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  privacyText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 16,
  },
});
