import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
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
import { Button } from '../../components/button';
import { OTP_CODE_LENGTH } from '../../constants/verify-otp';
import { useBooleanState, useFlowManager } from '../../hooks';
import { useNavigationParams } from '../hooks';
import type { BasicStepProps, VerifyCodeParams } from '../types';

export function VerifyEmailStep({ onAuthenticate, onError }: BasicStepProps) {
  const loadingState = useBooleanState(false);
  const params = useNavigationParams<VerifyCodeParams>();
  const [codes, setValues] = useState(Array(OTP_CODE_LENGTH).fill(''));
  const inputsRef = useRef<TextInput[]>([]);
  const scales = useRef(codes.map(() => useSharedValue(1))).current;
  const opacities = useRef(codes.map(() => useSharedValue(0.3))).current;

  const { verifyEmailOTP, resendEmailOTP } = useEmbeddedAuth();
  const {
    actions: { waitForAuthentication },
  } = useFlowManager();

  const handleVerifyEmailOTP = useCallback(
    async (code?: string) => {
      try {
        loadingState.setOn();
        Keyboard.dismiss();
        const codeToVerify = code || codes.join('');
        const waitFor = waitForAuthentication();
        await verifyEmailOTP(codeToVerify);
        console.log('otp verified');
        const ownerAddress = await waitFor;
        onAuthenticate(ownerAddress);
      } catch (error) {
        console.log('USER CANCELED');
        console.error(error);
        await onError(error as Error);
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
    focusIndex(0);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Insert 6-digit code</Text>
        <View>
          <Text style={styles.text}>Check {params?.email} for</Text>
          <Text style={styles.text}>the code</Text>
        </View>
      </View>
      <View style={styles.containerInput}>{codes.map(renderInput)}</View>
      <Button
        variant="primary"
        text="Verify"
        loading={loadingState.state}
        onPress={() => handleVerifyEmailOTP()}
        disabled={codes.some((code) => code === '')}
      />
      <Text style={[styles.text, { color: '#8D8D8D' }]}>
        Did not receive a code? Check spam or
      </Text>
      <Button variant="secondary" text="Resend link" onPress={resendEmailOTP} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#2A2A2A',
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    color: '#2A2A2A',
    textAlign: 'center',
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  containerInput: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
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
});
