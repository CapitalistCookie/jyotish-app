import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Button, Checkbox } from 'react-native-paper';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { Colors } from '../../constants/colors';

export default function OnboardingBirthTime() {
  const insets = useSafeAreaInsets();
  const { birthTime, birthTimeUnknown, setField } = useOnboardingStore();

  const defaultTime = birthTime ? new Date(birthTime) : new Date();
  if (!birthTime) {
    defaultTime.setHours(12, 0, 0, 0);
  }

  const [hours, setHours] = useState(defaultTime.getHours());
  const [minutes, setMinutes] = useState(defaultTime.getMinutes());
  const [unknown, setUnknown] = useState(birthTimeUnknown);

  const handleContinue = () => {
    if (unknown) {
      setField('birthTime', null);
      setField('birthTimeUnknown', true);
    } else {
      const time = new Date();
      time.setHours(hours, minutes, 0, 0);
      setField('birthTime', time);
      setField('birthTimeUnknown', false);
    }
    router.push('/onboarding/birth-place');
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
  };

  const toggleUnknown = () => {
    setUnknown(!unknown);
  };

  const formatHour = (h: number) => {
    const hour12 = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    return { hour: hour12.toString().padStart(2, '0'), ampm };
  };

  const { hour: displayHour, ampm } = formatHour(hours);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>What time were you born?</Text>
        <Text style={styles.subtitle}>
          Exact time helps determine your Rising sign (Ascendant)
        </Text>

        <View style={[styles.pickerContainer, unknown && styles.pickerDisabled]}>
          {/* Hours Picker */}
          <View style={styles.pickerColumn}>
            <Pressable
              onPress={() => !unknown && adjustValue(hours, 1, 0, 23, setHours)}
              style={styles.arrowButton}
              disabled={unknown}
            >
              <Text style={[styles.arrow, unknown && styles.arrowDisabled]}>▲</Text>
            </Pressable>
            <View style={styles.valueContainer}>
              <Text style={[styles.value, unknown && styles.valueDisabled]}>
                {displayHour}
              </Text>
              <Text style={styles.label}>Hour</Text>
            </View>
            <Pressable
              onPress={() => !unknown && adjustValue(hours, -1, 0, 23, setHours)}
              style={styles.arrowButton}
              disabled={unknown}
            >
              <Text style={[styles.arrow, unknown && styles.arrowDisabled]}>▼</Text>
            </Pressable>
          </View>

          <Text style={[styles.separator, unknown && styles.valueDisabled]}>:</Text>

          {/* Minutes Picker */}
          <View style={styles.pickerColumn}>
            <Pressable
              onPress={() => !unknown && adjustValue(minutes, 5, 0, 59, setMinutes)}
              style={styles.arrowButton}
              disabled={unknown}
            >
              <Text style={[styles.arrow, unknown && styles.arrowDisabled]}>▲</Text>
            </Pressable>
            <View style={styles.valueContainer}>
              <Text style={[styles.value, unknown && styles.valueDisabled]}>
                {minutes.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.label}>Min</Text>
            </View>
            <Pressable
              onPress={() => !unknown && adjustValue(minutes, -5, 0, 59, setMinutes)}
              style={styles.arrowButton}
              disabled={unknown}
            >
              <Text style={[styles.arrow, unknown && styles.arrowDisabled]}>▼</Text>
            </Pressable>
          </View>

          {/* AM/PM */}
          <View style={styles.ampmContainer}>
            <Text style={[styles.ampm, unknown && styles.valueDisabled]}>{ampm}</Text>
          </View>
        </View>

        {/* Unknown checkbox */}
        <Pressable style={styles.checkboxRow} onPress={toggleUnknown}>
          <Checkbox
            status={unknown ? 'checked' : 'unchecked'}
            onPress={toggleUnknown}
            color={Colors.primary}
            uncheckedColor={Colors.textMuted}
          />
          <Text style={styles.checkboxLabel}>I don't know my birth time</Text>
        </Pressable>

        {unknown && (
          <Text style={styles.unknownNote}>
            We'll use 12:00 PM (noon) for calculations. Your Rising sign may be less accurate.
          </Text>
        )}
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
    alignItems: 'center',
    gap: 8,
  },
  pickerDisabled: {
    opacity: 0.5,
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
  arrowButton: {
    padding: 12,
  },
  arrow: {
    fontSize: 16,
    color: Colors.primary,
  },
  arrowDisabled: {
    color: Colors.textMuted,
  },
  valueContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  value: {
    fontSize: 32,
    fontWeight: '300',
    color: Colors.textPrimary,
  },
  valueDisabled: {
    color: Colors.textMuted,
  },
  label: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  separator: {
    fontSize: 32,
    fontWeight: '300',
    color: Colors.textPrimary,
    marginHorizontal: 4,
  },
  ampmContainer: {
    marginLeft: 8,
    backgroundColor: Colors.surface + '60',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ampm: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.primary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    alignSelf: 'center',
  },
  checkboxLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  unknownNote: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
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
