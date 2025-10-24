import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  useBooleanState,
  useFlowManager,
  useSophonCapabilities,
} from '../../hooks';
import {
  type AuthProvider,
  useEmbeddedAuth,
} from '../../hooks/use-embedded-auth';
import { useTranslation } from '../../i18n';
import { Button, CardError, Container } from '../../ui';
import { validateEmail } from '../../utils/validations';
import { SocialProviderButtons } from '../components/social-provider-buttons';
import { useNavigationParams, useNavigationPortal } from '../hooks';
import type { BasicStepProps, SignInParams } from '../types';

export const SignInStep = ({ onError, onAuthenticate }: BasicStepProps) => {
  const { t } = useTranslation();
  const [error, setError] = useState<null | string>(null);
  const params = useNavigationParams<SignInParams>();
  const { navigate } = useNavigationPortal();
  const loadingState = useBooleanState(false);
  const [providerRequest, setCurrentProviderLoadingState] = useState<
    null | string
  >(null);
  const [email, setEmail] = useState(params?.email || '');
  const { signInWithSocialProvider, signInWithEmail } = useEmbeddedAuth();
  const {
    actions: { waitForAuthentication },
  } = useFlowManager();

  const handleSocialProviderPress = useCallback(
    async (provider: AuthProvider) => {
      try {
        const waitFor = waitForAuthentication();
        setCurrentProviderLoadingState(provider);
        await signInWithSocialProvider(provider);
        const ownerAddress = await waitFor;
        loadingState.setOn();
        onAuthenticate(ownerAddress, { provider });
      } catch (error) {
        setCurrentProviderLoadingState(null);
        console.log('USER CANCELED');
        console.error(error);
        onError(error as Error);
      }
    },
    [
      signInWithSocialProvider,
      onError,
      onAuthenticate,
      waitForAuthentication,
      loadingState,
    ],
  );
  const isEmailValid = useMemo(() => validateEmail(email), [email]);
  const handleSignInWithEmail = useCallback(async () => {
    try {
      loadingState.setOn();
      await signInWithEmail(email);
      navigate('verifyEmail', {
        params: { email },
        inheritParamsFrom: ['signIn'],
      });
    } catch (error) {
      console.error(error);
      setError((error as Error)?.message ?? null);
      await onError(error as Error, 'signIn');
    } finally {
      loadingState.setOff();
    }
  }, [signInWithEmail, onError, email, navigate, loadingState]);

  const handleChangeText = useCallback((text: string) => {
    setEmail(text);
  }, []);

  const { isWalletConnectEnabled } = useSophonCapabilities();

  return (
    <View style={styles.container}>
      <SocialProviderButtons
        isAuthenticating={loadingState.state}
        providerRequest={providerRequest}
        onPressSocialSignIn={handleSocialProviderPress}
      />

      <Container marginVertical={16}>
        <BottomSheetTextInput
          onChangeText={handleChangeText}
          value={email}
          keyboardType="email-address"
          placeholder={t('signInStep.enterEmail')}
          placeholderTextColor="#D2D2D2"
          style={[styles.input, isEmailValid && styles.inputValid]}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={isEmailValid ? handleSignInWithEmail : undefined}
          onFocus={() => setError(null)}
        />
        <Button
          text={t('common.signIn')}
          disabled={!isEmailValid}
          onPress={handleSignInWithEmail}
          loading={loadingState.state}
        />
        <CardError isVisible={!!error} text={error ?? ''} marginTop={12} />
      </Container>
      <Container
        isVisible={isWalletConnectEnabled}
        style={styles.dividerContainer}
      >
        <View style={styles.divider} />
        <Text style={styles.dividerText}>{t('signInStep.alternatively')}</Text>
        <View style={styles.divider} />
      </Container>
      <Container isVisible={isWalletConnectEnabled} marginVertical={16}>
        <Button
          variant="secondary"
          text={t('signInStep.signInWithWallet')}
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
  overlay: {
    ...StyleSheet.absoluteFillObject, // 🔹 cobre o botão todo
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)', // leve transparência
    borderRadius: 16,
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
