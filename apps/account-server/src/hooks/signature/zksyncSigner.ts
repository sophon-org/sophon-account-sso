import type { Address, SignableMessage } from 'viem';
import { http } from 'wagmi';
import { createZksyncEcdsaClient } from 'zksync-sso/client/ecdsa';
import { createZksyncPasskeyClient } from 'zksync-sso/client/passkey';
import { CONTRACTS, SOPHON_VIEM_CHAIN } from '@/lib/constants';
import { safeParseTypedData } from '@/lib/helpers';
import { verifySignature } from '@/lib/smart-contract';
import type {
  MessageSigningRequest,
  TypedDataSigningRequest,
} from '@/types/auth';
import type { SignerDeps } from '@/types/signature';
import { createWalletAccount } from './localAccounts';

const ensureEOAConnected = (connectedAddress?: Address) => {
  if (!connectedAddress) {
    throw new Error('Wallet not connected for EOA signing!');
  }
};

export const signTypedDataOnZksync = async (
  deps: SignerDeps,
  payload: TypedDataSigningRequest,
) => {
  const { isEthereumWallet } = await import('@dynamic-labs/ethereum');

  if (deps.primaryWallet && isEthereumWallet(deps.primaryWallet)) {
    try {
      const client = await deps.primaryWallet.getWalletClient();
      const safePayload = safeParseTypedData(payload);

      const signature = await client.signTypedData({
        domain: safePayload.domain,
        types: safePayload.types,
        primaryType: safePayload.primaryType,
        message: safePayload.message,
      });

      if (deps.verifySignature) {
        const verified = await verifySignature({
          accountAddress: payload.address,
          signature,
          domain: payload.domain,
          types: payload.types,
          primaryType: payload.primaryType,
          message: payload.message,
          signatureType: 'EIP1271',
        });
        if (!verified) throw new Error('Failed to verify message');
      }

      return signature;
    } catch (error) {
      console.error('Signing error:', error);
      throw error;
    }
  }

  if (deps.isEOAAccount) {
    ensureEOAConnected(deps.connectedAddress);

    const localAccount = createWalletAccount(
      deps.connectedAddress as Address,
      deps.walletClient,
    );

    const client = await createZksyncEcdsaClient({
      address: deps.account!.address,
      owner: localAccount,
      chain: SOPHON_VIEM_CHAIN,
      transport: http(),
      contracts: {
        session: CONTRACTS.session,
      },
    });

    const signature = await client.signTypedData({
      domain: payload.domain,
      types: payload.types,
      primaryType: payload.primaryType,
      message: payload.message,
    });

    if (deps.verifySignature) {
      const verified = await verifySignature({
        accountAddress: payload.address,
        signature,
        domain: payload.domain,
        types: payload.types,
        primaryType: payload.primaryType,
        message: payload.message,
        signatureType: 'EIP1271',
      });

      if (!verified) throw new Error('Failed to verify message');
    }

    return signature;
  }

  if (!deps.account?.owner.passkey) {
    throw new Error('No passkey data available for signing');
  }

  const client = createZksyncPasskeyClient({
    address: deps.account.address,
    credentialPublicKey: deps.account.owner.passkey,
    userName: deps.account.username || 'Sophon User',
    userDisplayName: deps.account.username || 'Sophon User',
    contracts: CONTRACTS,
    chain: SOPHON_VIEM_CHAIN,
    transport: http(),
  });

  console.log('passkey signature');
  const signature = await client.signTypedData({
    domain: payload.domain,
    types: payload.types,
    primaryType: payload.primaryType,
    message: payload.message,
  });

  if (deps.verifySignature) {
    const verified = await verifySignature({
      accountAddress: payload.address,
      signature,
      domain: payload.domain,
      types: payload.types,
      primaryType: payload.primaryType,
      message: payload.message,
      signatureType: 'EIP1271',
    });
    if (!verified) throw new Error('Failed to verify message');
  }

  return signature;
};

export const signMessageOnZksync = async (
  deps: SignerDeps,
  payload: MessageSigningRequest,
) => {
  const { isEthereumWallet } = await import('@dynamic-labs/ethereum');

  if (deps.primaryWallet && isEthereumWallet(deps.primaryWallet)) {
    try {
      const client = await deps.primaryWallet.getWalletClient();
      const signature = await client.signMessage({
        message: payload.message,
      });

      if (deps.verifySignature) {
        const verified = await verifySignature({
          accountAddress: payload.address,
          signature,
          message: payload.message,
          signatureType: 'EIP-191',
        });
        if (!verified) throw new Error('Failed to verify message');
      }
      return signature;
    } catch (error) {
      console.error('Signing error:', error);
      throw error;
    }
  }

  if (deps.isEOAAccount) {
    ensureEOAConnected(deps.connectedAddress);

    const localAccount = createWalletAccount(
      deps.connectedAddress as Address,
      deps.walletClient,
    );

    const client = await createZksyncEcdsaClient({
      address: deps.account!.address,
      owner: localAccount,
      chain: SOPHON_VIEM_CHAIN,
      transport: http(),
      contracts: {
        session: CONTRACTS.session,
      },
    });

    return client.signMessage({ message: payload.message });
  }

  if (!deps.account?.owner.passkey) {
    throw new Error('No passkey data available for signing');
  }

  const client = createZksyncPasskeyClient({
    address: deps.account.address,
    credentialPublicKey: deps.account.owner.passkey,
    userName: deps.account.username || 'Sophon User',
    userDisplayName: deps.account.username || 'Sophon User',
    contracts: CONTRACTS,
    chain: SOPHON_VIEM_CHAIN,
    transport: http(),
  });

  console.log('passkey signature');
  const signature = await client.signMessage({
    message: payload.message,
  });

  if (deps.verifySignature) {
    const verified = await verifySignature({
      accountAddress: payload.address,
      signature,
      message: payload.message as SignableMessage,
      signatureType: 'EIP-191',
    });
    if (!verified) throw new Error('Failed to verify message');
  }

  return signature;
};

export const createZksyncSigner = (deps: SignerDeps) => ({
  signTypedData: (payload: TypedDataSigningRequest) =>
    signTypedDataOnZksync(deps, payload),
  signMessage: (payload: MessageSigningRequest) =>
    signMessageOnZksync(deps, payload),
});
