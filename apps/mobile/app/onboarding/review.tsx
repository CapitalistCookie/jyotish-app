import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useChartStore } from '../../stores/useChartStore';
import { Colors } from '../../constants/colors';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatDate(date: Date | null): string {
  if (!date) return 'Not set';
  const d = new Date(date);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatDateForApi(date: Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(time: Date | null, unknown: boolean): string {
  if (unknown || !time) return 'Unknown (using 12:00 PM)';
  const t = new Date(time);
  const hours = t.getHours();
  const minutes = t.getMinutes();
  const hour12 = hours % 12 || 12;
  const ampm = hours < 12 ? 'AM' : 'PM';
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

function formatTimeForApi(time: Date | null, unknown: boolean): string {
  if (unknown || !time) return '12:00';
  const t = new Date(time);
  const hours = String(t.getHours()).padStart(2, '0');
  const minutes = String(t.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

interface ReviewRowProps {
  label: string;
  value: string;
  onEdit: () => void;
}

function ReviewRow({ label, value, onEdit }: ReviewRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      <Pressable onPress={onEdit} style={styles.editButton}>
        <Text style={styles.editText}>Edit</Text>
      </Pressable>
    </View>
  );
}

export default function OnboardingReview() {
  const insets = useSafeAreaInsets();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    firstName,
    lastName,
    birthDate,
    birthTime,
    birthTimeUnknown,
    birthPlace,
    latitude,
    longitude,
    timezone,
  } = useOnboardingStore();

  const { generateChart } = useChartStore();

  const handleGenerateChart = async () => {
    // Validate required fields
    if (!birthDate) {
      setError('Please set your birth date');
      return;
    }

    setIsGenerating(true);
    setError(null);

    const request = {
      name: `${firstName} ${lastName}`.trim() || undefined,
      birthDate: formatDateForApi(birthDate),
      birthTime: formatTimeForApi(birthTime, birthTimeUnknown),
      place: birthPlace || undefined,
      latitude: latitude || 40.7128, // Default to NYC if not set
      longitude: longitude || -74.006,
      timezone: timezone || 'America/New_York',
    };

    console.log('Generating chart with request:', JSON.stringify(request));

    try {
      const chart = await generateChart(request);
      console.log('Chart generated successfully:', chart?.id);

      if (chart) {
        router.replace('/(main)/chart');
      } else {
        setError('Failed to generate chart. Please try again.');
      }
    } catch (err) {
      console.error('Chart generation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Review Your Details</Text>
        <Text style={styles.subtitle}>
          Please verify your information before we generate your chart
        </Text>

        <View style={styles.card}>
          <ReviewRow
            label="Name"
            value={`${firstName} ${lastName}`}
            onEdit={() => router.push('/onboarding/name')}
          />

          <View style={styles.divider} />

          <ReviewRow
            label="Birth Date"
            value={formatDate(birthDate)}
            onEdit={() => router.push('/onboarding/birth-date')}
          />

          <View style={styles.divider} />

          <ReviewRow
            label="Birth Time"
            value={formatTime(birthTime, birthTimeUnknown)}
            onEdit={() => router.push('/onboarding/birth-time')}
          />

          <View style={styles.divider} />

          <ReviewRow
            label="Birth Place"
            value={birthPlace || 'Not set'}
            onEdit={() => router.push('/onboarding/birth-place')}
          />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.noteBox}>
          <Text style={styles.noteIcon}>✦</Text>
          <Text style={styles.noteText}>
            Your Vedic birth chart will be calculated using the sidereal zodiac and traditional Jyotish methods.
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Button
          mode="contained"
          onPress={handleGenerateChart}
          loading={isGenerating}
          disabled={isGenerating}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
        >
          {isGenerating ? 'Generating...' : 'Generate My Chart'}
        </Button>
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
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  card: {
    backgroundColor: Colors.surface + '80',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  rowValue: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  errorBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.error + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  noteBox: {
    flexDirection: 'row',
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    gap: 12,
  },
  noteIcon: {
    fontSize: 16,
    color: Colors.primary,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    minWidth: 220,
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
});
