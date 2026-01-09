import { useState } from 'react';
import { View, StyleSheet, TextInput, TextInputProps } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';

interface GlowInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function GlowInput({ label, error, ...props }: GlowInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      borderColor: withTiming(
        isFocused ? Colors.primary : Colors.border,
        { duration: 200 }
      ),
      shadowOpacity: withTiming(isFocused ? 0.3 : 0, { duration: 200 }),
    };
  });

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, isFocused && styles.labelFocused]}>
        {label}
      </Text>
      <Animated.View
        style={[
          styles.container,
          animatedContainerStyle,
          error && styles.containerError,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </Animated.View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  labelFocused: {
    color: Colors.primary,
  },
  container: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface + '80',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 0,
  },
  containerError: {
    borderColor: Colors.error,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  error: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 6,
  },
});
