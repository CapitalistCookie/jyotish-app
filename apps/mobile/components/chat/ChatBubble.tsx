import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  index?: number;
}

export function ChatBubble({ role, content, timestamp, index = 0 }: ChatBubbleProps) {
  const isUser = role === 'user';

  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Animated.View
      entering={isUser ? FadeInDown.delay(50).springify() : FadeInUp.delay(100).springify()}
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text
          style={[
            styles.content,
            isUser ? styles.userContent : styles.assistantContent,
          ]}
        >
          {content}
        </Text>
      </View>
      <Text
        style={[
          styles.timestamp,
          isUser ? styles.userTimestamp : styles.assistantTimestamp,
        ]}
      >
        {formattedTime}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 60,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
  },
  userContent: {
    color: Colors.background,
  },
  assistantContent: {
    color: Colors.textPrimary,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: Colors.textMuted,
    marginRight: 4,
  },
  assistantTimestamp: {
    color: Colors.textMuted,
    marginLeft: 4,
  },
});
