import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AVAILABLE_PROVIDERS } from '../../constants';
import type { AuthProvider } from '../../hooks/use-embedded-auth';
import {
  Container,
  Icon,
  type ThemeColorType,
  useThemeColors,
  useThemedStyles,
} from '../../ui';
import { AuthenticatingSpinner } from './authenticating-spinner';

interface Props {
  providerRequest: string | null;
  onPressSocialSignIn: (provider: AuthProvider) => Promise<void>;
  isAuthenticating?: boolean;
  providerOrder?: AuthProvider[];
}

export const SocialProviderButtons = ({
  providerRequest,
  onPressSocialSignIn,
  isAuthenticating,
  providerOrder = AVAILABLE_PROVIDERS,
}: Props) => {
  const opacity = useSharedValue(0);
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    if (providerRequest) {
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [providerRequest, opacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: opacity.value > 0 ? 'auto' : 'none',
  }));

  return (
    <React.Fragment>
      <View style={styles.container}>
        {providerOrder.map((provider) => (
          <TouchableOpacity
            key={provider}
            style={styles.socialButton}
            disabled={!!providerRequest || isAuthenticating}
            onPress={() => onPressSocialSignIn(provider)}
          >
            <Icon name={provider} size={24} color={colors.black} />
          </TouchableOpacity>
        ))}
      </View>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        {providerRequest && (
          <Animated.View style={[styles.overlayContent]}>
            <AuthenticatingSpinner
              stroke={colors.blue[100]}
              isAuthenticating={isAuthenticating}
            >
              <Container
                justifyContent="center"
                alignItems="center"
                width={44}
                height={44}
              >
                <Icon
                  name={providerRequest}
                  size={32}
                  color={colors.blue[300]}
                />
              </Container>
            </AuthenticatingSpinner>
          </Animated.View>
        )}
      </Animated.View>
    </React.Fragment>
  );
};

const createStyles = (colors: ThemeColorType) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      marginBottom: 16,
    },
    socialButton: {
      width: 56,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.background.tertiary,
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: colors.border.light,
      borderWidth: 1,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 10,
      flex: 1,
      width: '100%',
      height: '100%',
      backgroundColor: colors.background.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    overlayContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
