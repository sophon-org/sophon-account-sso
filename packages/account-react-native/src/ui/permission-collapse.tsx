import { useCallback, useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Container } from "./container";
import { Icon } from "./icon";
import { Text } from "./text";
import { useBooleanState } from "../hooks";
import { Switch } from "./switch";

interface PermissionCollapseProps {
  name: string;
  label?: string;
  description?: string;
  allowed?: boolean;
  initialExpanded?: boolean;
  onChangePermission?: (allowed: boolean, name: string) => void | Promise<void>;
}
export function PermissionCollapse({
  name = "collapse",
  label,
  description,
  onChangePermission,
  initialExpanded = false,
  allowed = false,
}: PermissionCollapseProps) {
  const isExpanded = useBooleanState(initialExpanded);

  const handleToggle = useCallback((value: boolean) => {
    onChangePermission?.(value, name);
  }, []);
  return (
    <Container backgroundColor="#F4F4F4" gap={8} padding={18} borderRadius={8}>
      <CollapseHeader
        viewKey={`${name}_header`}
        label={label}
        isExpanded={isExpanded.state}
        onToggle={isExpanded.toggle}
        checked={Boolean(allowed)}
        onValueChange={handleToggle}
      />
      <Accordion isExpanded={isExpanded.state} viewKey={`${name}_body`}>
        {description}
      </Accordion>
    </Container>
  );
}

interface AccordionHeaderProps {
  checked: boolean;
  label?: string;
  isExpanded: boolean;
  viewKey: string | number;
  style?: object;
  duration?: number;
  onToggle?: () => void;
  onValueChange?: (value: boolean) => void | Promise<void>;
}

function CollapseHeader({
  label,
  isExpanded,
  onToggle,
  duration = 300,
  checked,
  onValueChange,
}: AccordionHeaderProps) {
  const rotation = useSharedValue(isExpanded ? 90 : 0);

  useEffect(() => {
    rotation.value = withTiming(isExpanded ? 90 : 0, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [isExpanded]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(rotation.value, [0, 90], [0, -90], Extrapolation.CLAMP)}deg`,
      },
    ],
  }));

  const handleToggle = useCallback(() => onToggle?.(), [onToggle]);
  const handleSwitch = useCallback((value: boolean) => onValueChange?.(value), [onValueChange]);

  return (
    <Pressable style={styles.header} onPress={handleToggle}>
      <Container
        flex={1}
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        gap={8}
      >
        <Container flexDirection="row" alignItems="center" justifyContent="center" gap={8}>
          <Animated.View style={iconStyle}>
            <Icon name="chevronRight" size={18} color="#A3A2A0" />
          </Animated.View>
          <Container>
            <Text fontWeight={"700"}>{label}</Text>
          </Container>
        </Container>
        <Container>
          <Switch value={checked} onValueChange={handleSwitch} />
        </Container>
      </Container>
    </Pressable>
  );
}

interface AccordionItemProps {
  isExpanded: boolean;
  viewKey: string | number;
  style?: object;
  duration?: number;
  children: string;
}

function Accordion({ isExpanded, viewKey, style, duration = 300, children }: AccordionItemProps) {
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
    <Animated.View key={`accordionItem_${viewKey}`} style={[styles.animatedView, bodyStyle, style]}>
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
    width: "100%",
    overflow: "hidden",
  },
  wrapper: {
    width: "100%",
    position: "absolute",
    display: "flex",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
});
