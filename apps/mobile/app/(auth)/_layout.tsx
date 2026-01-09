import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

export default function AuthLayout() {
  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'fade',
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
