import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  type TextInput,
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
import { AdaptiveTextInput } from '../components/adaptive-text-input';
import { useNavigationParams } from '../hooks';
import type { BasicStepProps, VerifyCodeParams } from '../types';

const defaultCodeArray = Array(OTP_CODE_LENGTH).fill('');

export function VerifyEmailStep({ onAuthenticate, onError }: BasicStepProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const loadingState = useBooleanState(false);
  const errorState = useBooleanState(false);
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
      errorState.setOn();
      console.error(error);
      onError(error, 'verifyEmail');
      codesRef.current = [...defaultCodeArray];
      forceUpdate({});
      defaultCodeArray.forEach((_, index) => {
        opacities[index]!.value = withTiming(0.3, { duration: 100 });
      });
    },
    [onError, errorState, opacities],
  );

  const handleVerifyEmailOTP = useCallback(
    async (code?: string) => {
      try {
        errorState.setOff();
        loadingState.setOn();
        Keyboard.dismiss();
        const codeToVerify = code || codesRef.current.join('');
        const waitFor = waitForAuthentication();
        await verifyEmailOTP(codeToVerify);
        const ownerAddress = await waitFor;
        onAuthenticate(ownerAddress);
      } catch (error) {
        handleOnError(error as Error);
        loadingState.setOff();
      }
    },
    [
      verifyEmailOTP,
      onAuthenticate,
      errorState,
      loadingState,
      handleOnError,
      waitForAuthentication,
    ],
  );

  const focusIndex = useCallback((index: number) => {
    inputsRef.current[index]?.focus();
  }, []);

  const onCompleteCode = useCallback(() => {
    Keyboard.dismiss();
    inputsRef.current.forEach((input) => input?.blur());
  }, []);

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace') {
        const newCodes = [...codesRef.current];
        if (index > 0 && !codesRef.current[index]) {
          const indexToFocus = index - 1;
          newCodes[indexToFocus] = '';
          opacities[indexToFocus]!.value = withTiming(0.3, { duration: 100 });
        }
        newCodes[index] = '';
        codesRef.current = newCodes;
        forceUpdate({});

        opacities[index]!.value = withTiming(0.3, { duration: 100 });
        const isLastCodeHasValue = Boolean(
          index === OTP_CODE_LENGTH - 1 && codesRef.current[index],
        );
        if (index > 0 && !isLastCodeHasValue) {
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
          return handleKeyPress('Backspace', index);
        }
        return;
      }

      const newValues = [...codesRef.current];
      let nextIndex = index;

      const currentValue = newValues[nextIndex];
      if (currentValue && text.startsWith(currentValue)) {
        digits = digits.slice(1);
      }

      digits.forEach((decimal) => {
        if (nextIndex < OTP_CODE_LENGTH) {
          newValues[nextIndex] = decimal;
          scales[nextIndex]!.value = withTiming(1.08, { duration: 80 }, () => {
            scales[nextIndex]!.value = withTiming(1, { duration: 80 });
          });
          opacities[nextIndex]!.value = withTiming(1, { duration: 100 });
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
    [focusIndex, onCompleteCode, opacities, scales, handleKeyPress],
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
        <Animated.View key={index} style={[styles.box, animatedStyle]}>
          <AdaptiveTextInput
            ref={(el) => {
              inputsRef.current[index] = el as TextInput;
            }}
            selection={{ start: 1, end: 1 }}
            style={[styles.input, loadingState.state && styles.inputDisabled]}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            maxLength={maxLength}
            value={value}
            cursorColor={colors.black}
            onChangeText={(code) => handleChange(code, index)}
            onKeyPress={(event) => handleKeyPress(event.nativeEvent.key, index)}
            textAlign="center"
            returnKeyType="done"
            editable={!loadingState.state}
            onSubmitEditing={() => {
              if (index === OTP_CODE_LENGTH - 1 && value.length === 1) {
                handleVerifyEmailOTP();
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
      opacities,
      scales,
      colors,
      styles,
    ],
  );

  useEffect(() => {
    focusIndex(0);
  }, [focusIndex]);

  return (
    <Container>
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
          disabled={codesRef.current.some((code) => code === '')}
        />
        <CardError
          isVisible={errorState.state}
          text={t('verifyEmailStep.invalidCode')}
        />
      </Container>
      <Container gap={24} marginVertical={16}>
        <Text color={colors.text.secondary} textAlign="center">
          {t('verifyEmailStep.didNotReceiveCode')}
        </Text>
        <Button
          variant="secondary"
          text={t('verifyEmailStep.resendLink')}
          onPress={resendEmailOTP}
        />
      </Container>
    </Container>
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
      width: 48,
      height: 48,
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
