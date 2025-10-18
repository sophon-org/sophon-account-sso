import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

export const LoadingStep = () => {
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

  return (
    <View style={[styles.container, styles.containerAnimated]}>
      <View style={styles.containerAnimated}>
        <Animated.View style={[styles.svgWrapper, animatedStyle]}>
          <Svg width={74} height={71} viewBox="0 0 74 71">
            <Circle
              cx="37"
              cy="35.5"
              r="30"
              stroke="#0A7CFF"
              strokeWidth="5"
              fill="none"
              strokeDasharray={180}
              strokeDashoffset="10"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
        <View style={styles.iconWrapper}>
          <Image
            source={require('../../assets/images/mailbox.png')}
            style={styles.image}
          />
        </View>
      </View>
      <Text style={styles.text}>Authenticating...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    minHeight: 200,
  },
  containerAnimated: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  svgWrapper: {
    alignSelf: 'center',
  },
  iconWrapper: {
    width: 74,
    height: 71,
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
