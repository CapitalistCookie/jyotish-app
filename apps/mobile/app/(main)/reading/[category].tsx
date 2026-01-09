import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, ActivityIndicator, FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { useChartStore } from '../../../stores/useChartStore';
import { apiClient } from '../../../services/api/client';

const CATEGORY_INFO: Record<string, { title: string; icon: string; description: string }> = {
  love: {
    title: 'Love & Relationships',
    icon: '♡',
    description: 'Insights about romance, partnership, and connection',
  },
  career: {
    title: 'Career & Purpose',
    icon: '◈',
    description: 'Guidance on profession and life purpose',
  },
  finances: {
    title: 'Wealth & Finances',
    icon: '◎',
    description: 'Understanding your relationship with abundance',
  },
  health: {
    title: 'Health & Vitality',
    icon: '✦',
    description: 'Insights about physical and mental wellbeing',
  },
  timeline: {
    title: 'Life Timeline',
    icon: '◴',
    description: 'Key periods and timing of events',
  },
};

export default function ReadingScreen() {
  const insets = useSafeAreaInsets();
  const { category } = useLocalSearchParams<{ category: string }>();
  const { chart } = useChartStore();

  const [reading, setReading] = useState<string | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const categoryInfo = CATEGORY_INFO[category || ''] || {
    title: 'Reading',
    icon: '✧',
    description: 'Your personalized insight',
  };

  useEffect(() => {
    if (!chart) {
      router.replace('/(main)/chart');
      return;
    }

    fetchReading();
  }, [chart, category]);

  const fetchReading = async () => {
    if (!chart || !category) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getReading(chart.id, category);
      setReading(response.content);
      startTypewriter(response.content);
    } catch (err) {
      console.error('Failed to fetch reading:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reading');
      setIsLoading(false);
    }
  };

  const startTypewriter = (text: string) => {
    setIsLoading(false);
    setIsTyping(true);
    setDisplayedText('');

    let index = 0;
    const chunkSize = 4;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + chunkSize));
        index += chunkSize;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 15);

    return () => clearInterval(interval);
  };

  const skipTypewriter = () => {
    if (reading) {
      setDisplayedText(reading);
      setIsTyping(false);
    }
  };

  const handleAskQuestion = () => {
    // Navigate to chat screen with context about current reading
    router.push({
      pathname: '/(main)/chat',
      params: {
        context: `I'm reading about my ${categoryInfo.title.toLowerCase()}. Can you tell me more about it?`,
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Reading the stars...</Text>
        <Text style={styles.loadingSubtext}>Preparing your {categoryInfo.title.toLowerCase()} insights</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>{categoryInfo.icon}</Text>
        <Text style={styles.errorText}>Unable to load reading</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <Button
          mode="outlined"
          onPress={fetchReading}
          style={styles.retryButton}
          textColor={Colors.primary}
        >
          Try Again
        </Button>
        <Button
          mode="text"
          onPress={() => router.back()}
          textColor={Colors.textMuted}
          style={styles.backButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 80 },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
          <Text style={styles.title}>{categoryInfo.title}</Text>
          <Text style={styles.subtitle}>{categoryInfo.description}</Text>
        </View>

        {/* Reading Content */}
        <View style={styles.readingCard}>
          <Text style={styles.readingText}>{displayedText}</Text>
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

        {/* Back to Summary */}
        {!isTyping && (
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.backToSummaryButton}
            textColor={Colors.primary}
          >
            Back to Summary
          </Button>
        )}
      </ScrollView>

      {/* Ask Question FAB */}
      {!isTyping && (
        <FAB
          icon="chat"
          style={[styles.fab, { bottom: insets.bottom + 16 }]}
          onPress={handleAskQuestion}
          color={Colors.background}
          label="Ask a Question"
        />
      )}
    </>
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
  backButton: {
    marginTop: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryIcon: {
    fontSize: 40,
    color: Colors.primary,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '300',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  readingCard: {
    backgroundColor: Colors.surface + '80',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  readingText: {
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
  backToSummaryButton: {
    marginTop: 24,
    alignSelf: 'center',
    borderColor: Colors.primary,
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: Colors.primary,
  },
});
