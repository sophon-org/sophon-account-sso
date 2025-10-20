import React, { useMemo } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

export function Card({ style, ...restProps }: ViewProps) {
  const cardStyle = useMemo(() => {
    return [styles.card, style].filter(Boolean);
  }, [style]);

  return <View style={cardStyle} {...restProps} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(245, 245, 245, 0.5)",
    borderRadius: 12,
    padding: 24,
    gap: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04, // 4%
    shadowRadius: 1,
    elevation: 1,
    overflow: "hidden",
  },
});
