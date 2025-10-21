import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { type AuthProvider, useEmbeddedAuth } from '../../auth/useAuth';
import { AVAILABLE_PROVIDERS } from '../../constants';
import { useBooleanState, useFlowManager } from '../../hooks';
import { Button, Container, Icon } from '../../ui';
import { validateEmail } from '../../utils/validations';
import {
  useNavigationParams,
  useNavigationPortal,
} from '../hooks/use-auth-portal';
import type { BasicStepProps, SignInParams } from '../types';

export const SignInStep = ({
  onComplete,
  onError,
  onAuthenticate,
}: BasicStepProps) => {
  const params = useNavigationParams<SignInParams>();
  const { navigate } = useNavigationPortal();
  const loadingState = useBooleanState(false);
  const requestRef = useRef(false);
  const [email, setEmail] = useState(params?.email || '');
  const { signInWithSocialProvider, signInWithEmail } = useEmbeddedAuth();
  const {
    actions: { waitForAuthentication },
  } = useFlowManager();

  const handleSocialProviderPress = useCallback(
    async (provider: AuthProvider) => {
      if (requestRef.current) return;
      try {
        requestRef.current = true;
        const waitFor = waitForAuthentication();
        await signInWithSocialProvider(provider);
        const ownerAddress = await waitFor;
        onAuthenticate(ownerAddress);
      } catch (error) {
        console.log('USER CANCELED');
        console.error(error);
        await onError(error as Error);
      } finally {
        requestRef.current = false;
      }
    },
    [signInWithSocialProvider, onComplete, onError],
  );

  const handleSignInWithEmail = useCallback(async () => {
    if (loadingState.state) return;
    try {
      loadingState.setOn();
      await signInWithEmail(email);
      console.log('otp sent', email);
      navigate('verifyEmail', {
        params: { email },
        inheritParamsFrom: ['signIn'],
      });
    } catch (error) {
      console.log('USER CANCELED2');
      console.error(error);
      await onError(error as Error, 'signIn');
    } finally {
      loadingState.setOff();
    }
  }, [signInWithEmail, onComplete, onError, email, loadingState.state]);

  const handleChangeText = useCallback((text: string) => {
    setEmail(text);
  }, []);

  const isEmailValid = useMemo(() => validateEmail(email), [email]);

  return (
    <View style={styles.container}>
      <View style={styles.socialRow}>
        {AVAILABLE_PROVIDERS.map((provider) => (
          <TouchableOpacity
            key={provider}
            style={styles.socialButton}
            disabled={loadingState.state}
            onPress={() => handleSocialProviderPress(provider as AuthProvider)}
          >
            <Icon name={provider} size={24} />
          </TouchableOpacity>
        ))}
      </View>

      <Container marginVertical={16}>
        <BottomSheetTextInput
          onChangeText={handleChangeText}
          value={email}
          placeholder="Enter email"
          placeholderTextColor="#D2D2D2"
          style={[styles.input, isEmailValid && styles.inputValid]}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleSignInWithEmail}
        />
        <Button
          text="Sign in with Wallet"
          disabled={!isEmailValid}
          onPress={handleSignInWithEmail}
          loading={loadingState.state}
        />
      </Container>
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>Alternatively</Text>
        <View style={styles.divider} />
      </View>
      <Container marginVertical={16}>
        <Button
          variant="secondary"
          text="Sign in with Wallet"
          onPress={() => navigate('loading')}
        />
      </Container>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  socialRow: {
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
  inputValid: {
    borderColor: '#8D8D8D',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#EEE',
    color: '##2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    fontSize: 15,
    lineHeight: 15 * 1.33,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    height: 32,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEE',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
  },
});
