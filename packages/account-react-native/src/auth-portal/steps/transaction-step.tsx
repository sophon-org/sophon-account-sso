import { StyleSheet, View } from 'react-native';
import { useTranslation } from '../../i18n';
import { Text } from '../../ui';
import type { BasicStepProps } from '../types';

export const TransactionStep: React.FC<BasicStepProps> = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text>{t('transactionStep.placeholder')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
});
