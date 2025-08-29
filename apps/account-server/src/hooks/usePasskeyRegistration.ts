import { shortenAddress } from '@sophon-labs/account-core';
import {
  bytesToHex,
  createPublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  http,
  toHex,
} from 'viem';
import { getGeneralPaymasterInput } from 'viem/zksync';
import { SsoAccountAbi, WebAuthValidatorAbi } from 'zksync-sso/abi';
import { registerNewPasskey } from 'zksync-sso/client/passkey';
import {
  base64UrlToUint8Array,
  getPublicKeyBytesFromPasskeySignature,
} from 'zksync-sso/utils';
import { CONTRACTS, SOPHON_VIEM_CHAIN } from '@/lib/constants';
import { u8ToString } from '@/lib/passkey';
import type { TransactionRequest } from '@/types/auth';
import { AccountType, type PasskeySigner } from '@/types/smart-account';
import { useAccountContext } from './useAccountContext';

const generatePasskeyRegisterInfo = (accountAddress: `0x${string}`) => {
  return {
    userDisplayName: `Sophon ${shortenAddress(accountAddress)} - ${new Date().toLocaleDateString('en-US')}`,
    userName: `Sophon ${shortenAddress(accountAddress)} - ${(new Date()).toLocaleDateString('en-US')}`,
  };
};

export const usePasskeyRegistration = () => {
  const { account } = useAccountContext();

  const createPasskey = async (): Promise<
    | {
        signer: PasskeySigner;
        txRequest: TransactionRequest;
      }
    | undefined
  > => {
    if (!account) {
      throw new Error('No account found');
    }

    const { userDisplayName, userName } = generatePasskeyRegisterInfo(
      account.address,
    );

    try {
      const newPasskey = await registerNewPasskey({
        userName,
        userDisplayName,
      });

      const { credentialPublicKey, credentialId } = newPasskey;

      const [x, y] = getPublicKeyBytesFromPasskeySignature(credentialPublicKey);

      const publicClient = createPublicClient({
        chain: SOPHON_VIEM_CHAIN,
        transport: http(),
      });

      const webAuthnValidatorAddress = CONTRACTS.passkey as `0x${string}`;
      const result = await publicClient.readContract({
        abi: SsoAccountAbi,
        address: account.address,
        functionName: 'isModuleValidator',
        args: [webAuthnValidatorAddress],
      });

      const txRequest: TransactionRequest = {
        from: account.address,
        to: account.address,
      };
      txRequest.paymaster = CONTRACTS.accountPaymaster;
      txRequest.paymasterInput = getGeneralPaymasterInput({
        innerInput: '0x',
      });

      const moduleData = [
        toHex(base64UrlToUint8Array(credentialId)),
        [bytesToHex(x), bytesToHex(y)],
        window.location.origin,
      ] as [`0x${string}`, [`0x${string}`, `0x${string}`], string];

      if (!result) {
        const data = encodeFunctionData({
          abi: SsoAccountAbi,
          functionName: 'addModuleValidator',
          args: [
            webAuthnValidatorAddress,
            encodeAbiParameters(
              [
                { name: 'credentialId', type: 'bytes' },
                { name: 'publicKeys', type: 'bytes32[2]' },
                { name: 'domain', type: 'string' },
              ],
              moduleData,
            ),
          ],
        });

        txRequest.data = data;
      } else {
        const data = encodeFunctionData({
          abi: WebAuthValidatorAbi,
          functionName: 'addValidationKey',
          args: moduleData,
        });

        txRequest.to = CONTRACTS.passkey;
        txRequest.data = data;
      }

      const signer: PasskeySigner = {
        accountType: AccountType.PASSKEY,
        credential: {
          id: credentialId,
          type: 'public-key',
          transports:
            newPasskey.passkeyRegistrationResponse.response.transports,
        },
        passkey: u8ToString(credentialPublicKey),
        username: userName,
        userDisplayName,
      };

      return { signer, txRequest };
    } catch (error) {
      console.error(error);
      return undefined;
    }
  };

  return { createPasskey };
};
