import { useCallback } from 'react';
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
  partner,
}: BasicStepProps) => {
  const isLoadingState = useBooleanState(false);
  const {
    actions: { authorize },
  } = useFlowManager();

  const handleAuthorize = useCallback(async () => {
    try {
      isLoadingState.setOn();
      await authorize();
      await onComplete({ hide: true });
    } catch (error) {
      console.error(error);
      onError(error as Error);
    } finally {
      isLoadingState.setOff();
    }
  }, [onComplete, onError, authorize]);

  return (
    <View style={styles.container}>
      <Container style={styles.content}>
        <Text size="large" textAlign="center">
          Connect to {partner?.name ?? 'Sophon'}
        </Text>
        {!!partner?.domains.length && (
          <Text textAlign="center">{partner?.domains[0]}</Text>
        )}
      </Container>
      <Card style={styles.contentCard}>
        <View style={styles.cardSection}>
          <Text fontWeight="bold">It can</Text>
          <CheckBox
            checked
            label="See your address / identity, balance and activity"
          />
          <CheckBox checked label="Ask for transactions to be approved" />
          {scopes?.map((scope) => (
            <CheckBox
              key={scope}
              label={`See your ${sentenceCase(scope)} account`}
            />
          ))}
        </View>
        <View style={styles.cardSection}>
          <Text fontWeight="bold">It can’t</Text>
          <CheckBox
            blocked={true}
            label="Perform actions or transfer funds on your behalf"
          />
        </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    gap: 16,
  },
  buttonWrapper: {
    flex: 1,
  },
  buttons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  content: {
    gap: 8,
    marginBottom: 16,
  },
  contentCard: {
    gap: 24,
  },
  cardSection: {
    gap: 12,
  },
});
