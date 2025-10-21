import { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  type TouchableOpacityProps,
  View,
} from "react-native";
import { Text } from "./text";

interface ButtonProps {
  variant?: "primary" | "secondary";
  disabled?: boolean;
  text?: string;
  loading?: boolean;
  fullWidth?: boolean;
  containerStyle?: TouchableOpacityProps["style"];
}

export function Button({
  variant = "primary",
  fullWidth,
  disabled,
  text,
  style,
  loading,
  containerStyle,
  ...restProps
}: ButtonProps & TouchableOpacityProps) {
  const theme = useMemo(() => {
    if (disabled) {
      return {
        buttonStyle: styles.disabledButton,
        textStyle: styles.disabledText,
      };
    }
    if (variant === "secondary") {
      return {
        buttonStyle: styles.secondaryButton,
        textStyle: styles.secondaryText,
      };
    }

    return {
      buttonStyle: styles.primaryButton,
      textStyle: styles.primaryText,
    };
  }, [disabled, variant]);

  return (
    <View style={containerStyle}>
      <TouchableOpacity
        {...restProps}
        style={[styles.button, theme.buttonStyle, fullWidth && styles.fullWidth, style]}
        disabled={disabled || loading}
      >
        <Text style={theme.textStyle}>{text}</Text>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={theme.textStyle.color} />
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    position: "absolute",
    top: 12,
    right: 24,
  },
  fullWidth: {
    width: "100%",
  },
  button: {
    borderRadius: 12,
    minWidth: 150,
    height: 48,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#F0F0F0",
  },
  disabledText: {
    color: "#D2D2D2",
  },
  primaryButton: {
    backgroundColor: "#0A7CFF",
  },
  primaryText: {
    color: "#ffffff",
    fontWeight: "500",
  },
  secondaryButton: {
    backgroundColor: "#EAF1FF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryText: {
    color: "#0066FF",
    fontWeight: "600",
  },
});
