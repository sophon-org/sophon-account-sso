import {
  BottomSheetHandle,
  type BottomSheetHandleProps,
} from '@gorhom/bottom-sheet';
import { Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '../../components/icon';

interface AuthPortalHandleProps extends BottomSheetHandleProps {
  showBackButton: boolean;
  hideCloseButton?: boolean;
  goBack: () => void;
  close: () => void;
}

export function AuthPortalBottomSheetHandle({
  showBackButton,
  hideCloseButton,
  goBack,
  close,
  ...props
}: AuthPortalHandleProps) {
  return (
    <BottomSheetHandle {...props}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        {showBackButton ? (
          <TouchableOpacity
            style={{ position: 'absolute', left: 24 }}
            onPress={goBack}
            hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
          >
            <Text style={{ fontSize: 24, fontWeight: '600' }}>←</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={{ fontWeight: '700', fontSize: 18, lineHeight: 24 }}>
          Sign in
        </Text>
        {!hideCloseButton ? (
          <TouchableOpacity
            style={{ position: 'absolute', right: 24 }}
            onPress={close}
            hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
          >
            <Icon name="close" size={24} />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={{ height: 1, backgroundColor: '#eee' }} />
    </BottomSheetHandle>
  );
}
