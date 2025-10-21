import type React from "react";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, type TextStyle, View } from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Icon } from "./icon";
import { Text } from "./text";

export const CheckBox: React.FC<{
  defaultChecked?: boolean;
  locked?: boolean;
  label: string;
  onChange?: (checked: boolean) => void;
  unavailable?: boolean;
  textStyle?: TextStyle;
}> = ({
  label,
  onChange,
  defaultChecked = false,
  unavailable = false,
  textStyle,
  locked = false,
}) => {
  const [_checked, setChecked] = useState(defaultChecked || unavailable);
  const progress = useSharedValue(_checked ? 1 : 0);

  const toggle = useCallback(() => {
    const newState = !_checked;
    progress.value = withTiming(newState ? 1 : 0, { duration: 250 });
    setChecked(newState);
    onChange?.(newState);
  }, [onChange, progress, _checked]);

  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ["#FFF", "#0A7CFF"]),
    borderColor: interpolateColor(progress.value, [0, 1], ["#5C5851", "#0A7CFF"]),
    borderRadius: interpolate(progress.value, [0, 1], [4, 10]),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.8, 1]) }],
  }));

  return (
    <Pressable onPress={toggle} style={styles.container} disabled={unavailable || locked}>
      <Animated.View style={[styles.checkbox, boxStyle, unavailable && styles.unavailable]}>
        <Animated.View style={[iconStyle, styles.icon]}>
          <Icon
            name={unavailable ? "close" : "checkmark"}
            size={unavailable ? 14 : 20}
            color="#ffffff"
          />
        </Animated.View>
      </Animated.View>
      <View style={styles.textWrapper}>
        <Text style={textStyle}>{label}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  textWrapper: {
    flex: 1,
    flexShrink: 1,
  },
  icon: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  unavailable: {
    backgroundColor: "#8D8D8D",
    borderColor: "#8D8D8D",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    top: 3,
  },
});
