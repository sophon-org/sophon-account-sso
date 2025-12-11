import { Text } from '../../../../ui';

interface Props {
  details?: {
    name?: string;
    address?: string | `0x${string}`;
    recipient?: string | `0x${string}`;
  };
  onPress: (address?: string | `0x${string}`) => void;
  isLink?: boolean;
}

export function AddressLink({ details, onPress, isLink }: Props) {
  return (
    <Text lineHeight={24}>
      {details?.name}
      {' @ '}
      <Text
        textDecorationLine={isLink ? 'underline' : undefined}
        disabled={!isLink}
        onPress={() => onPress(details?.recipient)}
      >
        {details?.address}
        {isLink ? '\u2197' : null}
      </Text>
    </Text>
  );
}
