import { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text, IconButton, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { useChartStore } from '../../stores/useChartStore';
import { useChatStore } from '../../stores/useChatStore';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { ChatBubble, ChatInput, TypingIndicator } from '../../components/chat';
import { Paywall } from '../../components/subscription';
import { ChatMessage } from '../../services/api/client';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ context?: string }>();
  const flatListRef = useRef<FlatList>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const { chart } = useChartStore();
  const {
    messages,
    isLoading,
    error,
    questionsRemaining,
    questionLimit,
    quotaExceeded,
    sendMessage,
    loadHistory,
    loadQuota,
    clearError,
    setChartId,
  } = useChatStore();

  const { isPremium } = useSubscriptionStore();

  useEffect(() => {
    if (!chart) {
      router.replace('/(main)/chart');
      return;
    }

    setChartId(chart.id);
    loadHistory(chart.id);
    loadQuota();
  }, [chart?.id]);

  // Send initial context if provided
  useEffect(() => {
    if (params.context && messages.length === 0 && chart && !isLoading) {
      // Add a slight delay to ensure the screen is ready
      const timer = setTimeout(() => {
        sendMessage(params.context!);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [params.context, chart?.id]);

  const handleSend = useCallback((message: string) => {
    sendMessage(message);
    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  }, [sendMessage]);

  const handleGoBack = () => {
    router.back();
  };

  const handleUpgrade = () => {
    setShowPaywall(true);
  };

  const renderMessage = useCallback(({ item, index }: { item: ChatMessage; index: number }) => (
    <ChatBubble
      role={item.role}
      content={item.content}
      timestamp={item.timestamp}
      index={index}
    />
  ), []);

  const renderListHeader = useCallback(() => {
    if (isLoading) {
      return <TypingIndicator visible />;
    }
    return null;
  }, [isLoading]);

  const renderEmptyState = () => (
    <Animated.View entering={FadeIn.delay(200)} style={styles.emptyState}>
      <Text style={styles.emptyIcon}>✧</Text>
      <Text style={styles.emptyTitle}>Ask Your Chart</Text>
      <Text style={styles.emptyText}>
        Ask any question about your birth chart.{'\n'}
        Our AI astrologer will provide personalized insights.
      </Text>
      <View style={styles.suggestions}>
        <Text style={styles.suggestionsTitle}>Try asking:</Text>
        <SuggestionChip
          text="What are my greatest strengths?"
          onPress={() => handleSend("What are my greatest strengths based on my chart?")}
        />
        <SuggestionChip
          text="When will luck favor me?"
          onPress={() => handleSend("Based on my current Dasha period, when will luck favor me?")}
        />
        <SuggestionChip
          text="What career suits me?"
          onPress={() => handleSend("What career path is best aligned with my chart?")}
        />
      </View>
    </Animated.View>
  );

  const keyExtractor = useCallback((item: ChatMessage, index: number) =>
    `${item.timestamp}-${index}`, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={Colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Ask Your Chart</Text>
          {isPremium ? (
            <Text style={[styles.headerSubtitle, styles.premiumBadge]}>
              Premium - Unlimited
            </Text>
          ) : questionsRemaining !== null && (
            <Text style={[
              styles.headerSubtitle,
              quotaExceeded && styles.headerSubtitleWarning
            ]}>
              {quotaExceeded
                ? 'No questions remaining'
                : `${questionsRemaining} questions left this month`}
            </Text>
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Error Banner */}
      {error && (
        <Animated.View entering={FadeIn} style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <IconButton icon="close" size={18} iconColor={Colors.error} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={[...messages].reverse()}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.messagesList,
          messages.length === 0 && styles.emptyList,
        ]}
        inverted
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {/* Quota Exceeded Message */}
      {quotaExceeded ? (
        <View style={[styles.quotaExceeded, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.quotaTitle}>Monthly Limit Reached</Text>
          <Text style={styles.quotaText}>
            You've used all {questionLimit} free questions this month.
            Upgrade to Premium for unlimited questions.
          </Text>
          <Button
            mode="contained"
            onPress={handleUpgrade}
            style={styles.upgradeButton}
            buttonColor={Colors.primary}
            textColor={Colors.background}
          >
            Upgrade to Premium
          </Button>
        </View>
      ) : (
        <View style={{ paddingBottom: insets.bottom }}>
          <ChatInput
            onSend={handleSend}
            disabled={isLoading || quotaExceeded}
            placeholder="Ask about your chart..."
          />
        </View>
      )}

      {/* Paywall Modal */}
      <Paywall
        visible={showPaywall}
        onDismiss={() => setShowPaywall(false)}
      />
    </KeyboardAvoidingView>
  );
}

function SuggestionChip({
  text,
  onPress,
}: {
  text: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.suggestionChip}>
      <Text style={styles.suggestionText}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backButton: {
    marginLeft: -8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerSubtitleWarning: {
    color: Colors.error,
  },
  premiumBadge: {
    color: Colors.primary,
    fontWeight: '500',
  },
  headerRight: {
    width: 48,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.error + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.error + '40',
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: 13,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyIcon: {
    fontSize: 48,
    color: Colors.primary,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  suggestions: {
    marginTop: 32,
    width: '100%',
  },
  suggestionsTitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 12,
    textAlign: 'center',
  },
  suggestionChip: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionText: {
    color: Colors.textPrimary,
    fontSize: 14,
    textAlign: 'center',
  },
  quotaExceeded: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  quotaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  quotaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  upgradeButton: {
    borderRadius: 24,
    paddingHorizontal: 24,
  },
});
