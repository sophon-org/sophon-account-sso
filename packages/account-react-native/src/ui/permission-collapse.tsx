import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useBooleanState } from '../hooks';
import { Accordion } from './accordion';
import { Container } from './container';
import { Icon } from './icon';
import { Switch } from './switch';
import { Text } from './text';

interface PermissionCollapseProps {
  name: string;
  label?: string;
  description?: string;
  allowed?: boolean;
  initialExpanded?: boolean;
  onChangePermission?: (allowed: boolean, name: string) => void | Promise<void>;
}
export function PermissionCollapse({
  name = 'collapse',
  label,
  description,
  onChangePermission,
  initialExpanded = false,
  allowed = false,
}: PermissionCollapseProps) {
  const isExpanded = useBooleanState(initialExpanded);

  const handleToggle = useCallback(
    (value: boolean) => {
      onChangePermission?.(value, name);
    },
    [name, onChangePermission],
  );

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
        {description ?? ''}
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
  }, [isExpanded, duration, rotation]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(rotation.value, [0, 90], [0, -90], Extrapolation.CLAMP)}deg`,
      },
    ],
  }));

  const handleToggle = useCallback(() => onToggle?.(), [onToggle]);
  const handleSwitch = useCallback(
    (value: boolean) => onValueChange?.(value),
    [onValueChange],
  );

  return (
    <Pressable
      hitSlop={{ top: 10, bottom: 10 }}
      style={styles.header}
      onPress={handleToggle}
    >
      <Container
        flex={1}
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        gap={8}
      >
        <Container
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          gap={8}
        >
          <Animated.View style={iconStyle}>
            <Icon name="chevronRight" size={18} color="#A3A2A0" />
          </Animated.View>
          <Container>
            <Text fontWeight={'700'}>{label}</Text>
          </Container>
        </Container>
        <Container>
          <Switch value={checked} onValueChange={handleSwitch} />
        </Container>
      </Container>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
  },
});
