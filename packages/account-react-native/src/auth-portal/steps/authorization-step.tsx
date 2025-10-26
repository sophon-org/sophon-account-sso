import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useBooleanState, useFlowManager, useSophonAccount } from '../../hooks';
import { useTranslation } from '../../i18n';
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
  const { t } = useTranslation();
  const isLoadingState = useBooleanState(false);
  const {
    actions: { authorize },
  } = useFlowManager();
  const { logout } = useSophonAccount();
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
  }, [onComplete, onError, authorize, isLoadingState, selectedScopes]);

  const handleCancel = useCallback(async () => {
    await Promise.all([logout(), onCancel()]);
  }, [logout, onCancel]);

  return (
    <Container>
      <Container style={styles.content}>
        <Text size="large" textAlign="center">
          {t('authorizationStep.connectWith', {
            partnerName: partner?.name ?? 'Sophon',
          })}
        </Text>
        <Container isVisible={!!partner?.domains.length}>
          <Text textAlign="center">{partner?.domains[0]}</Text>
        </Container>
      </Container>
      <Card style={styles.contentCard}>
        <Container style={styles.cardSection} marginBottom={16}>
          <Text fontWeight="bold">{t('authorizationStep.can')}</Text>
          <CheckBox
            defaultChecked
            locked
            label={t('authorizationStep.seeYourAddress')}
          />
          <CheckBox
            defaultChecked
            locked
            label={t('authorizationStep.askForTransactionApproval')}
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
          <Text fontWeight="bold">{t('authorizationStep.cant')}</Text>
          <CheckBox
            unavailable
            label={t('authorizationStep.performActionsOnYourBehalf')}
          />
        </Container>
      </Card>
      <View style={styles.buttons}>
        <Button
          containerStyle={styles.buttonWrapper}
          text={t('common.cancel')}
          variant="secondary"
          onPress={handleCancel}
          disabled={isLoadingState.state}
        />
        <Button
          containerStyle={styles.buttonWrapper}
          text={t('common.connect')}
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
