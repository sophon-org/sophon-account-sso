import React, { type PropsWithChildren, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
  type?: 'error' | 'success';
  message: string | null | undefined;
  onPressClear: () => void;
}

export function CardAction({
  message,
  onPressClear,
  type,
}: PropsWithChildren<Props>) {
  const color = useMemo(() => {
    if (type === 'error') {
      return {
        container: 'bg-red-500/5 p-2 border border-red-500/50',
        text: 'my-2 text-red-500',
      };
    }
    return {
      container: 'bg-green-500/5 p-2 border border-green-500/50',
      text: 'my-2 text-green-500',
    };
  }, [type]);
  if (!message) return null;

  return (
    <View className={color.container}>
      <Text className={color.text}>{message}</Text>
      <TouchableOpacity onPress={onPressClear}>
        <Text className="text-black-500 text-center underline mb-1">
          Dismiss
        </Text>
      </TouchableOpacity>
    </View>
  );
}
