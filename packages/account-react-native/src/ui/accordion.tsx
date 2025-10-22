import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from './text';

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

  const derivedHeight = useDerivedValue(() =>
    withTiming(height.value * Number(isExpanded), {
      duration,
    }),
  );
  const bodyStyle = useAnimatedStyle(() => ({
    height: derivedHeight.value,
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
        <Text color="#8D8D8D">{children}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedView: {
    width: '100%',
    overflow: 'hidden',
  },
  wrapper: {
    width: '100%',
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
  },
});
