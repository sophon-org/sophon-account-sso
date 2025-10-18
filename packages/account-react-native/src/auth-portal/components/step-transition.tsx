import type React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
  LinearTransition,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';

type StepAnimatedViewProps = {
  isBackAvailable?: boolean;
  children: React.ReactNode;
  keyProp: string | null;
};

const DURATION = 250;
const EASE = Easing.bezier(0.75, 0.21, 0.15, 1);

export const StepTransitionView: React.FC<StepAnimatedViewProps> = ({
  isBackAvailable,
  children,
  keyProp,
}) => {
  const slideIn = (isBackAvailable ? SlideInLeft : SlideInRight)
    .duration(DURATION)
    .easing(EASE);

  const slideOut = (isBackAvailable ? SlideOutRight : SlideOutLeft)
    .duration(DURATION)
    .easing(EASE);

  const fadeIn = (isBackAvailable ? FadeInLeft : FadeInRight)
    .duration(DURATION)
    .easing(EASE);

  const fadeOut = (isBackAvailable ? FadeOutRight : FadeOutLeft)
    .duration(DURATION)
    .easing(EASE);

  return (
    <View style={styles.container}>
      <Animated.View
        key={keyProp}
        style={styles.step}
        entering={slideIn}
        exiting={fadeOut}
        layout={LinearTransition.duration(120)}
      >
        <Animated.View entering={fadeIn} exiting={slideOut} style={styles.fill}>
          {children}
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  step: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
});
