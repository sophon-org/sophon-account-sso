import { useMemo } from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

export function Card({ style, ...restProps }: ViewProps) {
  const cardStyle = useMemo(() => {
    return [styles.card, style].filter(Boolean);
  }, [style]);

  return <View style={cardStyle} {...restProps} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: {
        boxShadow: '0 2px 3px rgba(0, 0, 0, 0.08)',
        backgroundColor: 'rgba(245, 245, 245, 0.5)',
      },
      android: {
        backgroundColor: 'rgba(245, 245, 245, 1)',
        elevation: 1,
      },
    }),
    overflow: 'hidden',
  },
});
