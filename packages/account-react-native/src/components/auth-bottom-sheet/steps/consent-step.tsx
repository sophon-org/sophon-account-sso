import { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFlowManager } from '../../../hooks/use-flow-manager';
import type { BasicStepProps } from '../types';

export const ConsentStep: React.FC<BasicStepProps> = ({
  onComplete,
  onError,
}) => {
  const {
    actions: { consent },
  } = useFlowManager();
  const handleConsentAll = useCallback(async () => {
    try {
      await consent();
      await onComplete({ hide: true });
    } catch (error) {
      console.error(error);
      onError(error as Error);
    }
  }, [onComplete, onError]);

  return (
    <View style={styles.container}>
      <Text>Consent Placeholder.</Text>
      <TouchableOpacity style={styles.walletButton} onPress={handleConsentAll}>
        {/* <WalletIcon size={22} color="#000" /> */}
        <Text style={styles.walletText}>Consent All</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  walletButton: {
    backgroundColor: '#EAF1FF',
    borderRadius: 8,
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  walletText: {
    color: '#0066FF',
    fontWeight: '600',
  },
});
