import {
  type Address,
  createPublicClient,
  http,
  isAddress,
  namehash,
  pad,
  toHex,
} from 'viem';
import { sophon, sophonTestnet } from 'viem/chains';
import { snsRegistryAbi } from './abis/SNSRegistryAbi';

const SNS_REGISTRY_ADDRESS = '0xc1Ef891D1b17AB8E1af3a8Bb24cdA68aBfFD1F49';

export const resolveName = async (
  name: string,
  testnet: boolean = true,
  rpcUrl?: string,
): Promise<Address | null> => {
  const client = createPublicClient({
    chain: testnet ? sophonTestnet : sophon,
    transport: http(rpcUrl),
  });

  if (isAddress(name)) {
    throw new Error('An address is not a valid name');
  }

  // Clean up in case it was provided with the .soph.id suffix
  const _name = `${name.toLowerCase().replace('.soph.id', '')}.soph.id`;

  const hash = namehash(_name);

  const resolved = await client.readContract({
    address: SNS_REGISTRY_ADDRESS,
    abi: snsRegistryAbi,
    functionName: 'addr',
    args: [hash],
  });

  if (resolved === '0x0000000000000000000000000000000000000000') {
    return null;
  }

  return resolved as Address;
};

export const resolveAddress = async (
  address: string,
  testnet: boolean = true,
  rpcUrl?: string,
): Promise<string | null> => {
  const client = createPublicClient({
    chain: testnet ? sophonTestnet : sophon,
    transport: http(rpcUrl),
  });

  if (!isAddress(address)) {
    throw new Error('You provided an invalid address');
  }

  const tokenId = await client.readContract({
    address: SNS_REGISTRY_ADDRESS,
    abi: snsRegistryAbi,
    functionName: 'tokenOfOwnerByIndex',
    args: [address, 0],
  });

  if (!tokenId) {
    return null;
  }

  const nameHash = pad(toHex(tokenId as bigint), { size: 32 });

  const name = await client.readContract({
    address: SNS_REGISTRY_ADDRESS,
    abi: snsRegistryAbi,
    functionName: 'name',
    args: [nameHash],
  });

  return `${name}.soph.id`;
};
