// import { AuthProvider, useEmbeddedAuth } from "../auth/useAuth";
import { Button } from 'react-native';
import { sendUIMessage } from '../messaging/ui';

export const ConnectButton = () => {
  return (
    <Button
      onPress={() => {
        sendUIMessage('showModal', {});
      }}
      title="Connect"
    />
  );
};
