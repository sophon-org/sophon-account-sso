import { TouchableOpacity, View, type ViewStyle } from 'react-native';
import { Icon, Text } from '../../ui';
import { useThemeColors } from '../../ui/theme-provider';

interface AuthPortalHandleProps {
  showBackButton?: boolean;
  hideCloseButton?: boolean;
  title?: string;
  goBack?: () => void;
  close?: () => void;
  style?: ViewStyle;
}

export function AuthPortalBottomSheetHandle({
  showBackButton,
  hideCloseButton,
  title,
  goBack,
  close,
  style,
}: AuthPortalHandleProps) {
  const colors = useThemeColors();
  return (
    <View style={[{ backgroundColor: colors.background.primary }, style]}>
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
            <Icon name="back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        ) : null}
        <Text
          color={colors.text.primary}
          style={{ fontWeight: '700', fontSize: 18, lineHeight: 24 }}
        >
          {title ?? ''}
        </Text>
        {!hideCloseButton ? (
          <TouchableOpacity
            style={{ position: 'absolute', right: 24 }}
            onPress={close}
            hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
          >
            <Icon name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={{ height: 1, backgroundColor: colors.gray[700] }} />
    </View>
  );
}
