import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Line, Rect } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { Planet } from '../../services/api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_SIZE = Math.min(SCREEN_WIDTH - 48, 340);
const CELL_SIZE = CHART_SIZE / 4;

// Planet abbreviations
const PLANET_ABBREV: Record<string, string> = {
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
};

// South Indian chart house positions (fixed)
// Houses are arranged in a specific pattern
const HOUSE_POSITIONS: { [key: number]: { row: number; col: number } } = {
  12: { row: 0, col: 0 },
  1: { row: 0, col: 1 },
  2: { row: 0, col: 2 },
  3: { row: 0, col: 3 },
  11: { row: 1, col: 0 },
  4: { row: 1, col: 3 },
  10: { row: 2, col: 0 },
  5: { row: 2, col: 3 },
  9: { row: 3, col: 0 },
  8: { row: 3, col: 1 },
  7: { row: 3, col: 2 },
  6: { row: 3, col: 3 },
};

// Sign symbols
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

interface SouthIndianChartProps {
  planets: Planet[];
  ascendantSign: string;
}

export function SouthIndianChart({ planets, ascendantSign }: SouthIndianChartProps) {
  // Group planets by house
  const planetsByHouse: Record<number, Planet[]> = {};
  planets.forEach((planet) => {
    if (!planetsByHouse[planet.house]) {
      planetsByHouse[planet.house] = [];
    }
    planetsByHouse[planet.house].push(planet);
  });

  // Get sign for each house based on ascendant
  const ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  const ascIndex = ZODIAC_SIGNS.indexOf(ascendantSign);

  const getHouseSign = (houseNum: number) => {
    const signIndex = (ascIndex + houseNum - 1) % 12;
    return ZODIAC_SIGNS[signIndex];
  };

  const renderCell = (houseNum: number) => {
    const pos = HOUSE_POSITIONS[houseNum];
    if (!pos) return null;

    const housePlanets = planetsByHouse[houseNum] || [];
    const sign = getHouseSign(houseNum);
    const signSymbol = SIGN_SYMBOLS[sign] || '';

    const x = pos.col * CELL_SIZE;
    const y = pos.row * CELL_SIZE;

    return (
      <View
        key={houseNum}
        style={[
          styles.cell,
          {
            left: x,
            top: y,
            width: CELL_SIZE,
            height: CELL_SIZE,
          },
        ]}
      >
        {/* House number */}
        <Text style={styles.houseNumber}>{houseNum}</Text>

        {/* Sign symbol */}
        <Text style={styles.signSymbol}>{signSymbol}</Text>

        {/* Planets */}
        <View style={styles.planetsContainer}>
          {housePlanets.map((planet, idx) => (
            <Text
              key={planet.name}
              style={[
                styles.planet,
                planet.isRetrograde && styles.retrograde,
              ]}
            >
              {PLANET_ABBREV[planet.name] || planet.name.slice(0, 2)}
              {planet.isRetrograde ? '®' : ''}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderCenterCell = () => {
    return (
      <View style={styles.centerCell}>
        <Text style={styles.centerTitle}>Rashi</Text>
        <Text style={styles.centerSign}>{ascendantSign}</Text>
        <Text style={styles.centerLabel}>Lagna</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* SVG Grid Lines */}
      <Svg width={CHART_SIZE} height={CHART_SIZE} style={styles.svgContainer}>
        {/* Outer border */}
        <Rect
          x={1}
          y={1}
          width={CHART_SIZE - 2}
          height={CHART_SIZE - 2}
          stroke={Colors.primary}
          strokeWidth={2}
          fill="none"
        />

        {/* Inner box (center area) */}
        <Rect
          x={CELL_SIZE}
          y={CELL_SIZE}
          width={CELL_SIZE * 2}
          height={CELL_SIZE * 2}
          stroke={Colors.primary}
          strokeWidth={1.5}
          fill={Colors.surface + '40'}
        />

        {/* Vertical lines */}
        {[1, 2, 3].map((i) => (
          <Line
            key={`v${i}`}
            x1={i * CELL_SIZE}
            y1={0}
            x2={i * CELL_SIZE}
            y2={CHART_SIZE}
            stroke={Colors.primary}
            strokeWidth={1}
            opacity={0.6}
          />
        ))}

        {/* Horizontal lines */}
        {[1, 2, 3].map((i) => (
          <Line
            key={`h${i}`}
            x1={0}
            y1={i * CELL_SIZE}
            x2={CHART_SIZE}
            y2={i * CELL_SIZE}
            stroke={Colors.primary}
            strokeWidth={1}
            opacity={0.6}
          />
        ))}

        {/* Diagonal lines for corner cells */}
        {/* Top-left */}
        <Line
          x1={0}
          y1={CELL_SIZE}
          x2={CELL_SIZE}
          y2={0}
          stroke={Colors.primary}
          strokeWidth={1}
          opacity={0.4}
        />
        {/* Top-right */}
        <Line
          x1={CELL_SIZE * 3}
          y1={0}
          x2={CHART_SIZE}
          y2={CELL_SIZE}
          stroke={Colors.primary}
          strokeWidth={1}
          opacity={0.4}
        />
        {/* Bottom-left */}
        <Line
          x1={0}
          y1={CELL_SIZE * 3}
          x2={CELL_SIZE}
          y2={CHART_SIZE}
          stroke={Colors.primary}
          strokeWidth={1}
          opacity={0.4}
        />
        {/* Bottom-right */}
        <Line
          x1={CELL_SIZE * 3}
          y1={CHART_SIZE}
          x2={CHART_SIZE}
          y2={CELL_SIZE * 3}
          stroke={Colors.primary}
          strokeWidth={1}
          opacity={0.4}
        />
      </Svg>

      {/* House cells */}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(renderCell)}

      {/* Center area */}
      {renderCenterCell()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    position: 'relative',
  },
  svgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cell: {
    position: 'absolute',
    padding: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  houseNumber: {
    position: 'absolute',
    top: 2,
    left: 4,
    fontSize: 10,
    color: Colors.textMuted,
  },
  signSymbol: {
    position: 'absolute',
    top: 2,
    right: 4,
    fontSize: 12,
    color: Colors.primary,
    opacity: 0.6,
  },
  planetsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    gap: 2,
  },
  planet: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginHorizontal: 2,
  },
  retrograde: {
    color: Colors.warning,
  },
  centerCell: {
    position: 'absolute',
    left: CELL_SIZE,
    top: CELL_SIZE,
    width: CELL_SIZE * 2,
    height: CELL_SIZE * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  centerSign: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.primary,
  },
  centerLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
