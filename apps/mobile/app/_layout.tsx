import { useEffect, useCallback } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { theme } from '../constants/theme';
import { Colors } from '../constants/colors';
import { useSubscriptionStore, usePromoStore } from '../stores';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const { initialize } = useSubscriptionStore();
  const { setAffiliateCode } = usePromoStore();

  // Handle deep link URLs
  const handleDeepLink = useCallback(
    async (event: { url: string }) => {
      const { url } = event;
      const parsed = Linking.parse(url);

      // Handle affiliate referral links
      // Supports: jyotish://signup?ref=COSMIC20
      // Also supports: jyotish://register?ref=COSMIC20
      if (
        parsed.path === 'signup' ||
        parsed.path === 'register' ||
        parsed.hostname === 'signup' ||
        parsed.hostname === 'register'
      ) {
        const refCode = parsed.queryParams?.ref as string | undefined;

        if (refCode) {
          // Store and validate the affiliate code
          await setAffiliateCode(refCode);
        }

        // Navigate to register screen with ref param
        router.push({
          pathname: '/(auth)/register',
          params: refCode ? { ref: refCode } : {},
        });
      }
    },
    [setAffiliateCode]
  );

  // Initialize subscription state on app launch
  useEffect(() => {
    initialize();
  }, []);

  // Set up deep link listener
  useEffect(() => {
    // Handle URL that opened the app
    const getInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink({ url: initialUrl });
      }
    };

    getInitialURL();

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <StatusBar style="light" backgroundColor={Colors.background} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
                animation: 'fade',
              }}
            />
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
