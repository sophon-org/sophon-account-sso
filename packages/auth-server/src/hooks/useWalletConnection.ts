"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export const useWalletConnection = () => {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const connectWallet = async () => {
    const metaMaskConnector = connectors.find(
      (connector) => connector.id === "metaMaskSDK"
    );
    if (metaMaskConnector) {
      console.log("Found MetaMask connector, attempting to connect...");
      try {
        const result = await connect({ connector: metaMaskConnector });
        console.log("Connection result:", result);
      } catch (error) {
        console.error("Connection failed:", error);
      }
    } else {
      console.error("MetaMask connector not found!");
      console.log(
        "Available connector IDs:",
        connectors.map((c) => c.id)
      );
    }
  };

  return {
    address,
    isConnected,
    isConnecting,
    connectWallet,
    disconnect,
    error,
    isPending,
  };
};
