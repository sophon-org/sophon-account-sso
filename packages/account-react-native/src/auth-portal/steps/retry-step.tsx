import { StyleSheet, View } from "react-native";
import { Button, Container, Text } from "../../ui";
import type { BasicStepProps, RetryParams } from "../types";
import { useNavigationParams } from "../hooks";

export const RetryStep = ({ onAuthenticate, onBackToSignIn }: BasicStepProps) => {
  const { ownerAddress } = useNavigationParams<RetryParams>();

  const handleOnRetry = () => {
    onAuthenticate(ownerAddress);
  };
  return (
    <Container>
      <Container marginBottom={16}>
        <Text size="large" textAlign="center">
          Oops! That didn't work.
        </Text>
        <Text textAlign="center">You can retry or check your details and try again.</Text>
      </Container>
      <View style={styles.buttons}>
        <Button
          containerStyle={styles.buttonWrapper}
          text="Back to sign in"
          variant="secondary"
          onPress={onBackToSignIn}
        />
        <Button containerStyle={styles.buttonWrapper} text="Retry" onPress={handleOnRetry} />
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    flex: 1,
  },
  buttons: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginVertical: 16,
  },
});
