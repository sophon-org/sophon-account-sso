import { AuthProvider, useEmbeddedAuth } from '../auth/useAuth';
import { Button } from 'react-native';

export const ConnectButton = () => {
  const { signInWithSocialProvider } = useEmbeddedAuth();
  return (
    <Button
      onPress={() => {
        signInWithSocialProvider(AuthProvider.APPLE);
      }}
      title="Connect with Apple"
    />
  );
};
