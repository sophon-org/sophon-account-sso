import React, { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Container } from "./container";

type SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  trackColors?: { on: string; off: string };
  size?: number;
};

const PADDING = 2;

export function Switch({
  value,
  onValueChange,
  disabled = false,
  trackColors = { on: "#3377FF", off: "#A3A2A0" },
  size = 30,
}: SwitchProps) {
  const progress = useSharedValue(value ? 1 : 0);
  const dragStart = useSharedValue(0);

  const { WIDTH, HEIGHT, THUMB, RADIUS, MAX_TRANSLATE } = useMemo(() => {
    const HEIGHT = size * 0.6;
    const THUMB = HEIGHT - PADDING * 2;
    return {
      WIDTH: size,
      HEIGHT,
      THUMB,
      RADIUS: HEIGHT / 2,
      MAX_TRANSLATE: size - THUMB - PADDING * 2,
    };
  }, [size]);

  useEffect(() => {
    if (!disabled) {
      progress.value = withSpring(value ? 1 : 0, {
        mass: 0.35,
        stiffness: 220,
        damping: 18,
      });
    }
  }, [value, disabled]);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onBegin(() => {
      dragStart.value = progress.value;
    })
    .onUpdate((e) => {
      const next = Math.min(Math.max(dragStart.value + e.translationX / MAX_TRANSLATE, 0), 1);
      progress.value = next;
    })
    .onEnd(() => {
      const nextValue = progress.value > 0.5;
      runOnJS(onValueChange)(nextValue);
    });

  const tap = Gesture.Tap()
    .hitSlop({
      top: PADDING * 3,
      bottom: PADDING * 3,
      left: PADDING * 3,
      right: PADDING * 3,
    })
    .enabled(!disabled)
    .maxDuration(150)
    .onEnd(() => {
      runOnJS(onValueChange)(!value);
    });

  const combo = Gesture.Simultaneous(tap, pan);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [trackColors.off, trackColors.on]),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(progress.value * MAX_TRANSLATE, {
          mass: 0.3,
          stiffness: 180,
          damping: 16,
        }),
      },
    ],
  }));
  return (
    <Container onStartShouldSetResponder={() => true} onTouchEnd={(e) => e.stopPropagation()}>
      <GestureDetector gesture={combo}>
        <Animated.View
          style={[
            { width: WIDTH, height: HEIGHT, borderRadius: RADIUS, paddingHorizontal: PADDING },
            styles.track,
            trackStyle,
          ]}
        >
          <Animated.View
            style={[
              { width: THUMB, height: THUMB, borderRadius: RADIUS },
              styles.thumb,
              thumbStyle,
            ]}
          />
        </Animated.View>
      </GestureDetector>
    </Container>
  );
}

const styles = StyleSheet.create({
  track: {
    justifyContent: "center",
  },
  thumb: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 1.5,
    elevation: 1,
  },
});
