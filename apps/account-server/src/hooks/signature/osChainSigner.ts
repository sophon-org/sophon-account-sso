import {
  getMEEVersion,
  MEEVersion,
  toNexusAccount,
} from '@biconomy/abstractjs';
import type { Address } from 'viem';
import { http } from 'wagmi';
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

    const safePayload = safeParseTypedData(payload);

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

    const safePayload = safeParseTypedData(payload);

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
  console.log(deps, payload);

  // TODO: Implement OS chain message signing
  return await `0x${Array.from({ length: 64 }, () => '0').join('')}`;
};

export const createOsChainSigner = (deps: SignerDeps) => ({
  signTypedData: (payload: TypedDataSigningRequest) =>
    signTypedDataOnOsChain(deps, payload),
  signMessage: (payload: MessageSigningRequest) =>
    signMessageOnOsChain(deps, payload),
});
