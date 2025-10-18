import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { type AuthProvider, useEmbeddedAuth } from "../../auth/useAuth";
import { AVAILABLE_PROVIDERS } from "../../constants";
import { useFlowManager } from "../../hooks/use-flow-manager";
import type { BasicStepProps, SignInParams } from "../types";
import { validateEmail } from "../../utils/validations";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Icon, Button } from "../../components";
import { useAuthPortal, useNavigationParams } from "../hooks/useAuthPortal";

export const SignInStep = ({ onComplete, onError }: BasicStepProps) => {
  const params = useNavigationParams<SignInParams>();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(params?.email || "");
  const { navigate } = useAuthPortal();
  const { signInWithSocialProvider, signInWithEmail } = useEmbeddedAuth();
  const {
    actions: { waitForAuthentication, authenticate },
  } = useFlowManager();

  const handleSocialProviderPress = useCallback(
    async (provider: AuthProvider) => {
      try {
        const waitFor = waitForAuthentication();
        await signInWithSocialProvider(provider);
        const ownerAddress = await waitFor;
        await authenticate(ownerAddress);
        console.log("ownerAddress", ownerAddress);
        await onComplete({ hide: false });
      } catch (error) {
        console.log("USER CANCELED");
        console.error(error);
        await onError(error as Error);
      }
    },
    [signInWithSocialProvider, onComplete, onError],
  );

  const handleSignInWithEmail = useCallback(async () => {
    try {
      setLoading(true);
      const waitFor = waitForAuthentication();
      await signInWithEmail(email);
      navigate("verifyCode", { params: { email }, inheritParamsFrom: ["signIn"] });
      // await verifyEmailOTP("474617"); // this should be separated, but for testing we have static otp for this user
      // const ownerAddress = await waitFor;
      // console.log("ownerAddress", ownerAddress);
      // await authenticate(ownerAddress);
      // await onComplete({ hide: false });
    } catch (error) {
      console.log("USER CANCELED");
      console.error(error);
      await onError(error as Error);
    } finally {
      setLoading(false);
    }
  }, [signInWithEmail, onComplete, onError, email]);

  const handleChangeText = useCallback((text: string) => {
    setEmail(text);
  }, []);

  const isEmailValid = useMemo(() => validateEmail(email), [email]);

  return (
    <View style={[styles.container]}>
      <View style={styles.socialRow}>
        {AVAILABLE_PROVIDERS.map((scope) => (
          <TouchableOpacity
            key={scope}
            style={styles.socialButton}
            onPress={() => handleSocialProviderPress(scope as AuthProvider)}
          >
            <Icon name={scope} size={24} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.emailSection}>
        <BottomSheetTextInput
          onChangeText={handleChangeText}
          value={email}
          placeholder="Enter email"
          placeholderTextColor="#999"
          style={styles.input}
          onSubmitEditing={handleSignInWithEmail}
        />

        <Button
          text="Sign in with Wallet"
          disabled={!isEmailValid}
          onPress={handleSignInWithEmail}
          loading={loading}
        />
      </View>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>Alternatively</Text>
        <View style={styles.divider} />
      </View>

      <Button variant="secondary" text="Sign in with Wallet" onPress={() => navigate("loading")} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 16,
  },
  socialButton: {
    width: 56,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F6F7F9",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#EBEBEB",
    borderWidth: 1,
  },
  emailSection: {
    marginVertical: 16,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  button: {
    borderRadius: 12,
    height: 48,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  signInButton: {
    backgroundColor: "#0A7CFF",
  },
  signInText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#ffffff",
    fontWeight: "500",
  },
  signInButtonDisabled: {
    backgroundColor: "#F0F0F0",
  },
  signInTextDisabled: {
    color: "#D2D2D2",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#EEE",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#999",
  },
  walletButton: {
    backgroundColor: "#EAF1FF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 16,
  },
  walletText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#0066FF",
    fontWeight: "600",
  },
});
