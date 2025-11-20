import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from './text';
import { useThemeColors } from './theme-provider';

interface AccordionItemProps {
  isExpanded: boolean;
  viewKey: string | number;
  style?: object;
  duration?: number;
  children: string;
}

export function Accordion({
  isExpanded,
  viewKey,
  style,
  duration = 300,
  children,
}: AccordionItemProps) {
  const height = useSharedValue(0);

  const colors = useThemeColors();

  const derivedHeight = useDerivedValue(() =>
    withTiming(height.value * Number(isExpanded), {
      duration,
    }),
  );
  const bodyStyle = useAnimatedStyle(() => ({
    height: derivedHeight.value,
    display: isExpanded ? 'flex' : 'none',
  }));

  return (
    <Animated.View
      key={`accordionItem_${viewKey}`}
      style={[styles.animatedView, bodyStyle, style]}
    >
      <View
        onLayout={(e) => {
          height.value = e.nativeEvent.layout.height;
        }}
        style={styles.wrapper}
      >
        <Text color={colors.text.secondary}>{children}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedView: {
    width: '100%',
    overflow: 'hidden',
    padding: 0,
    margin: 0,
  },
  wrapper: {
    width: '100%',
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
  },
});
