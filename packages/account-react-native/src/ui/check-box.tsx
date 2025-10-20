import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, View, type TextStyle } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolateColor,
  interpolate,
} from "react-native-reanimated";
import { Icon } from "./icon";
import { Text } from "./text";

export const CheckBox: React.FC<{
  checked?: boolean;
  label: string;
  onChange?: (checked: boolean) => void;
  blocked?: boolean;
  textStyle?: TextStyle;
}> = ({ label, onChange, checked = false, blocked = false, textStyle }) => {
  const [_checked, setChecked] = useState(checked || blocked);
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
    <Pressable onPress={toggle} style={styles.container} disabled={blocked}>
      <Animated.View style={[styles.checkbox, boxStyle, blocked && styles.blocked]}>
        <Animated.View style={[iconStyle, styles.icon]}>
          <Icon name={blocked ? "close" : "checkmark"} size={blocked ? 14 : 20} color="#ffffff" />
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
  blocked: {
    backgroundColor: "#8D8D8D",
    borderColor: "#8D8D8D",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    top: 5,
  },
});
