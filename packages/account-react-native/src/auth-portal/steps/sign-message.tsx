import { StyleSheet } from 'react-native';
import { useTranslation } from '../../i18n';
import { Text } from '../../ui';
import { StepContainer } from '../components/step-container';
import type { BasicStepProps } from '../types';

export const SignMessageStep: React.FC<BasicStepProps> = () => {
  const { t } = useTranslation();
  return (
    <StepContainer style={styles.container}>
      <Text>{t('signMessageStep.placeholder')}</Text>
    </StepContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
});
