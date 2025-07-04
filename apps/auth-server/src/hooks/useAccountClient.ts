"use client";
import { useMemo } from "react";
import {
  type Address,
  createPublicClient,
  createWalletClient,
  http,
  publicActions,
  walletActions,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sophonTestnet, sophon } from "viem/chains";
import { eip712WalletActions } from "viem/zksync";
import {
  createZksyncPasskeyClient,
  type PasskeyRequiredContracts,
} from "zksync-sso/client/passkey";
import { createZksyncRecoveryGuardianClient } from "zksync-sso/client/recovery";
import { CHAIN_CONTRACTS, DEFAULT_CHAIN_ID } from "@/lib/constants";
import { useAccountContext } from "./useAccountContext";

// Extend Window interface for ethereum provider
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string }) => Promise<Address[]>;
    };
  }
}

// Supported chains for Sophon
export const supportedChains = [sophonTestnet, sophon];
export type SupportedChainId = (typeof supportedChains)[number]["id"];

// Block explorer URLs
export const blockExplorerUrlByChain: Record<SupportedChainId, string> = {
  [sophonTestnet.id]: "https://explorer.testnet.sophon.xyz",
  [sophon.id]: "https://explorer.sophon.xyz",
};

// Contract type definition
type ChainContracts = PasskeyRequiredContracts & {
  accountFactory: NonNullable<PasskeyRequiredContracts["accountFactory"]>;
  accountPaymaster: Address;
};

// Chain parameters
export const chainParameters: Record<SupportedChainId, { blockTime: number }> =
  {
    [sophonTestnet.id]: {
      blockTime: 12, // Sophon testnet block time
    },
    [sophon.id]: {
      blockTime: 12, // Sophon mainnet block time
    },
  };

export const useClientStore = () => {
  const { account } = useAccountContext();
  const { address, username, passkey } = account || {
    address: null,
    username: null,
    passkey: null,
  };

  const defaultChainId = DEFAULT_CHAIN_ID as SupportedChainId;
  const defaultChain = supportedChains.find(
    (chain) => chain.id === defaultChainId
  );

  if (!defaultChain) {
    throw new Error(
      `Default chain is set to ${defaultChainId}, but is missing from the supported chains list`
    );
  }

  // Convert our CHAIN_CONTRACTS to the expected format
  const contractsByChain: Record<SupportedChainId, ChainContracts> =
    useMemo(() => {
      const contracts: Record<SupportedChainId, ChainContracts> = {} as Record<
        SupportedChainId,
        ChainContracts
      >;

      for (const chainId of Object.keys(
        CHAIN_CONTRACTS
      ) as unknown as SupportedChainId[]) {
        const chainContracts = CHAIN_CONTRACTS[chainId];
        contracts[chainId] = {
          accountFactory: chainContracts.accountFactory as Address,
          passkey: chainContracts.passkey as Address,
          session: chainContracts.session as Address,
          recovery: chainContracts.recovery as Address,
          accountPaymaster: chainContracts.accountPaymaster as Address,
        };
      }

      return contracts;
    }, []);

  // Public client for reading blockchain data
  const getPublicClient = ({ chainId }: { chainId: SupportedChainId }) => {
    const chain = supportedChains.find((chain) => chain.id === chainId);
    if (!chain) throw new Error(`Chain with id ${chainId} is not supported`);

    const client = createPublicClient({
      chain,
      transport: http(),
    });

    return client;
  };

  // Main passkey client for transactions (requires logged in user)
  const getClient = ({ chainId }: { chainId: SupportedChainId }) => {
    if (!address)
      throw new Error("Address is not set - user must be logged in");
    if (!passkey)
      throw new Error("Passkey is not set - user must be logged in");
    if (!username)
      throw new Error("Username is not set - user must be logged in");

    const chain = supportedChains.find((chain) => chain.id === chainId);
    if (!chain) throw new Error(`Chain with id ${chainId} is not supported`);

    const contracts = contractsByChain[chainId];

    const client = createZksyncPasskeyClient({
      address: address,
      credentialPublicKey: passkey,
      userName: username,
      userDisplayName: username,
      contracts,
      chain,
      transport: http(),
    });

    return client;
  };

  // Recovery client for account recovery operations
  const getRecoveryClient = ({
    chainId,
    address: recoveryAddress,
  }: {
    chainId: SupportedChainId;
    address: Address;
  }) => {
    const chain = supportedChains.find((chain) => chain.id === chainId);
    if (!chain) throw new Error(`Chain with id ${chainId} is not supported`);

    const contracts = contractsByChain[chainId];

    const client = createZksyncRecoveryGuardianClient({
      address: recoveryAddress,
      contracts,
      chain: chain,
      transport: http(),
    });

    return client;
  };

  // Configurable client with custom parameters
  const getConfigurableClient = ({
    chainId,
    address: clientAddress,
    credentialPublicKey,
    username: clientUsername,
  }: {
    chainId: SupportedChainId;
    address: Address;
    credentialPublicKey: Uint8Array<ArrayBufferLike>;
    username: string;
  }) => {
    const chain = supportedChains.find((chain) => chain.id === chainId);
    if (!chain) throw new Error(`Chain with id ${chainId} is not supported`);

    const contracts = contractsByChain[chainId];

    return createZksyncPasskeyClient({
      address: clientAddress,
      credentialPublicKey,
      userName: clientUsername,
      userDisplayName: clientUsername,
      contracts,
      chain,
      transport: http(),
    });
  };

  // Temporary client with generated private key (for testing/demo purposes)
  const getThrowAwayClient = ({ chainId }: { chainId: SupportedChainId }) => {
    const chain = supportedChains.find((chain) => chain.id === chainId);
    if (!chain) throw new Error(`Chain with id ${chainId} is not supported`);

    const throwAwayClient = createWalletClient({
      account: privateKeyToAccount(generatePrivateKey()),
      chain,
      transport: http(),
    })
      .extend(publicActions)
      .extend(walletActions)
      .extend(eip712WalletActions());

    return throwAwayClient;
  };

  // External wallet client (for connecting to MetaMask, etc.)
  const getWalletClient = async ({
    chainId,
  }: {
    chainId: SupportedChainId;
  }) => {
    const chain = supportedChains.find((chain) => chain.id === chainId);
    if (!chain) throw new Error(`Chain with id ${chainId} is not supported`);

    // Check if window.ethereum exists (MetaMask or other injected wallet)
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error(
        "No ethereum provider found - please install MetaMask or another Web3 wallet"
      );
    }

    // Request account access
    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as Address[];

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found - please connect your wallet");
    }

    return createWalletClient({
      chain,
      account: accounts[0],
      transport: http(), // Using HTTP instead of custom for Sophon
    })
      .extend(publicActions)
      .extend(walletActions)
      .extend(eip712WalletActions());
  };

  return {
    defaultChain,
    contractsByChain,
    getPublicClient,
    getClient,
    getThrowAwayClient,
    getWalletClient,
    getRecoveryClient,
    getConfigurableClient,
    // Helper computed values
    isLoggedIn: !!address,
    currentAddress: address,
    currentUsername: username,
  };
};
