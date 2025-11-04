import { Button } from 'react-native';
import { useSophonAccount } from '../hooks';

export const ConnectButton = () => {
  const { connect, isConnecting } = useSophonAccount();
  const handleAuthenticate = async () => {
    try {
      await connect();
    } catch (error) {
      console.log('error', error);
    }
  };
  return (
    <Button
      onPress={async () => {
        await handleAuthenticate();
      }}
      title={isConnecting ? 'Connecting...' : 'Connect'}
    />
  );
};
