import { type PropsWithChildren, useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { type ThemeColorType, useThemedStyles } from './theme-provider';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  loading?: boolean;
  marginBottom?: number;
}

const SkeletonComponent: React.FC<SkeletonProps> = ({
  width = 150,
  height = 24,
  borderRadius = 4,
  marginBottom = 4,
  style,
}) => {
  const styles = useThemedStyles(createStyles);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <View
      style={[
        styles.container,
        { width, height, borderRadius, marginBottom } as ViewStyle,
        style,
      ]}
    >
      <Animated.View
        style={[styles.shimmer, { borderRadius, height }, animatedStyle]}
      />
    </View>
  );
};

export function Skeleton(props: PropsWithChildren<SkeletonProps>) {
  if (props?.loading) return <SkeletonComponent {...props} />;

  return <>{props.children}</>;
}

const createStyles = (colors: ThemeColorType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background.secondary,
      overflow: 'hidden',
    },
    shimmer: {
      width: '100%',
      backgroundColor: colors.background.primary,
    },
  });
