import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { GlowInput } from '../../components/ui/GlowInput';
import { Colors } from '../../constants/colors';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    // TODO: Implement actual login with backend
    console.log('Login:', data);
    // For now, navigate to onboarding
    router.replace('/onboarding');
  };

  const handleSkip = () => {
    // Skip login and go directly to onboarding for testing
    router.replace('/onboarding');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.symbol}>☽</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <GlowInput
                label="Email"
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <GlowInput
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                autoComplete="password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            contentStyle={styles.buttonContent}
          >
            Sign In
          </Button>
        </View>

        {/* Skip option for testing */}
        <Button
          mode="text"
          onPress={handleSkip}
          style={styles.skipButton}
          labelStyle={styles.skipLabel}
        >
          Skip for now
        </Button>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <Text style={styles.link}>Register</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  symbol: {
    fontSize: 48,
    color: Colors.primary,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  form: {
    flex: 1,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    marginTop: 12,
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
  skipButton: {
    marginTop: 16,
  },
  skipLabel: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  link: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
  },
});
