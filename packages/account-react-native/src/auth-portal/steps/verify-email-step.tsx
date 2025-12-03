import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  type TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { OTP_CODE_LENGTH } from '../../constants/verify-otp';
import { useBooleanState, useFlowManager } from '../../hooks';
import { useEmbeddedAuth } from '../../hooks/use-embedded-auth';
import { useTranslation } from '../../i18n';
import {
  Button,
  CardError,
  Container,
  Text,
  type ThemeColorType,
  useThemeColors,
  useThemedStyles,
} from '../../ui';
import { scaleWithBoxInput } from '../../utils/platform-utils';
import { AdaptiveTextInput } from '../components/adaptive-text-input';
import { StepContainer } from '../components/step-container';
import { useNavigationParams } from '../navigation';
import type { BasicStepProps, VerifyCodeParams } from '../types';

const defaultCodeArray = Array(OTP_CODE_LENGTH).fill('');
const SCALE_ANIMATION_DURATION = 60;
const OPACITY_ANIMATION_DURATION = 80;

export function VerifyEmailStep({ onAuthenticate, onError }: BasicStepProps) {
  const layout = useWindowDimensions();
  const boxWidth = useMemo(
    () => scaleWithBoxInput(layout.width),
    [layout.width],
  );
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();

  const { t } = useTranslation();
  const loadingState = useBooleanState(false);
  const loadingResendState = useBooleanState(false);
  const [error, setError] = useState<{
    type: 'invalidCode' | 'resendLink';
    message: string;
  } | null>(null);

  const params = useNavigationParams<VerifyCodeParams>();
  const [, forceUpdate] = useState({});

  const codesRef = useRef<string[]>(defaultCodeArray);
  const inputsRef = useRef<TextInput[]>([]);
  const scales = useRef(
    Array.from({ length: OTP_CODE_LENGTH }, () => useSharedValue(1)),
  ).current;
  const opacities = useRef(
    Array.from({ length: OTP_CODE_LENGTH }, () => useSharedValue(0.3)),
  ).current;

  const { verifyEmailOTP, resendEmailOTP } = useEmbeddedAuth();
  const {
    actions: { waitForAuthentication },
  } = useFlowManager();

  const handleOnError = useCallback(
    async (error: Error) => {
      setError({
        type: 'invalidCode',
        message: t('verifyEmailStep.invalidCode'),
      });
      console.error(error);
      onError(error, 'verifyEmail');
      codesRef.current = [...defaultCodeArray];
      forceUpdate({});
      defaultCodeArray.forEach((_, index) => {
        opacities[index]!.value = withTiming(0.3, {
          duration: OPACITY_ANIMATION_DURATION,
        });
      });
    },
    [onError, opacities, t],
  );

  const handleVerifyEmailOTP = useCallback(
    async (code?: string) => {
      try {
        setError(null);
        loadingState.setOn();
        const codeToVerify = code || codesRef.current.join('');
        const waitFor = waitForAuthentication();
        await verifyEmailOTP(codeToVerify);
        const ownerAddress = await waitFor;
        onAuthenticate(ownerAddress);
        Keyboard.dismiss();
      } catch (error) {
        handleOnError(error as Error);
        loadingState.setOff();
      }
    },
    [
      verifyEmailOTP,
      onAuthenticate,
      loadingState,
      handleOnError,
      waitForAuthentication,
    ],
  );

  const handleResendEmailOTP = useCallback(async () => {
    try {
      setError(null);
      loadingResendState.setOn();
      await resendEmailOTP();
    } catch {
      setError({
        type: 'resendLink',
        message: t('verifyEmailStep.errorResendLink'),
      });
    } finally {
      loadingResendState.setOff();
    }
  }, [resendEmailOTP, t, loadingResendState]);

  const focusIndex = useCallback((index: number) => {
    inputsRef.current[index]?.focus();
  }, []);

  const onCompleteCode = useCallback(() => {
    Keyboard.dismiss();
    inputsRef.current.forEach((input) => input?.blur());
  }, []);

  const handleKeyPress = useCallback(
    (key: string, index: number, forceFocusIndex?: boolean) => {
      if (key === 'Backspace') {
        const newCodes = [...codesRef.current];
        if (index > 0 && !codesRef.current[index]) {
          const indexToFocus = index - 1;
          newCodes[indexToFocus] = '';
          opacities[indexToFocus]!.value = withTiming(0.3, {
            duration: OPACITY_ANIMATION_DURATION,
          });
        }
        newCodes[index] = '';
        const isLastCodeHasValue = Boolean(
          index === OTP_CODE_LENGTH - 1 && codesRef.current[index],
        );
        codesRef.current = newCodes;
        forceUpdate({});

        opacities[index]!.value = withTiming(0.3, {
          duration: OPACITY_ANIMATION_DURATION,
        });
        if ((index > 0 && !isLastCodeHasValue) || forceFocusIndex) {
          focusIndex(index - 1);
        }
      }
    },
    [focusIndex, opacities],
  );

  const handleChange = useCallback(
    (text: string, index: number) => {
      let digits = text.replace(/[^0-9]/g, '').split('');
      const prev = codesRef.current[index];
      if (digits.length === 0) {
        if (Platform.OS === 'android' && prev && prev.length) {
          // force backspace on android when deleting the only digit with keyboard external
          return handleKeyPress('Backspace', index, true);
        }
        return;
      }

      const newValues = [...codesRef.current];
      let nextIndex = index;

      // OneTimeCode auto fill case
      if (digits.length === OTP_CODE_LENGTH && index === 0) {
        digits.forEach((decimal, idx) => {
          if (idx < OTP_CODE_LENGTH) {
            newValues[idx] = decimal;
            scales[idx]!.value = withTiming(
              1.08,
              { duration: SCALE_ANIMATION_DURATION },
              () => {
                scales[idx]!.value = withTiming(1, {
                  duration: SCALE_ANIMATION_DURATION,
                });
              },
            );
            opacities[idx]!.value = withTiming(1, {
              duration: OPACITY_ANIMATION_DURATION,
            });
          }
        });
        codesRef.current = newValues;
        forceUpdate({});
        onCompleteCode();
        handleVerifyEmailOTP(newValues.join(''));
        return;
      }

      const currentValue = newValues[nextIndex];
      if (currentValue && text.startsWith(currentValue)) {
        digits = digits.slice(1);
      }

      digits.forEach((decimal) => {
        if (nextIndex < OTP_CODE_LENGTH) {
          newValues[nextIndex] = decimal;
          scales[nextIndex]!.value = withTiming(
            1.08,
            { duration: SCALE_ANIMATION_DURATION },
            () => {
              scales[nextIndex]!.value = withTiming(1, {
                duration: SCALE_ANIMATION_DURATION,
              });
            },
          );
          opacities[nextIndex]!.value = withTiming(1, {
            duration: OPACITY_ANIMATION_DURATION,
          });
        }
        nextIndex++;
      });

      codesRef.current = newValues;
      forceUpdate({});

      if (nextIndex < OTP_CODE_LENGTH) {
        focusIndex(nextIndex);
      } else if (digits.length === OTP_CODE_LENGTH) {
        onCompleteCode();
      }
    },
    [
      focusIndex,
      onCompleteCode,
      opacities,
      scales,
      handleKeyPress,
      handleVerifyEmailOTP,
    ],
  );

  const renderInput = useCallback(
    (value: string, index: number) => {
      const animatedStyle = useAnimatedStyle(() => {
        const scale = scales[index]!.value;
        const opacity = opacities[index]!.value;
        const borderColor = interpolateColor(
          opacity,
          [0.3, 1],
          [colors.text.disabled, colors.text.secondary],
        ) as string;

        return {
          transform: [{ scale }],
          opacity,
          borderColor,
        };
      });
      const isLastInput = index === OTP_CODE_LENGTH - 1;
      const maxLength = isLastInput
        ? 1
        : OTP_CODE_LENGTH - index + value.length;
      return (
        <Animated.View
          key={index}
          style={[
            styles.box,
            loadingState.state && styles.inputDisabled,
            animatedStyle,
          ]}
        >
          <AdaptiveTextInput
            ref={(el) => {
              inputsRef.current[index] = el as TextInput;
            }}
            selection={{ start: 1, end: 1 }}
            style={[styles.input, { width: boxWidth }]}
            keyboardType="numeric"
            textContentType="oneTimeCode"
            maxLength={maxLength}
            value={value}
            cursorColor={colors.black}
            onChangeText={(code) => handleChange(code, index)}
            onKeyPress={(event) => handleKeyPress(event.nativeEvent.key, index)}
            textAlign="center"
            returnKeyType="done"
            submitBehavior="submit"
            editable={!loadingState.state || loadingResendState.state}
            onSubmitEditing={() => {
              if (index === OTP_CODE_LENGTH - 1 && value.length === 1) {
                handleVerifyEmailOTP();
              } else {
                Keyboard.dismiss();
              }
            }}
          />
        </Animated.View>
      );
    },
    [
      handleChange,
      handleKeyPress,
      handleVerifyEmailOTP,
      loadingState.state,
      loadingResendState.state,
      opacities,
      scales,
      colors,
      styles,
      boxWidth,
    ],
  );

  useEffect(() => {
    focusIndex(0);
  }, [focusIndex]);

  return (
    <StepContainer>
      <Container gap={8} marginBottom={8}>
        <Text size="large" textAlign="center">
          {t('verifyEmailStep.insertCode')}
        </Text>
        <View>
          <Text textAlign="center">
            {t('verifyEmailStep.checkEmailFor', { email: params?.email })}
          </Text>
          <Text textAlign="center">{t('verifyEmailStep.theCode')}</Text>
        </View>
      </Container>
      <Container gap={12} marginVertical={16}>
        <View style={styles.containerInput}>
          {codesRef.current.map(renderInput)}
        </View>
        <Button
          variant="primary"
          text="Verify"
          loading={loadingState.state}
          onPress={() => handleVerifyEmailOTP()}
          disabled={
            codesRef.current.some((code) => code === '') ||
            loadingResendState.state
          }
        />
        <CardError
          isVisible={error?.type === 'invalidCode'}
          text={error?.message}
        />
      </Container>
      <Container gap={24} marginVertical={16}>
        <Text color={colors.text.secondary} textAlign="center">
          {t('verifyEmailStep.didNotReceiveCode')}
        </Text>
        <Button
          variant="secondary"
          text={t('verifyEmailStep.resendLink')}
          loading={loadingResendState.state}
          onPress={handleResendEmailOTP}
        />
        <CardError
          isVisible={error?.type === 'resendLink'}
          text={error?.message}
        />
      </Container>
    </StepContainer>
  );
}

const createStyles = (colors: ThemeColorType) =>
  StyleSheet.create({
    containerInput: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    box: {
      minWidth: 32,
      height: 48,
      maxWidth: 48,
      borderWidth: 1,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.white,
    },
    input: {
      fontSize: 15,
      width: '100%',
      height: '100%',
      textAlign: 'center',
      color: colors.text.primary,
    },
    inputDisabled: {
      backgroundColor: colors.gray[100],
      borderRadius: 12,
    },
  });
