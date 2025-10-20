import { View, type ViewProps } from 'react-native';

export function Container({
  isVisible = true,
  ...restProps
}: ViewProps & { isVisible?: boolean }) {
  if (!isVisible) return null;

  return <View {...restProps} />;
}
