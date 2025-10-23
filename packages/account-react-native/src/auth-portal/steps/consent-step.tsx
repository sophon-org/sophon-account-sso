import { useCallback, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { useBooleanState, useFlowManager } from '../../hooks';
import { Button, Container, PermissionCollapse, Switch, Text } from '../../ui';
import type { BasicStepProps } from '../types';

export const ConsentStep: React.FC<BasicStepProps> = ({
  onComplete,
  onError,
}) => {
  const isLoadingState = useBooleanState(false);
  const {
    actions: { consent },
  } = useFlowManager();

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
  ]);

  const handleOnPressEmail = useCallback(() => {
    Linking.openURL('mailto:data@sophon.xyz');
  }, []);

  const handleOnPressPrivacyPolicy = useCallback(() => {
    Linking.openURL('https://sophon.xyz/privacypolicy');
  }, []);

  return (
    <Container>
      <Container marginBottom={16}>
        <Text textAlign="center">
          We would like your permission to use your data for the following
          purposes.
        </Text>
      </Container>
      <Container gap={8} marginVertical={24}>
        <PermissionCollapse
          name="PERSONALIZATION_ADS"
          label="Personalization & Ads:"
          description="Using your data to personalize your experience, including showing you relevant ads."
          allowed={consents.PERSONALIZATION_ADS}
          onChangePermission={handleOnChangePermission}
        />
        <PermissionCollapse
          name="SHARING_DATA"
          label="Sharing your data:"
          description="Sharing your data or zkTLS proofs related to such data with our data partners so they can deliver personalized ads, experiences and recommendations."
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
          Select all
        </Text>
        <Switch value={isSelectAll} onValueChange={handleOnToggleSelectAll} />
      </Container>
      <Container marginTop={24}>
        <Text textAlign="center" size="small" color="#8D8D8D">
          You can withdraw your consent at any time by sending us an email at{' '}
          <Text
            color="#0066FF"
            size="small"
            selectable={false}
            onPress={handleOnPressEmail}
          >
            data@sophon.xyz
          </Text>
          . Withdrawal will stop any future use of your data for these purposes,
          but it will not affect processing already carried out while your
          consent was active. Please refer to our{' '}
          <Text
            color="#0066FF"
            size="small"
            selectable={false}
            onPress={handleOnPressPrivacyPolicy}
          >
            Privacy Policy
          </Text>{' '}
          to find out how we process and protect your data and how you can
          exercise your rights.
        </Text>
      </Container>
      <Container marginVertical={16}>
        <Button
          variant="primary"
          text="Confirm"
          disabled={!areAllConsentsSelected}
          onPress={handleConsentAll}
          loading={isLoadingState.state}
        />
      </Container>
    </Container>
  );
};
