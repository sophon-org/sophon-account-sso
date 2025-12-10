import {
  getMEEVersion,
  MEEVersion,
  toNexusAccount,
} from '@biconomy/abstractjs';
import type { Address } from 'viem';
import { http } from 'wagmi';
import { buildBiconomyTypedDataPayload } from '@/lib/biconomyTypedSignature';
import { SOPHON_VIEM_CHAIN } from '@/lib/constants';
import { safeParseTypedData } from '@/lib/helpers';
import type {
  MessageSigningRequest,
  TypedDataSigningRequest,
} from '@/types/auth';
import type { SignerDeps } from '@/types/signature';
import {
  createPrimaryWalletAccount,
  createWalletAccount,
} from './localAccounts';

export const signTypedDataOnOsChain = async (
  deps: SignerDeps,
  payload: TypedDataSigningRequest,
) => {
  const { isEthereumWallet } = await import('@dynamic-labs/ethereum');

  if (deps.primaryWallet && isEthereumWallet(deps.primaryWallet)) {
    const ownerAccount = await createPrimaryWalletAccount(deps.primaryWallet);

    const smartAccount = await toNexusAccount({
      signer: ownerAccount,
      chainConfiguration: {
        chain: SOPHON_VIEM_CHAIN,
        transport: http(),
        version: getMEEVersion(MEEVersion.V2_1_0),
        versionCheck: false,
      },
    });

    const biconomyPayload = buildBiconomyTypedDataPayload(payload) ?? payload;
    const safePayload = safeParseTypedData(biconomyPayload);

    return await smartAccount.signTypedData({
      domain: safePayload.domain,
      types: safePayload.types,
      primaryType: safePayload.primaryType,
      message: safePayload.message,
    });
  }

  if (deps.isEOAAccount) {
    if (!deps.connectedAddress) {
      throw new Error('Wallet not connected for EOA signing!');
    }
    if (!deps.walletClient) {
      throw new Error('Wallet client not found for EOA signing');
    }
    const ownerAccount = createWalletAccount(
      deps.connectedAddress as Address,
      deps.walletClient,
    );

    const nexusAccount = await toNexusAccount({
      signer: ownerAccount,
      chainConfiguration: {
        chain: SOPHON_VIEM_CHAIN,
        transport: http(),
        version: getMEEVersion(MEEVersion.V2_1_0),
        versionCheck: false,
      },
    });

    const biconomyPayload = buildBiconomyTypedDataPayload(payload) ?? payload;
    const safePayload = safeParseTypedData(biconomyPayload);

    return await nexusAccount.signTypedData({
      domain: safePayload.domain,
      primaryType: safePayload.primaryType,
      types: safePayload.types,
      message: safePayload.message,
    });
  }
};

export const signMessageOnOsChain = async (
  deps: SignerDeps,
  payload: MessageSigningRequest,
) => {
  const { isEthereumWallet } = await import('@dynamic-labs/ethereum');

  if (deps.primaryWallet && isEthereumWallet(deps.primaryWallet)) {
    const ownerAccount = await createPrimaryWalletAccount(deps.primaryWallet);

    const smartAccount = await toNexusAccount({
      signer: ownerAccount,
      chainConfiguration: {
        chain: SOPHON_VIEM_CHAIN,
        transport: http(),
        version: getMEEVersion(MEEVersion.V2_1_0),
        versionCheck: false,
      },
    });

    return await smartAccount.signMessage({
      message: payload.message,
    });
  }

  if (deps.isEOAAccount) {
    if (!deps.connectedAddress) {
      throw new Error('Wallet not connected for EOA signing!');
    }
    if (!deps.walletClient) {
      throw new Error('Wallet client not found for EOA signing');
    }
    const ownerAccount = createWalletAccount(
      deps.connectedAddress as Address,
      deps.walletClient,
    );

    const nexusAccount = await toNexusAccount({
      signer: ownerAccount,
      chainConfiguration: {
        chain: SOPHON_VIEM_CHAIN,
        transport: http(),
        version: getMEEVersion(MEEVersion.V2_1_0),
        versionCheck: false,
      },
    });

    return await nexusAccount.signMessage({
      message: payload.message,
    });
  }
};

export const createOsChainSigner = (deps: SignerDeps) => ({
  signTypedData: (payload: TypedDataSigningRequest) =>
    signTypedDataOnOsChain(deps, payload),
  signMessage: (payload: MessageSigningRequest) =>
    signMessageOnOsChain(deps, payload),
});
