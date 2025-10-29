import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import type { BottomSheetTextInputProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetTextInput';
import React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { useAdaptiveBottomSheetMode } from '../context/adaptive-bottom-sheet.context';

export const AdaptiveTextInput = React.forwardRef<
  TextInput,
  TextInputProps | BottomSheetTextInputProps
>((props, ref) => {
  const { mode } = useAdaptiveBottomSheetMode();

  if (mode === 'modal') {
    return <TextInput ref={ref} {...props} />;
  }

  return (
    <BottomSheetTextInput
      ref={(_ref) => {
        if (typeof ref === 'function') {
          ref(_ref as TextInput);
        } else if (ref) {
          ref.current = _ref as TextInput;
        }
      }}
      {...props}
    />
  );
});
AdaptiveTextInput.displayName = 'BottomSheetTextInput';
