import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { Colors } from '../../constants/colors';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export default function OnboardingBirthDate() {
  const insets = useSafeAreaInsets();
  const { birthDate, setField } = useOnboardingStore();

  const defaultDate = birthDate ? new Date(birthDate) : new Date();
  if (!birthDate) {
    defaultDate.setFullYear(defaultDate.getFullYear() - 25);
  }

  const [day, setDay] = useState(defaultDate.getDate());
  const [month, setMonth] = useState(defaultDate.getMonth());
  const [year, setYear] = useState(defaultDate.getFullYear());
  const [error, setError] = useState('');

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 120;
  const maxYear = currentYear - 13;

  const daysInMonth = getDaysInMonth(month, year);

  const handleContinue = () => {
    const selectedDate = new Date(year, month, day);
    const age = currentYear - year;

    if (age < 13) {
      setError('You must be at least 13 years old');
      return;
    }

    if (age > 120) {
      setError('Please enter a valid birth year');
      return;
    }

    setField('birthDate', selectedDate);
    router.push('/onboarding/birth-time');
  };

  const adjustValue = (
    current: number,
    delta: number,
    min: number,
    max: number,
    setter: (v: number) => void
  ) => {
    let newValue = current + delta;
    if (newValue < min) newValue = max;
    if (newValue > max) newValue = min;
    setter(newValue);
    setError('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>When were you born?</Text>
        <Text style={styles.subtitle}>
          Your birth date determines your Sun sign and planetary positions
        </Text>

        <View style={styles.pickerContainer}>
          {/* Day Picker */}
          <View style={styles.pickerColumn}>
            <Pressable
              onPress={() => adjustValue(day, 1, 1, daysInMonth, setDay)}
              style={styles.arrowButton}
            >
              <Text style={styles.arrow}>▲</Text>
            </Pressable>
            <View style={styles.valueContainer}>
              <Text style={styles.value}>{day.toString().padStart(2, '0')}</Text>
              <Text style={styles.label}>Day</Text>
            </View>
            <Pressable
              onPress={() => adjustValue(day, -1, 1, daysInMonth, setDay)}
              style={styles.arrowButton}
            >
              <Text style={styles.arrow}>▼</Text>
            </Pressable>
          </View>

          {/* Month Picker */}
          <View style={[styles.pickerColumn, styles.monthColumn]}>
            <Pressable
              onPress={() => adjustValue(month, 1, 0, 11, setMonth)}
              style={styles.arrowButton}
            >
              <Text style={styles.arrow}>▲</Text>
            </Pressable>
            <View style={styles.valueContainer}>
              <Text style={styles.value}>{MONTHS[month].slice(0, 3)}</Text>
              <Text style={styles.label}>Month</Text>
            </View>
            <Pressable
              onPress={() => adjustValue(month, -1, 0, 11, setMonth)}
              style={styles.arrowButton}
            >
              <Text style={styles.arrow}>▼</Text>
            </Pressable>
          </View>

          {/* Year Picker */}
          <View style={styles.pickerColumn}>
            <Pressable
              onPress={() => adjustValue(year, 1, minYear, maxYear, setYear)}
              style={styles.arrowButton}
            >
              <Text style={styles.arrow}>▲</Text>
            </Pressable>
            <View style={styles.valueContainer}>
              <Text style={styles.value}>{year}</Text>
              <Text style={styles.label}>Year</Text>
            </View>
            <Pressable
              onPress={() => adjustValue(year, -1, minYear, maxYear, setYear)}
              style={styles.arrowButton}
            >
              <Text style={styles.arrow}>▼</Text>
            </Pressable>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Button
          mode="contained"
          onPress={handleContinue}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
        >
          Continue
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
    marginBottom: 48,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  pickerColumn: {
    alignItems: 'center',
    backgroundColor: Colors.surface + '60',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 80,
  },
  monthColumn: {
    minWidth: 100,
  },
  arrowButton: {
    padding: 12,
  },
  arrow: {
    fontSize: 16,
    color: Colors.primary,
  },
  valueContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.textPrimary,
  },
  label: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  error: {
    color: Colors.error,
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
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
});
