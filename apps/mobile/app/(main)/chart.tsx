import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useChartStore } from '../../stores/useChartStore';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { SouthIndianChart, ChartSummary } from '../../components/charts';

export default function ChartScreen() {
  const insets = useSafeAreaInsets();
  const { chart, isLoading, error } = useChartStore();
  const { firstName } = useOnboardingStore();

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Calculating your chart...</Text>
        <Text style={styles.loadingSubtext}>Aligning the stars</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠</Text>
        <Text style={styles.errorText}>Unable to generate chart</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  if (!chart) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No chart data</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {firstName ? `${firstName}'s Chart` : 'Your Birth Chart'}
        </Text>
        <Text style={styles.subtitle}>Vedic Horoscope</Text>
      </View>

      {/* Summary Cards */}
      <ChartSummary
        ascendant={chart.ascendant}
        planets={chart.planets}
        dashas={chart.dashas}
      />

      {/* Birth Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Rashi Chart</Text>
        <View style={styles.chartContainer}>
          <SouthIndianChart
            planets={chart.planets}
            ascendantSign={chart.ascendant.sign}
          />
        </View>
      </View>

      {/* Planet Details */}
      <View style={styles.planetSection}>
        <Text style={styles.sectionTitle}>Planetary Positions</Text>
        <View style={styles.planetGrid}>
          {chart.planets.map((planet) => (
            <View key={planet.name} style={styles.planetRow}>
              <View style={styles.planetInfo}>
                <Text style={styles.planetName}>
                  {planet.name}
                  {planet.isRetrograde && (
                    <Text style={styles.retrograde}> (R)</Text>
                  )}
                </Text>
                <Text style={styles.planetSign}>
                  {planet.sign} {planet.degree.toFixed(1)}°
                </Text>
              </View>
              <View style={styles.planetMeta}>
                <Text style={styles.planetNakshatra}>
                  {planet.nakshatra} {planet.nakshatraPada}
                </Text>
                <Text style={styles.planetHouse}>House {planet.house}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Chart Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoLabel}>Ayanamsa: {chart.ayanamsaName}</Text>
        <Text style={styles.infoLabel}>Value: {chart.ayanamsa.toFixed(4)}°</Text>
      </View>

      {/* View Reading Button */}
      <View style={styles.readingSection}>
        <Button
          mode="contained"
          onPress={() => router.push('/(main)/summary')}
          style={styles.readingButton}
          labelStyle={styles.readingButtonLabel}
          contentStyle={styles.readingButtonContent}
          icon="sparkles"
        >
          View Your Reading
        </Button>
        <Text style={styles.readingHint}>
          Get personalized insights powered by AI
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.textMuted,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  chartSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    backgroundColor: Colors.surface + '40',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planetSection: {
    marginTop: 24,
  },
  planetGrid: {
    backgroundColor: Colors.surface + '60',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  planetInfo: {
    flex: 1,
  },
  planetName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  retrograde: {
    color: Colors.warning,
    fontWeight: '400',
  },
  planetSign: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  planetMeta: {
    alignItems: 'flex-end',
  },
  planetNakshatra: {
    fontSize: 12,
    color: Colors.primary,
  },
  planetHouse: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  infoSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  readingSection: {
    marginTop: 32,
    alignItems: 'center',
    paddingVertical: 16,
  },
  readingButton: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    minWidth: 220,
  },
  readingButtonContent: {
    paddingVertical: 8,
  },
  readingButtonLabel: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  readingHint: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.textMuted,
  },
});
