import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AVAILABLE_PROVIDERS } from '../../constants';
import type { AuthProvider } from '../../hooks/use-embedded-auth';
import { Container, Icon } from '../../ui';
import { AuthenticatingSpinner } from './circle-spinner';

interface Props {
  providerRequest: string | null;
  onPressSocialSignIn: (provider: AuthProvider) => Promise<void>;
  isAuthenticating?: boolean;
}

export const SocialProviderButtons = ({
  providerRequest,
  onPressSocialSignIn,
  isAuthenticating,
}: Props) => {
  const opacity = useSharedValue(0);

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
        {AVAILABLE_PROVIDERS.map((provider) => (
          <TouchableOpacity
            key={provider}
            style={styles.socialButton}
            disabled={!!providerRequest || isAuthenticating}
            onPress={() => onPressSocialSignIn(provider)}
          >
            <Icon name={provider} size={24} />
          </TouchableOpacity>
        ))}
      </View>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        {providerRequest && (
          <Animated.View style={[styles.overlayContent]}>
            <AuthenticatingSpinner
              stroke="#3377FF"
              isAuthenticating={isAuthenticating}
            >
              <Container
                justifyContent="center"
                alignItems="center"
                width={44}
                height={44}
              >
                <Icon name={providerRequest} size={32} color="#3377FF" />
              </Container>
            </AuthenticatingSpinner>
          </Animated.View>
        )}
      </Animated.View>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 16,
  },
  socialButton: {
    width: 56,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F6F7F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#EBEBEB',
    borderWidth: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,01)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
