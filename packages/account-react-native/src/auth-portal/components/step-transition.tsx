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
  disableAnimation?: boolean;
};

const ANIMATED_DURATION = 250;
const EASE = Easing.bezier(0.75, 0.21, 0.15, 1);

export const StepTransitionView: React.FC<StepAnimatedViewProps> = ({
  isBackAvailable,
  children,
  keyProp,
  disableAnimation,
}) => {
  const duration = disableAnimation ? 1 : ANIMATED_DURATION;
  const slideIn = (isBackAvailable ? SlideInLeft : SlideInRight)
    .duration(duration)
    .easing(EASE);

  const slideOut = (isBackAvailable ? SlideOutRight : SlideOutLeft)
    .duration(duration)
    .easing(EASE);

  const fadeIn = (isBackAvailable ? FadeInLeft : FadeInRight)
    .duration(duration)
    .easing(EASE);

  const fadeOut = (isBackAvailable ? FadeOutRight : FadeOutLeft)
    .duration(duration)
    .easing(EASE);

  return (
    <View style={styles.container}>
      <Animated.View
        key={keyProp}
        style={styles.step}
        entering={slideIn}
        exiting={fadeOut}
        layout={LinearTransition.duration(duration / 2)}
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
