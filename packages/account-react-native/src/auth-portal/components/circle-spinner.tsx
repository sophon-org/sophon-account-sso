import { type PropsWithChildren, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Container } from '../../ui';

const ANIMATED_DURATION = 150;
const EASE = Easing.bezier(0.75, 0.21, 0.15, 1);

export function AuthenticatingSpinner({
  children,
  stroke = '#0A7CFF',
  isAuthenticating = true,
}: PropsWithChildren<{
  stroke?: string;
  isAuthenticating?: boolean;
}>) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 4000,
        easing: Easing.linear,
      }),
      -1,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const renderText = useMemo(() => {
    if (!isAuthenticating) return null;
    return (
      <Container justifyContent="center" alignItems="center">
        <Text style={styles.text}>Signing in...</Text>
      </Container>
    );
  }, [isAuthenticating]);

  return (
    <View style={[styles.containerAnimated]}>
      <View style={styles.containerAnimated}>
        <Animated.View style={[styles.svgWrapper, animatedStyle]}>
          <Svg width={72} height={72} viewBox="0 0 72 72">
            <Circle
              cx="36"
              cy="36"
              r="30"
              stroke={stroke}
              strokeWidth="5"
              fill="none"
              strokeDasharray={180}
              strokeDashoffset="10"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
        <View style={styles.iconWrapper}>{children}</View>
      </View>
      <Animated.View
        entering={FadeIn.duration(ANIMATED_DURATION).easing(EASE)}
        style={{ marginTop: 12, minHeight: 24 }}
      >
        {renderText}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerAnimated: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgWrapper: {
    alignSelf: 'center',
  },
  iconWrapper: {
    width: 72,
    height: 72,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    color: '#2A2A2A',
  },
  image: { width: 46, height: 46 },
});
