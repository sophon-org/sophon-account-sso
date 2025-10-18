import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFlowManager } from '../../hooks/use-flow-manager';
import type { BasicStepProps } from '../types';

export const AuthorizationStep = ({ onComplete, onError }: BasicStepProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    actions: { authorize },
  } = useFlowManager();

  const handleAuthorize = useCallback(async () => {
    try {
      setIsLoading(true);
      await authorize();
      await onComplete({ hide: true });
    } catch (error) {
      console.error(error);
      onError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [onComplete, onError, authorize]);

  return (
    <View style={styles.container}>
      <Text>Authorize?</Text>
      <TouchableOpacity style={styles.button} onPress={handleAuthorize}>
        <Text style={styles.buttonText}>
          {isLoading ? 'Authorizing...' : 'Authorize'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#EAF1FF',
    borderRadius: 8,
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#0066FF',
    fontWeight: '600',
  },
});
