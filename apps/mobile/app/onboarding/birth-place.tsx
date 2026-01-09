import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { GlowInput } from '../../components/ui/GlowInput';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { Colors } from '../../constants/colors';

const placeSchema = z.object({
  birthPlace: z.string().min(2, 'Please enter your birth city'),
});

type PlaceForm = z.infer<typeof placeSchema>;

export default function OnboardingBirthPlace() {
  const insets = useSafeAreaInsets();
  const { birthPlace, setField } = useOnboardingStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PlaceForm>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      birthPlace,
    },
  });

  const onSubmit = (data: PlaceForm) => {
    setField('birthPlace', data.birthPlace);
    // Hardcoded test coordinates (New York City)
    // TODO: Replace with Google Places API lookup
    setField('latitude', 40.7128);
    setField('longitude', -74.006);
    setField('timezone', 'America/New_York');
    router.push('/onboarding/review');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Where were you born?</Text>
        <Text style={styles.subtitle}>
          Birth location is essential for accurate house calculations
        </Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="birthPlace"
            render={({ field: { onChange, onBlur, value } }) => (
              <GlowInput
                label="Birth City"
                placeholder="e.g., New York, USA"
                autoCapitalize="words"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.birthPlace?.message}
              />
            )}
          />

          <Text style={styles.hint}>
            Enter the city and country where you were born
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ</Text>
          <Text style={styles.infoText}>
            We use your birth location to calculate the precise positions of celestial bodies at the moment of your birth.
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
        >
          Continue
        </Button>
      </View>
    </KeyboardAvoidingView>
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
    marginBottom: 40,
  },
  form: {
    marginBottom: 32,
  },
  hint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: -8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.surface + '60',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  infoIcon: {
    fontSize: 18,
    color: Colors.primary,
  },
  infoText: {
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
