import { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ask about your chart...',
  maxLength = 500,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSend(trimmedMessage);
      setMessage('');
      Keyboard.dismiss();
    }
  };

  const canSend = message.trim().length > 0 && !disabled;

  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(
      isFocused ? Colors.primary : Colors.border,
      { duration: 200 }
    ),
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: withTiming(canSend ? 1 : 0.4, { duration: 150 }),
    transform: [
      { scale: withTiming(canSend ? 1 : 0.9, { duration: 150 }) },
    ],
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={maxLength}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="send"
          blurOnSubmit
          onSubmitEditing={handleSend}
        />
        <Animated.View style={animatedButtonStyle}>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend}
            style={[styles.sendButton, canSend && styles.sendButtonActive]}
            activeOpacity={0.7}
          >
            <IconButton
              icon="send"
              size={22}
              iconColor={canSend ? Colors.background : Colors.textMuted}
              style={styles.icon}
            />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
      {message.length > maxLength - 50 && (
        <Text style={styles.charCount}>
          {message.length}/{maxLength}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 12,
    paddingBottom: 8,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    marginBottom: 2,
  },
  sendButtonActive: {
    backgroundColor: Colors.primary,
  },
  icon: {
    margin: 0,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
    marginRight: 8,
  },
});
