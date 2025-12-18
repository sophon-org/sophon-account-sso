import type { SessionAction } from '@sophon-labs/account-core';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import type { Address } from 'viem';
import { useFlowManager } from '../../hooks';
import { Button, Container, Text } from '../../ui';
import { StepContainer } from '../components/step-container';
import type { BasicStepProps } from '../types';

export const SessionStep: React.FC<BasicStepProps> = ({ onComplete }) => {
  const {
    actions: { approveSession },
    currentRequest,
  } = useFlowManager();
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    if (!currentRequest) {
      throw new Error('No current request');
    }

    setIsApproving(true);

    const params = (
      currentRequest!.content as { action?: { params: unknown[] } }
    ).action?.params;
    const signer = params![0] as Address;
    const actions = params![1] as SessionAction[];

    console.log('Issuing session', signer, actions);
    await approveSession(signer, actions);
    await onComplete({ hide: true });
    setIsApproving(false);
  };

  return (
    <StepContainer style={styles.container}>
      <Container marginBottom={16}>
        <Text textAlign="center">Session Approval</Text>
      </Container>
      <Container gap={8} marginVertical={24}>
        <Text textAlign="justify">
          {JSON.stringify(currentRequest?.content, null, 2)}
        </Text>
      </Container>
      <Container gap={8} marginVertical={24}>
        <Button
          loading={isApproving}
          disabled={isApproving}
          onPress={handleApprove}
          variant="primary"
          text="Approve"
        />
      </Container>
    </StepContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
});
