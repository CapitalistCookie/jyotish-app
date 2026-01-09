import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useOnboardingStore } from '../../stores/useOnboardingStore';

export default function MainScreen() {
  const insets = useSafeAreaInsets();
  const { firstName } = useOnboardingStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.greeting}>Welcome, {firstName}!</Text>
      <Text style={styles.subtitle}>Your cosmic journey begins here</Text>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderIcon}>☉</Text>
        <Text style={styles.placeholderText}>
          Your birth chart will appear here
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 40,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
    color: Colors.primary,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
});
