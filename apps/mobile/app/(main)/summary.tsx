import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useChartStore } from '../../stores/useChartStore';
import { apiClient } from '../../services/api/client';
import { CategoryNodes } from '../../components/reading';

export default function SummaryScreen() {
  const insets = useSafeAreaInsets();
  const { chart } = useChartStore();
  const [summary, setSummary] = useState<string | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!chart) {
      router.replace('/(main)/chart');
      return;
    }

    fetchSummary();
  }, [chart]);

  const fetchSummary = async () => {
    if (!chart) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getReading(chart.id, 'summary');
      setSummary(response.content);
      startTypewriter(response.content);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reading');
      setIsLoading(false);
    }
  };

  const startTypewriter = (text: string) => {
    setIsLoading(false);
    setIsTyping(true);
    setDisplayedText('');

    let index = 0;
    const chunkSize = 3; // Characters per tick for faster typing

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + chunkSize));
        index += chunkSize;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        // Fade in the category nodes
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    }, 20);

    return () => clearInterval(interval);
  };

  const handleCategorySelect = (category: string) => {
    router.push(`/(main)/reading/${category}`);
  };

  const skipTypewriter = () => {
    if (summary) {
      setDisplayedText(summary);
      setIsTyping(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Consulting the stars...</Text>
        <Text style={styles.loadingSubtext}>Generating your personalized reading</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>✧</Text>
        <Text style={styles.errorText}>Unable to generate reading</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <Button
          mode="outlined"
          onPress={fetchSummary}
          style={styles.retryButton}
          textColor={Colors.primary}
        >
          Try Again
        </Button>
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
        <Text style={styles.title}>Your Cosmic Reading</Text>
        <Text style={styles.subtitle}>Insights from the stars</Text>
      </View>

      {/* Summary Text with Typewriter Effect */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>{displayedText}</Text>
        {isTyping && <Text style={styles.cursor}>|</Text>}
      </View>

      {isTyping && (
        <Button
          mode="text"
          onPress={skipTypewriter}
          textColor={Colors.textMuted}
          style={styles.skipButton}
        >
          Skip animation
        </Button>
      )}

      {/* Ask a Question Button */}
      {!isTyping && (
        <Animated.View style={[styles.askSection, { opacity: fadeAnim }]}>
          <Button
            mode="contained"
            onPress={() => router.push('/(main)/chat')}
            style={styles.askButton}
            buttonColor={Colors.primary}
            textColor={Colors.background}
            icon="chat-question"
          >
            Ask a Question
          </Button>
        </Animated.View>
      )}

      {/* Category Selection */}
      <Animated.View style={[styles.categoriesSection, { opacity: fadeAnim }]}>
        <Text style={styles.sectionTitle}>Explore Deeper</Text>
        <Text style={styles.sectionSubtitle}>
          Select a life area for detailed insights
        </Text>
        <CategoryNodes onSelect={handleCategorySelect} />
      </Animated.View>
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
    color: Colors.primary,
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
  retryButton: {
    marginTop: 24,
    borderColor: Colors.primary,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: Colors.surface + '80',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 200,
  },
  summaryText: {
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  cursor: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '300',
  },
  skipButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  askSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  askButton: {
    borderRadius: 24,
    paddingHorizontal: 8,
  },
  categoriesSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
});
