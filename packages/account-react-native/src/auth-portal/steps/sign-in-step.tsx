import { useCallback, useMemo, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import {
  useBooleanState,
  useFlowManager,
  useSophonCapabilities,
} from '../../hooks';
import { AuthProvider, useEmbeddedAuth } from '../../hooks/use-embedded-auth';
import { useTranslation } from '../../i18n';
import {
  Button,
  CardError,
  Container,
  type ThemeColorType,
  useThemeColors,
  useThemedStyles,
} from '../../ui';
import { validateEmail } from '../../utils/validations';
import { AdaptiveTextInput } from '../components/adaptive-text-input';
import { SocialProviderButtons } from '../components/social-provider-buttons';
import {
  useBottomSheetKeyboardFix,
  useNavigationParams,
  useNavigationPortal,
} from '../hooks';
import type { BasicStepProps, SignInParams } from '../types';
import {
  DEFAULT_AUTH_CONFIG,
  type AuthFlowConfig,
  type LoginOption,
} from '../../constants';

interface SignInStepProps extends BasicStepProps {
  authConfig?: AuthFlowConfig;
}

export const SignInStep = ({
  onError,
  onAuthenticate,
  authConfig = DEFAULT_AUTH_CONFIG,
}: SignInStepProps) => {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [error, setError] = useState<null | string>(null);
  const [showMore, setShowMore] = useState(false);
  const params = useNavigationParams<SignInParams>();
  const { navigate } = useNavigationPortal();
  const loadingState = useBooleanState(false);
  const [providerRequest, setCurrentProviderLoadingState] = useState<
    string | null
  >(null);
  const [email, setEmail] = useState(params?.email || '');
  const { signInWithSocialProvider, signInWithEmail } = useEmbeddedAuth();
  const {
    actions: { waitForAuthentication },
  } = useFlowManager();

  useBottomSheetKeyboardFix();

  const handleSocialProviderPress = useCallback(
    async (provider: AuthProvider) => {
      try {
        Keyboard.dismiss();
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

  const renderLoginOption = useCallback(
    (option: LoginOption, index: number) => {
      switch (option.type) {
        case 'socials':
          return (
            <SocialProviderButtons
              key={`socials-${index}`}
              isAuthenticating={loadingState.state}
              providerRequest={providerRequest}
              onPressSocialSignIn={handleSocialProviderPress}
              providerOrder={option.socialPriority}
            />
          );

        case 'email':
          return (
            <Container key={`email-${index}`} marginTop={0} marginBottom={16}>
              <AdaptiveTextInput
                onChangeText={handleChangeText}
                value={email}
                keyboardType="email-address"
                placeholder={t('signInStep.enterEmail')}
                placeholderTextColor={colors.neutral[600]}
                style={[styles.input, isEmailValid && styles.inputValid]}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={
                  isEmailValid ? handleSignInWithEmail : undefined
                }
                onFocus={() => setError(null)}
              />
              <Button
                text={t('common.signIn')}
                disabled={!isEmailValid}
                onPress={handleSignInWithEmail}
                loading={loadingState.state}
              />
              <CardError
                isVisible={!!error}
                text={error ?? ''}
                marginTop={12}
              />
            </Container>
          );

        case 'wallet':
          return isWalletConnectEnabled ? (
            <Container key={`wallet-${index}`} marginVertical={16}>
              <Button
                variant="secondary"
                text={t('signInStep.signInWithWallet')}
                onPress={() => navigate('loading')}
              />
            </Container>
          ) : null;

        default:
          return null;
      }
    },
    [
      loadingState.state,
      providerRequest,
      handleSocialProviderPress,
      handleChangeText,
      email,
      t,
      colors.neutral,
      styles.input,
      styles.inputValid,
      isEmailValid,
      handleSignInWithEmail,
      error,
      isWalletConnectEnabled,
      navigate,
    ],
  );

  const hasShowMore = authConfig.showMore && authConfig.showMore.length > 0;

  return (
    <View>
      {authConfig.highlight.map(renderLoginOption)}

      {hasShowMore && (
        <>
          <Container marginVertical={16}>
            <Button
              variant="secondary"
              text={showMore ? 'Show less options' : 'Show more options'}
              onPress={() => {
                setShowMore(!showMore);
              }}
            />
          </Container>

          {showMore && <>{authConfig.showMore!.map(renderLoginOption)}</>}
        </>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColorType) =>
  StyleSheet.create({
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
    inputValid: {
      borderColor: colors.text.secondary,
    },
    input: {
      height: 48,
      borderWidth: 1,
      borderColor: colors.gray[700],
      color: colors.text.primary,
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
      backgroundColor: colors.gray[700],
    },
    dividerText: {
      marginHorizontal: 10,
      color: colors.gray[500],
    },
  });
