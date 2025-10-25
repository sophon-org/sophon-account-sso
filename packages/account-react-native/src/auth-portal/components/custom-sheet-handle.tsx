import { Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '../../ui/icon';

interface AuthPortalHandleProps {
  showBackButton?: boolean;
  hideCloseButton?: boolean;
  title?: string;
  goBack?: () => void;
  close?: () => void;
}

export function AuthPortalBottomSheetHandle({
  showBackButton,
  hideCloseButton,
  title,
  goBack,
  close,
}: AuthPortalHandleProps) {
  return (
    <View>
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
            <Icon name="back" size={24} />
          </TouchableOpacity>
        ) : null}
        <Text style={{ fontWeight: '700', fontSize: 18, lineHeight: 24 }}>
          {title ?? ''}
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
    </View>
  );
}
