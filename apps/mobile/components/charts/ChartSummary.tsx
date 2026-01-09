import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../../constants/colors';
import { Planet, DashaPeriod } from '../../services/api/client';

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

interface SummaryCardProps {
  label: string;
  sign: string;
  degree?: number;
  nakshatra?: string;
  icon?: string;
}

function SummaryCard({ label, sign, degree, nakshatra, icon }: SummaryCardProps) {
  const symbol = SIGN_SYMBOLS[sign] || '★';

  return (
    <View style={styles.card}>
      <Text style={styles.cardIcon}>{icon || symbol}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardSign}>{sign}</Text>
      {degree !== undefined && (
        <Text style={styles.cardDegree}>{degree.toFixed(1)}°</Text>
      )}
      {nakshatra && (
        <Text style={styles.cardNakshatra}>{nakshatra}</Text>
      )}
    </View>
  );
}

interface DashaCardProps {
  dasha: DashaPeriod;
}

function DashaCard({ dasha }: DashaCardProps) {
  const startDate = new Date(dasha.startDate);
  const endDate = new Date(dasha.endDate);
  const now = new Date();

  const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const progress = Math.min(Math.max(elapsedDays / totalDays, 0), 1);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <View style={styles.dashaCard}>
      <View style={styles.dashaHeader}>
        <Text style={styles.dashaLabel}>Current Mahadasha</Text>
        <Text style={styles.dashaPlanet}>{dasha.planet}</Text>
      </View>

      <View style={styles.dashaProgress}>
        <View style={[styles.dashaProgressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.dashaDates}>
        <Text style={styles.dashaDate}>{formatDate(startDate)}</Text>
        <Text style={styles.dashaDate}>{formatDate(endDate)}</Text>
      </View>
    </View>
  );
}

interface ChartSummaryProps {
  ascendant: Planet;
  planets: Planet[];
  dashas: DashaPeriod[];
}

export function ChartSummary({ ascendant, planets, dashas }: ChartSummaryProps) {
  const sun = planets.find((p) => p.name === 'Sun');
  const moon = planets.find((p) => p.name === 'Moon');

  // Find current dasha
  const now = new Date();
  const currentDasha = dashas.find((d) => {
    const start = new Date(d.startDate);
    const end = new Date(d.endDate);
    return now >= start && now <= end;
  });

  return (
    <View style={styles.container}>
      <View style={styles.cardsRow}>
        <SummaryCard
          label="Ascendant"
          sign={ascendant.sign}
          degree={ascendant.degree}
          nakshatra={ascendant.nakshatra}
          icon="⬆"
        />
        {moon && (
          <SummaryCard
            label="Moon"
            sign={moon.sign}
            degree={moon.degree}
            nakshatra={moon.nakshatra}
            icon="☽"
          />
        )}
        {sun && (
          <SummaryCard
            label="Sun"
            sign={sun.sign}
            degree={sun.degree}
            nakshatra={sun.nakshatra}
            icon="☉"
          />
        )}
      </View>

      {currentDasha && <DashaCard dasha={currentDasha} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.surface + '80',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardIcon: {
    fontSize: 20,
    color: Colors.primary,
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  cardSign: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cardDegree: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardNakshatra: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dashaCard: {
    backgroundColor: Colors.surface + '80',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dashaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dashaLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  dashaPlanet: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  dashaProgress: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  dashaProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  dashaDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dashaDate: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
