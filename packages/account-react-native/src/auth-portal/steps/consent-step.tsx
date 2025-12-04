import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from 'expo-web-browser';
import { useCallback, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { useBooleanState, useFlowManager } from '../../hooks';
import { useTranslation } from '../../i18n';
import {
  Button,
  CardError,
  Container,
  PermissionCollapse,
  Switch,
  Text,
} from '../../ui';
import { StepContainer } from '../components/step-container';
import type { BaseAuthError, BasicStepProps } from '../types';

const DATA_SHARING_EMAIL = 'data@sophon.xyz';

export const ConsentStep: React.FC<BasicStepProps> = ({
  onComplete,
  onError,
}) => {
  const { t } = useTranslation();
  const isLoadingState = useBooleanState(false);
  const {
    actions: { consent },
  } = useFlowManager();
  const [error, setError] = useState<null | string>(null);
  const [consents, setConsents] = useState<{ [key: string]: boolean }>({
    PERSONALIZATION_ADS: false,
    SHARING_DATA: false,
  });

  const isSelectAll = useMemo(
    () => Object.values(consents).every((allowed) => allowed),
    [consents],
  );

  const handleOnChangePermission = useCallback(
    (allowed: boolean, name: string) => {
      setConsents((prev) => ({
        ...prev,
        [name]: allowed,
      }));
    },
    [],
  );

  const handleOnToggleSelectAll = useCallback((checked: boolean) => {
    setConsents((prev) => ({
      ...Object.keys(prev).reduce(
        (acc, key) => {
          acc[key] = checked;
          return acc;
        },
        {} as { [key: string]: boolean },
      ),
    }));
  }, []);

  const areAllConsentsSelected = useMemo(() => {
    return Object.values(consents).every((allowed) => !!allowed);
  }, [consents]);

  const handleConsentAll = useCallback(async () => {
    try {
      if (!areAllConsentsSelected) {
        throw new Error('Please select all consents');
      }
      isLoadingState.setOn();
      const kinds = Object.entries(consents)
        .map(([key, allowed]) => (allowed ? key : null))
        .filter(Boolean) as string[];
      await consent(kinds);
      await onComplete({ hide: true });
    } catch (error) {
      console.error(error);
      setError(
        (error as BaseAuthError)?.shortMessage ?? t('common.genericError'),
      );
      onError(error as Error);
      isLoadingState.setOff();
    }
  }, [
    onComplete,
    onError,
    consents,
    isLoadingState,
    consent,
    areAllConsentsSelected,
    t,
  ]);

  const handleOnPressEmail = useCallback(() => {
    Linking.openURL(`mailto:${DATA_SHARING_EMAIL}`);
  }, []);

  const handleOnPressPrivacyPolicy = useCallback(() => {
    openBrowserAsync('https://sophon.xyz/privacypolicy', {
      presentationStyle: WebBrowserPresentationStyle.PAGE_SHEET,
    });
  }, []);

  return (
    <StepContainer>
      <Container marginBottom={16}>
        <Text textAlign="center">{t('consentStep.title')}</Text>
      </Container>
      <Container gap={8} marginVertical={24}>
        <PermissionCollapse
          name="PERSONALIZATION_ADS"
          label={t('consentStep.personalization.label')}
          description={t('consentStep.personalization.description')}
          allowed={consents.PERSONALIZATION_ADS}
          onChangePermission={handleOnChangePermission}
        />
        <PermissionCollapse
          name="SHARING_DATA"
          label={t('consentStep.sharingData.label')}
          description={t('consentStep.sharingData.description')}
          allowed={consents.SHARING_DATA}
          onChangePermission={handleOnChangePermission}
        />
      </Container>
      <Container
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        gap={8}
      >
        <Text textAlign="center" fontWeight="700">
          {t('consentStep.selectAll')}
        </Text>
        <Switch value={isSelectAll} onValueChange={handleOnToggleSelectAll} />
      </Container>
      <Container marginTop={24}>
        <Text textAlign="center" size="small" color="#8D8D8D">
          {t('consentStep.withdrawalInfoPart1')}{' '}
          <Text
            color="#0066FF"
            size="small"
            selectable={false}
            onPress={handleOnPressEmail}
          >
            {DATA_SHARING_EMAIL}
          </Text>
          {t('consentStep.withdrawalInfoPart2')}{' '}
          <Text
            color="#0066FF"
            size="small"
            selectable={false}
            onPress={handleOnPressPrivacyPolicy}
          >
            {t('common.privacyPolicy')}
          </Text>{' '}
          {t('consentStep.withdrawalInfoPart3')}
        </Text>
      </Container>
      <CardError isVisible={!!error} text={error ?? ''} marginVertical={8} />
      <Container marginVertical={16}>
        <Button
          variant="primary"
          text={t('common.confirm')}
          disabled={!areAllConsentsSelected}
          onPress={handleConsentAll}
          loading={isLoadingState.state}
        />
      </Container>
    </StepContainer>
  );
};
