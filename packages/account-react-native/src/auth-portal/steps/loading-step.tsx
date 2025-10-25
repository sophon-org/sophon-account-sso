import { Image, StyleSheet, View } from 'react-native';
import { Container, Icon } from '../../ui';
import { AuthenticatingSpinner } from '../components/authenticating-spinner';
import { useNavigationParams } from '../hooks';
import type { LoadingParams } from '../types';

export const LoadingStep = () => {
  const { provider } = useNavigationParams<LoadingParams>();

  return (
    <View style={[styles.container]}>
      <AuthenticatingSpinner isAuthenticating>
        {provider ? (
          <Container
            justifyContent="center"
            alignItems="center"
            width={44}
            height={44}
          >
            <Icon name={provider} size={32} color="#3377FF" />
          </Container>
        ) : (
          <Image
            source={require('../../assets/images/mailbox.png')}
            style={styles.image}
          />
        )}
      </AuthenticatingSpinner>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
    height: 122,
    alignItems: 'center',
  },
  image: { width: 44, height: 44 },
});
