import { StyleSheet } from 'react-native';
import { useTranslation } from '../../../../i18n';
import { Card, Container, Text } from '../../../../ui';
import { StepContainer } from '../../../components/step-container';
import { useNavigationParams } from '../../../navigation';
import type { TransactionParams } from '../../../types';

export const TransactionDetailsStep: React.FC = () => {
  const { t } = useTranslation();
  const params = useNavigationParams<TransactionParams>();

  return (
    <StepContainer style={styles.container}>
      <Container isVisible={Boolean(params?.rawTransaction)}>
        <Card style={{ padding: 16 }}>
          <Text overflow="hidden" flexWrap="wrap">
            {params?.rawTransaction}
          </Text>
        </Card>
      </Container>
      <Container
        isVisible={Boolean(params?.feeDetails)}
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        gap={8}
        marginBottom={24}
      >
        <Container gap={12}>
          <Text fontWeight="bold">{t('transactionStep.networkFee')}</Text>
          <Text fontWeight="bold">{t('transactionStep.usdFee')}</Text>
        </Container>
        <Container gap={12}>
          <Text textAlign="right">
            {t('transactionStep.amountNetwork', {
              amount: params?.feeDetails?.networkFee ?? '0',
            })}
          </Text>
          <Text textAlign="right">
            {t('transactionStep.amountUsd', {
              amount: params?.feeDetails?.usdFee ?? '0',
            })}
          </Text>
        </Container>
      </Container>
    </StepContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
});
