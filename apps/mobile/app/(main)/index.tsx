import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../../constants/colors';
import { useChartStore } from '../../stores/useChartStore';

export default function MainIndex() {
  const { chart } = useChartStore();

  useEffect(() => {
    // If we have a chart, go to chart view
    if (chart) {
      router.replace('/(main)/chart');
    }
  }, [chart]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>Loading your chart...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    color: Colors.textSecondary,
    fontSize: 16,
  },
});
