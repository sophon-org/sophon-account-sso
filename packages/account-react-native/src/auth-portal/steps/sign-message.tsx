import { StyleSheet, Text, View } from 'react-native';
import type { BasicStepProps } from '../types';

export const SignMessageStep: React.FC<BasicStepProps> = () => {
  return (
    <View style={styles.container}>
      <Text>Sign Message Placeholder.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
});
