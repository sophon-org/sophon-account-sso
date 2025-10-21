import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  type NativeSyntheticEvent,
  StyleSheet,
  type TextInput,
  type TextInputKeyPressEventData,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEmbeddedAuth } from '../../auth/useAuth';
import { OTP_CODE_LENGTH } from '../../constants/verify-otp';
import { useBooleanState, useFlowManager } from '../../hooks';
import { Button, Card, Container, Icon, Text } from '../../ui';
import { useNavigationParams } from '../hooks';
import type { BasicStepProps, VerifyCodeParams } from '../types';

const defaultCodeArray = Array(OTP_CODE_LENGTH).fill('');

export function VerifyEmailStep({ onAuthenticate, onError }: BasicStepProps) {
  const loadingState = useBooleanState(false);
  const errorState = useBooleanState(false);
  const params = useNavigationParams<VerifyCodeParams>();
  const [codes, setValues] = useState(defaultCodeArray);
  const inputsRef = useRef<TextInput[]>([]);
  const scales = useRef(codes.map(() => useSharedValue(1))).current;
  const opacities = useRef(codes.map(() => useSharedValue(0.3))).current;

  const { verifyEmailOTP, resendEmailOTP } = useEmbeddedAuth();
  const {
    actions: { waitForAuthentication },
  } = useFlowManager();

  const handleOnError = useCallback(
    async (error: Error) => {
      errorState.setOn();
      console.error(error);
      onError(error, 'verifyEmail');
      setValues(defaultCodeArray);
      defaultCodeArray.forEach((_, index) => {
        opacities[index].value = withTiming(0.3, { duration: 120 });
      });
    },
    [onError],
  );

  const handleVerifyEmailOTP = useCallback(
    async (code?: string) => {
      try {
        errorState.setOff();
        loadingState.setOn();
        Keyboard.dismiss();
        const codeToVerify = code || codes.join('');
        const waitFor = waitForAuthentication();
        await verifyEmailOTP(codeToVerify);
        console.log('otp verified');
        const ownerAddress = await waitFor;
        onAuthenticate(ownerAddress);
      } catch (error) {
        console.log('USER CANCELED VerifyEmailOTP ');
        handleOnError(error);
        loadingState.setOff();
      }
    },
    [verifyEmailOTP, onAuthenticate, codes, onError],
  );

  const focusIndex = (index: number) => {
    inputsRef.current[index]?.focus();
  };

  const onCompleteCode = useCallback(() => {
    Keyboard.dismiss();
    inputsRef.current.forEach((input) => input?.blur());
  }, []);

  const handleChange = useCallback((text: string, index: number) => {
    let digits = text.replace(/[^0-9]/g, '').split('');
    if (digits.length === 0) return;
    setValues((values) => {
      const newValues = [...values];
      let nextIndex = index;
      // copy and paste case or multiple digits input
      const currentValue = newValues[nextIndex];
      if (currentValue && text.startsWith(currentValue)) {
        digits = digits.slice(1);
      }

      digits.forEach((decimal) => {
        if (nextIndex < OTP_CODE_LENGTH) {
          newValues[nextIndex] = decimal;
          scales[nextIndex].value = withTiming(1.1, { duration: 100 }, () => {
            scales[nextIndex].value = withTiming(1, { duration: 100 });
          });
          opacities[nextIndex].value = withTiming(1, { duration: 150 });
        }
        nextIndex++;
      });

      if (nextIndex < OTP_CODE_LENGTH) {
        focusIndex(nextIndex);
      } else if (digits.length === OTP_CODE_LENGTH) {
        onCompleteCode();
      }

      return newValues;
    });
  }, []);

  const handleKeyPress = (
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (event.nativeEvent.key === 'Backspace') {
      setValues((prevCodes) => {
        const newCodes = [...prevCodes];
        if (index > 0 && !prevCodes[index]) {
          const indexToFocus = index - 1;
          newCodes[indexToFocus] = '';
          opacities[indexToFocus].value = withTiming(0.3, { duration: 120 });
        }
        newCodes[index] = '';
        return newCodes;
      });

      opacities[index].value = withTiming(0.3, { duration: 120 });

      if (index > 0) focusIndex(index - 1);
    }
  };

  const renderInput = (value: string, index: number) => {
    const animatedStyle = useAnimatedStyle(() => {
      const scale = scales[index].value;
      const opacity = opacities[index].value;
      const borderColor = interpolateColor(
        opacity,
        [0.3, 1],
        ['#D2D2D2', '#8D8D8D'],
      ) as string;

      return {
        transform: [{ scale }],
        opacity,
        borderColor,
      };
    });
    const maxLength = OTP_CODE_LENGTH - index + value.length;
    return (
      <Animated.View key={index} style={[styles.box, animatedStyle]}>
        <BottomSheetTextInput
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          selection={{ start: 1, end: 1 }}
          style={[styles.input, loadingState.state && styles.inputDisabled]}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          maxLength={maxLength}
          value={value}
          onChangeText={(code) => handleChange(code, index)}
          onKeyPress={(event) => handleKeyPress(event, index)}
          textAlign="center"
          returnKeyType="done"
          editable={!loadingState.state}
        />
      </Animated.View>
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputsRef.current[0]) {
        focusIndex(0);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Container>
      <Container gap={8} marginBottom={8}>
        <Text size="large" textAlign="center">
          Insert 6-digit code
        </Text>
        <View>
          <Text textAlign="center">Check {params?.email} for</Text>
          <Text textAlign="center">the code</Text>
        </View>
      </Container>
      <Container gap={12} marginVertical={16}>
        <View style={styles.containerInput}>{codes.map(renderInput)}</View>
        <Button
          variant="primary"
          text="Verify"
          loading={loadingState.state}
          onPress={() => handleVerifyEmailOTP()}
          disabled={codes.some((code) => code === '')}
        />
        <Container isVisible={errorState.state}>
          <Card style={styles.errorCard}>
            <Icon
              style={{ top: 5 }}
              name="closeCircle"
              size={20}
              color="#F52109"
            />
            <View style={styles.textWrapper}>
              <Text fontWeight="bold">
                Invalid code. Please check your email and try again.
              </Text>
            </View>
          </Card>
        </Container>
      </Container>
      <Container gap={24} marginVertical={16}>
        <Text color="#8D8D8D" textAlign="center">
          Did not receive a code? Check spam or
        </Text>
        <Button
          variant="secondary"
          text="Resend link"
          onPress={resendEmailOTP}
        />
      </Container>
    </Container>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#fff',
  },
  input: {
    fontSize: 15,
    width: '100%',
    height: '100%',
    textAlign: 'center',
    color: '#2A2A2A',
  },
  inputDisabled: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  errorCard: {
    flex: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 8,
  },
  textWrapper: {
    flex: 1,
    flexShrink: 1,
  },
});
