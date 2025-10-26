import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../../i18n';
import type { BasicStepProps } from '../types';

export const SignMessageStep: React.FC<BasicStepProps> = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text>{t('signMessageStep.placeholder')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
});
