import { useMemo } from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';
import { type ThemeColorType, useThemedStyles } from './theme-provider';

export function Card({ style, ...restProps }: ViewProps) {
  const styles = useThemedStyles(createStyles);
  const cardStyle = useMemo(() => {
    return [styles.card, style].filter(Boolean);
  }, [style, styles]);

  return <View style={cardStyle} {...restProps} />;
}

const createStyles = (colors: ThemeColorType) =>
  StyleSheet.create({
    card: {
      borderRadius: 12,
      borderWidth: 0.5,
      borderColor: colors.border.subtle,
      ...Platform.select({
        ios: {
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
          backgroundColor: colors.background.secondary,
        },
        android: {
          backgroundColor: colors.background.secondary,
          elevation: 1,
        },
      }),
      overflow: 'hidden',
    },
  });
