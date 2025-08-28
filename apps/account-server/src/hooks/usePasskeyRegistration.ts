import {
  bytesToHex,
  createPublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  http,
  toHex,
} from 'viem';
import { SsoAccountAbi, WebAuthValidatorAbi } from 'zksync-sso/abi';
import { registerNewPasskey } from 'zksync-sso/client/passkey';
import {
  base64UrlToUint8Array,
  getPublicKeyBytesFromPasskeySignature,
} from 'zksync-sso/utils';
import { CONTRACTS, SOPHON_VIEM_CHAIN } from '@/lib/constants';
import { u8ToString } from '@/lib/passkey';
import { AccountType, type PasskeySigner } from '@/types/smart-account';
import { useAccountContext } from './useAccountContext';
import { useTransaction } from './useTransaction';

const generatePasskeyRegisterInfo = (accountAddress: string) => {
  return {
    userDisplayName: `Sophon Account ${accountAddress} Passkey`,
    userName: `Sophon Account ${accountAddress} - Passkey created on ${(new Date()).toLocaleDateString('en-US')}`,
  };
};

export const usePasskeyRegistration = () => {
  const { account, login } = useAccountContext();

  const { sendTransaction } = useTransaction();

  const addPasskey = async () => {
    if (!account) {
      throw new Error('No account found');
    }

    const { userDisplayName, userName } = generatePasskeyRegisterInfo(
      account.address,
    );
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

    console.log(result);

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
      await sendTransaction(
        {
          from: account.address,
          to: account.address,
          data,
        },
        null,
      );
    } else {
      const data = encodeFunctionData({
        abi: WebAuthValidatorAbi,
        functionName: 'addValidationKey',
        args: moduleData,
      });

      await sendTransaction(
        {
          from: account.address,
          to: CONTRACTS.passkey,
          data,
        },
        null,
      );
    }

    const signer: PasskeySigner = {
      accountType: AccountType.Passkey,
      credential: {
        id: credentialId,
        type: 'public-key',
        transports: newPasskey.passkeyRegistrationResponse.response.transports,
      },
      passkey: u8ToString(credentialPublicKey),
      username: userName,
      userDisplayName,
    };

    login({
      ...account,
      signer,
    });
  };

  return { addPasskey };
};
