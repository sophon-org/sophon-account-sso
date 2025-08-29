import { createPublicClient, http } from 'viem';
import { sophonTestnet } from 'viem/chains';
import {
  AccountType,
  type k1Signer,
  type PasskeySigner,
} from '@/types/smart-account';

const EIP1271_ABI = [
  {
    inputs: [
      { name: 'hash', type: 'bytes32' },
      { name: 'signature', type: 'bytes' },
    ],
    name: 'isValidSignature',
    outputs: [{ name: '', type: 'bytes4' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const EIP1271_MAGIC_VALUE = '0x1626ba7e';

export async function validateSmartAccountSignature(
  messageHash: `0x${string}`,
  signature: string,
  contractAddress: string,
): Promise<boolean> {
  const publicClient = createPublicClient({
    chain: sophonTestnet,
    transport: http(),
  });

  try {
    const result = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: EIP1271_ABI,
      functionName: 'isValidSignature',
      args: [messageHash, signature as `0x${string}`],
    });

    const isValid = result === EIP1271_MAGIC_VALUE;

    return isValid;
  } catch (error) {
    console.error('Error validating smart account signature:', error);
    return false;
  }
}

export const getSignerDisplayLabel = (signerType: k1Signer | PasskeySigner) => {
  switch (signerType.accountType) {
    case AccountType.PASSKEY:
      return 'Web Passkey';
    case AccountType.EOA:
      return 'EOA wallet';
    case AccountType.EMBEDDED:
      return 'Social signer';
  }
};
