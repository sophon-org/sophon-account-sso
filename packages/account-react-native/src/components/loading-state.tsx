import { type StyleProp, Text, View, type ViewStyle } from 'react-native';

export const LoadingState = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text>Loading...</Text>
    </View>
  );
};
