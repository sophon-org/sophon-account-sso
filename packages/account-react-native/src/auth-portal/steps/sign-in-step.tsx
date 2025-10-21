import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { type AuthProvider, useEmbeddedAuth } from '../../auth/useAuth';
import { AVAILABLE_PROVIDERS } from '../../constants';
import { useBooleanState, useFlowManager } from '../../hooks';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
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
  const [email, setEmail] = useState(params?.email || '');
  const { signInWithSocialProvider, signInWithEmail } = useEmbeddedAuth();
  const {
    actions: { waitForAuthentication },
  } = useFlowManager();

  const handleSocialProviderPress = useCallback(
    async (provider: AuthProvider) => {
      try {
        const waitFor = waitForAuthentication();
        await signInWithSocialProvider(provider);
        const ownerAddress = await waitFor;
        onAuthenticate(ownerAddress);
      } catch (error) {
        console.log('USER CANCELED');
        console.error(error);
        await onError(error as Error);
      }
    },
    [signInWithSocialProvider, onComplete, onError],
  );

  const handleSignInWithEmail = useCallback(async () => {
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
      await onError(error as Error);
    } finally {
      loadingState.setOff();
    }
  }, [signInWithEmail, onComplete, onError, email]);

  const handleChangeText = useCallback((text: string) => {
    setEmail(text);
  }, []);

  const isEmailValid = useMemo(() => validateEmail(email), [email]);

  return (
    <View style={[styles.container]}>
      <View style={styles.socialRow}>
        {AVAILABLE_PROVIDERS.map((scope) => (
          <TouchableOpacity
            key={scope}
            style={styles.socialButton}
            onPress={() => handleSocialProviderPress(scope as AuthProvider)}
          >
            <Icon name={scope} size={24} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.emailSection}>
        <BottomSheetTextInput
          onChangeText={handleChangeText}
          value={email}
          textContentType="emailAddress"
          keyboardType="email-address"
          placeholder="Enter email"
          placeholderTextColor="#999"
          style={styles.input}
          autoCapitalize="none"
          onSubmitEditing={handleSignInWithEmail}
        />

        <Button
          text="Sign in with Wallet"
          disabled={!isEmailValid}
          onPress={handleSignInWithEmail}
          loading={loadingState.state}
        />
      </View>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>Alternatively</Text>
        <View style={styles.divider} />
      </View>

      <Button
        variant="secondary"
        text="Sign in with Wallet"
        onPress={() => navigate('loading')}
      />
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
  emailSection: {
    marginVertical: 16,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
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
