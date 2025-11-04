import { StyleSheet, View } from 'react-native';
import { useTranslation } from '../../i18n';
import { Button, CardError, Container, Text } from '../../ui';
import { useNavigationParams } from '../hooks';
import type { BasicStepProps, RetryParams } from '../types';

export const RetryStep = ({
  onAuthenticate,
  onBackToSignIn,
}: BasicStepProps) => {
  const { t } = useTranslation();
  const { ownerAddress, provider, error } = useNavigationParams<RetryParams>();

  const handleOnRetry = () => {
    onAuthenticate(ownerAddress, { provider, from: 'retry' });
  };

  return (
    <Container>
      <Container marginBottom={16}>
        <Text size="large" textAlign="center">
          {t('retryStep.thatDidWork')}
        </Text>
        <Text textAlign="center">{t('retryStep.pleaseTryAgain')}</Text>
      </Container>
      <CardError
        isVisible={!!error}
        text={error?.message ?? ''}
        marginTop={12}
      />
      <View style={styles.buttons}>
        <Button
          containerStyle={styles.buttonWrapper}
          text={t('retryStep.backToSignIn')}
          variant="secondary"
          onPress={onBackToSignIn}
        />
        <Button
          containerStyle={styles.buttonWrapper}
          text={t('common.retry')}
          onPress={handleOnRetry}
        />
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    flex: 1,
  },
  buttons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
  },
});
