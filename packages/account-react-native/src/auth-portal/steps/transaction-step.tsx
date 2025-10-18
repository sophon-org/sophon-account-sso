import { StyleSheet, Text, View } from 'react-native';
import type { BasicStepProps } from '../types';

export const TransactionStep: React.FC<BasicStepProps> = () => {
  return (
    <View style={styles.container}>
      <Text>Transaction Placeholder.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
});
