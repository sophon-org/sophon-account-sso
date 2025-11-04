import { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  type TouchableOpacityProps,
  View,
} from 'react-native';
import { Text } from './text';
import { type ThemeColorType, useThemedStyles } from './theme-provider';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  text?: string;
  loading?: boolean;
  fullWidth?: boolean;
  containerStyle?: TouchableOpacityProps['style'];
}

export function Button({
  variant = 'primary',
  fullWidth,
  disabled,
  text,
  style,
  loading,
  containerStyle,
  ...restProps
}: ButtonProps & TouchableOpacityProps) {
  const styles = useThemedStyles(createStyles);
  const theme = useMemo(() => {
    if (disabled) {
      return {
        buttonStyle: styles.disabledButton,
        textStyle: styles.disabledText,
      };
    }
    if (variant === 'secondary') {
      return {
        buttonStyle: styles.secondaryButton,
        textStyle: styles.secondaryText,
      };
    }

    return {
      buttonStyle: styles.primaryButton,
      textStyle: styles.primaryText,
    };
  }, [disabled, variant, styles]);

  return (
    <View style={containerStyle}>
      <TouchableOpacity
        {...restProps}
        style={[
          styles.button,
          theme.buttonStyle,
          fullWidth && styles.fullWidth,
          style,
        ]}
        disabled={disabled || loading}
      >
        <Text style={theme.textStyle}>{text}</Text>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator
              style={styles.loadingIndicator}
              size="small"
              color={theme.textStyle.color}
            />
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColorType) =>
  StyleSheet.create({
    loading: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      justifyContent: 'center',
      alignItems: 'flex-end',
      alignContent: 'center',
    },
    loadingIndicator: {
      marginRight: 16,
    },
    fullWidth: {
      width: '100%',
    },
    button: {
      borderRadius: 12,
      minWidth: 150,
      height: 48,
      padding: 8,
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',
    },
    disabledButton: {
      backgroundColor: colors.gray[100],
    },
    disabledText: {
      color: colors.text.disabled,
    },
    primaryButton: {
      backgroundColor: colors.blue[300],
    },
    primaryText: {
      color: colors.white,
      fontWeight: '500',
    },
    secondaryButton: {
      backgroundColor: colors.blue[50],
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryText: {
      color: colors.text.link,
      fontWeight: '600',
    },
  });
