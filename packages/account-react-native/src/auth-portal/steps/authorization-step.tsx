import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useBooleanState, useFlowManager } from '../../hooks';
import { Button, Card, CheckBox, Container, Text } from '../../ui';
import { sentenceCase } from '../../utils/string-utils';
import type { BasicStepProps } from '../types';

export const AuthorizationStep = ({
  onComplete,
  onError,
  onCancel,
  scopes,
}: BasicStepProps) => {
  const isLoadingState = useBooleanState(false);
  const {
    actions: { authorize },
  } = useFlowManager();
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  const handleOnSelectScope = useCallback(
    (scope: string, isSelected: boolean) => {
      setSelectedScopes((prev) => {
        if (isSelected) {
          return prev.includes(scope) ? prev : [...prev, scope];
        } else {
          return prev.filter((s) => s !== scope);
        }
      });
    },
    [],
  );

  const handleAuthorize = useCallback(async () => {
    try {
      isLoadingState.setOn();
      await authorize(selectedScopes);
      await onComplete({ hide: true });
    } catch (error) {
      console.error(error);
      onError(error as Error);
    } finally {
      isLoadingState.setOff();
    }
  }, [onComplete, onError, authorize]);

  return (
    <Container>
      <Container style={styles.content}>
        <Text size="large" textAlign="center">
          Connect to SyncSwap
        </Text>
        <Text textAlign="center">https://syncswap.xyz/</Text>
      </Container>
      <Card style={styles.contentCard}>
        <Container style={styles.cardSection} marginBottom={16}>
          <Text fontWeight="bold">It can</Text>
          <CheckBox
            defaultChecked
            locked
            label="See your address / identity, balance and activity"
          />
          <CheckBox
            defaultChecked
            locked
            label="Ask for transactions to be approved"
          />
          {scopes?.map((scope) => (
            <CheckBox
              key={scope}
              label={`See your ${sentenceCase(scope)} account`}
              onChange={(checked) => handleOnSelectScope(scope, checked)}
            />
          ))}
        </Container>
        <Container style={styles.cardSection}>
          <Text fontWeight="bold">It can’t</Text>
          <CheckBox
            unavailable
            label="Perform actions or transfer funds on your behalf"
          />
        </Container>
      </Card>
      <View style={styles.buttons}>
        <Button
          containerStyle={styles.buttonWrapper}
          text="Cancel"
          variant="secondary"
          onPress={onCancel}
          disabled={isLoadingState.state}
        />
        <Button
          containerStyle={styles.buttonWrapper}
          text="Connect"
          onPress={handleAuthorize}
          loading={isLoadingState.state}
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
  content: {
    gap: 8,
    marginBottom: 16,
  },
  contentCard: {
    gap: 24,
    padding: 24,
    marginVertical: 16,
  },
  cardSection: {
    gap: 12,
  },
});
