import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { useFlowManager, useBooleanState } from "../../hooks";
import type { BasicStepProps } from "../types";
import { Button, Container, Text, PermissionCollapse, Switch } from "../../ui";

const MOCK_CONSENTS = [
  {
    name: "purpose1",
    label: "Personalization & Ads:",
    description:
      "Use the data you provide and import to build a profile linked to your Sophon Account, customize your experience, provide relevant ads and provide potential rewards without sharing your data with third parties.",
  },
  {
    name: "purpose2",
    label: "Analytics & Improvements:",
    description:
      "Use the data you provide and import to analyze user behavior, improve our services, and develop new features without sharing your data with third parties.",
  },
];

export const ConsentStep: React.FC<BasicStepProps> = ({ onComplete, onError }) => {
  const isLoadingState = useBooleanState(false);
  const {
    actions: { consent },
  } = useFlowManager();

  const [consents, setConsents] = useState<{ [key: string]: boolean }>(
    MOCK_CONSENTS.reduce(
      (acc, curr) => {
        acc[curr.name] = false;
        return acc;
      },
      {} as { [key: string]: boolean },
    ),
  );

  const isSelectAll = useMemo(
    () => Object.values(consents).every((allowed) => allowed),
    [consents],
  );

  const handleOnChangePermission = useCallback((allowed: boolean, name: string) => {
    setConsents((prev) => ({
      ...prev,
      [name]: allowed,
    }));
  }, []);

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

  const handleConsentAll = useCallback(async () => {
    try {
      isLoadingState.setOn();
      await consent();
      await onComplete({ hide: true });
    } catch (error) {
      console.error(error);
      onError(error as Error);
      isLoadingState.setOff();
    }
  }, [onComplete, onError]);

  return (
    <Container>
      <Container marginBottom={16}>
        <Text textAlign="center">
          We would like your permission to use your data for the following purposes.
        </Text>
      </Container>
      <Container gap={8} marginVertical={24}>
        {MOCK_CONSENTS.map((consent) => (
          <PermissionCollapse
            key={consent.name}
            name={consent.name}
            allowed={consents?.[consent.name]}
            label={consent.label}
            description={consent.description}
            onChangePermission={handleOnChangePermission}
          />
        ))}
      </Container>
      <Container flexDirection="row" justifyContent="center" alignItems="center" gap={8}>
        <Text textAlign="center" fontWeight="700">
          Select all
        </Text>
        <Switch value={isSelectAll} onValueChange={handleOnToggleSelectAll} />
      </Container>
      <Container marginTop={24}>
        <Text textAlign="center" size="small" color="#8D8D8D">
          You can withdraw your consent at any time by sending us an email at data@sophon.xyz.
          Withdrawal will stop any future use of your data for these purposes, but it will not
          affect processing already carried out while your consent was active. Please refer to our
          Privacy Policy to find out how we process and protect your data and how you can exercise
          your rights.
        </Text>
      </Container>
      <Container marginVertical={16}>
        <Button
          variant="primary"
          text="Confirm"
          onPress={handleConsentAll}
          loading={isLoadingState.state}
        />
      </Container>
    </Container>
  );
};

const styles = StyleSheet.create({
  walletButton: {
    backgroundColor: "#EAF1FF",
    borderRadius: 8,
    height: 44,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  walletText: {
    color: "#0066FF",
    fontWeight: "600",
  },
});
