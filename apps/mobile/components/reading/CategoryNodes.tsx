import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NODE_SIZE = 80;
const CONTAINER_SIZE = Math.min(SCREEN_WIDTH - 48, 320);

interface Category {
  id: string;
  name: string;
  icon: string;
  isLocked: boolean;
}

const CATEGORIES: Category[] = [
  { id: 'love', name: 'Love', icon: '♡', isLocked: false },
  { id: 'career', name: 'Career', icon: '◈', isLocked: true },
  { id: 'finances', name: 'Finances', icon: '◎', isLocked: true },
  { id: 'health', name: 'Health', icon: '✦', isLocked: true },
  { id: 'timeline', name: 'Timeline', icon: '◴', isLocked: true },
];

interface CategoryNodeProps {
  category: Category;
  position: { x: number; y: number };
  onPress: () => void;
}

function CategoryNode({ category, position, onPress }: CategoryNodeProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.node,
        {
          left: position.x - NODE_SIZE / 2,
          top: position.y - NODE_SIZE / 2,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
        pressed && styles.nodePressed,
      ]}
    >
      <View style={styles.nodeInner}>
        <Text style={styles.nodeIcon}>{category.icon}</Text>
        <Text style={styles.nodeName}>{category.name}</Text>
        {category.isLocked && (
          <View style={styles.lockBadge}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

interface CategoryNodesProps {
  onSelect: (categoryId: string) => void;
}

export function CategoryNodes({ onSelect }: CategoryNodesProps) {
  // Calculate positions in a circle
  const centerX = CONTAINER_SIZE / 2;
  const centerY = CONTAINER_SIZE / 2;
  const radius = CONTAINER_SIZE / 2 - NODE_SIZE / 2 - 10;

  const getPosition = (index: number, total: number) => {
    // Start from top (-90 degrees) and go clockwise
    const angle = ((2 * Math.PI) / total) * index - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  return (
    <View style={[styles.container, { width: CONTAINER_SIZE, height: CONTAINER_SIZE }]}>
      {/* Center decoration */}
      <View style={styles.centerCircle}>
        <Text style={styles.centerIcon}>✧</Text>
      </View>

      {/* Connecting lines */}
      <View style={styles.linesContainer}>
        {CATEGORIES.map((_, index) => {
          const pos = getPosition(index, CATEGORIES.length);
          const angle = Math.atan2(pos.y - centerY, pos.x - centerX) * (180 / Math.PI);
          const distance = Math.sqrt(
            Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2)
          );

          return (
            <View
              key={index}
              style={[
                styles.line,
                {
                  width: distance - 20,
                  left: centerX,
                  top: centerY,
                  transform: [
                    { translateX: -0 },
                    { translateY: -0.5 },
                    { rotate: `${angle}deg` },
                  ],
                  transformOrigin: 'left center',
                },
              ]}
            />
          );
        })}
      </View>

      {/* Category nodes */}
      {CATEGORIES.map((category, index) => (
        <CategoryNode
          key={category.id}
          category={category}
          position={getPosition(index, CATEGORIES.length)}
          onPress={() => onSelect(category.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
  },
  centerCircle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 50,
    height: 50,
    marginLeft: -25,
    marginTop: -25,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary + '60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIcon: {
    fontSize: 24,
    color: Colors.primary,
  },
  linesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  line: {
    position: 'absolute',
    height: 1,
    backgroundColor: Colors.primary + '30',
  },
  node: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
  },
  nodePressed: {
    opacity: 0.9,
  },
  nodeInner: {
    flex: 1,
    borderRadius: NODE_SIZE / 2,
    backgroundColor: Colors.surface + 'E0',
    borderWidth: 2,
    borderColor: Colors.primary + '60',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nodeIcon: {
    fontSize: 22,
    color: Colors.primary,
    marginBottom: 2,
  },
  nodeName: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 10,
  },
});
