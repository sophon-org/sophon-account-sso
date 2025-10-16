import { sendUIMessage } from "../messaging/ui";
// import { AuthProvider, useEmbeddedAuth } from "../auth/useAuth";
import { Button } from "react-native";

export const ConnectButton = () => {
  return (
    <Button
      onPress={() => {
        sendUIMessage("showModal", {});
      }}
      title="Connect"
    />
  );
};
