import {
  createPublicClient,
  getAddress,
  http,
  isAddress,
  keccak256,
  stringToBytes,
  toHex,
} from 'viem';
import { SOPHON_VIEM_CHAIN } from '@/lib/constants';

// Proxy contract constants
const EIP1967_PROXY_IMPLEMENTATION_SLOT = toHex(
  BigInt(keccak256(stringToBytes('eip1967.proxy.implementation'))) - BigInt(1),
);
const EIP1967_PROXY_BEACON_SLOT = toHex(
  BigInt(keccak256(stringToBytes('eip1967.proxy.beacon'))) - BigInt(1),
);
const EIP1822_PROXY_IMPLEMENTATION_SLOT = keccak256(stringToBytes('PROXIABLE'));

// Minimal ABI for proxy contracts implementation function
const PROXY_CONTRACT_IMPLEMENTATION_ABI = [
  {
    inputs: [],
    name: 'implementation',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Helper function to safely get addresses from contract calls or storage
const getAddressSafe = async <T>(
  fn: () => Promise<T>,
): Promise<string | null> => {
  try {
    const result = await fn();
    if (
      typeof result === 'string' &&
      result !== '0x0000000000000000000000000000000000000000' &&
      isAddress(result)
    ) {
      return getAddress(result);
    }
    // Handle storage slots that return 32-byte values with address in last 20 bytes
    if (
      typeof result === 'string' &&
      result.length === 66 &&
      result.startsWith('0x')
    ) {
      const addressPart = `0x${result.slice(-40)}`; // Last 20 bytes (40 hex chars)
      if (
        addressPart !== '0x0000000000000000000000000000000000000000' &&
        isAddress(addressPart)
      ) {
        return getAddress(addressPart);
      }
    }
    return null;
  } catch (error) {
    console.warn('Error in getAddressSafe:', error);
    return null;
  }
};

/**
 * Checks if a contract is a proxy and returns the implementation address.
 * Supports EIP1967 (transparent proxy), EIP1822 (UUPS), and beacon proxy patterns.
 */
export const getProxyImplementation = async (
  address: string,
): Promise<string | null> => {
  if (!isAddress(address)) {
    return null;
  }

  try {
    const publicClient = createPublicClient({
      chain: SOPHON_VIEM_CHAIN,
      transport: http(),
    });

    const [
      implementation,
      eip1967Implementation,
      eip1967Beacon,
      eip1822Implementation,
    ] = await Promise.all([
      // Try direct implementation() call
      getAddressSafe(async () => {
        return await publicClient.readContract({
          address: address as `0x${string}`,
          abi: PROXY_CONTRACT_IMPLEMENTATION_ABI,
          functionName: 'implementation',
        });
      }),
      // EIP1967 implementation slot
      getAddressSafe(async () => {
        return await publicClient.getStorageAt({
          address: address as `0x${string}`,
          slot: EIP1967_PROXY_IMPLEMENTATION_SLOT as `0x${string}`,
        });
      }),
      // EIP1967 beacon slot
      getAddressSafe(async () => {
        return await publicClient.getStorageAt({
          address: address as `0x${string}`,
          slot: EIP1967_PROXY_BEACON_SLOT as `0x${string}`,
        });
      }),
      // EIP1822 implementation slot
      getAddressSafe(async () => {
        return await publicClient.getStorageAt({
          address: address as `0x${string}`,
          slot: EIP1822_PROXY_IMPLEMENTATION_SLOT as `0x${string}`,
        });
      }),
    ]);

    // Return first found implementation in priority order
    if (implementation) {
      return implementation;
    }

    if (eip1967Implementation) {
      return eip1967Implementation;
    }

    if (eip1822Implementation) {
      return eip1822Implementation;
    }

    // Handle beacon proxy - get implementation from beacon contract
    if (eip1967Beacon) {
      return getAddressSafe(async () => {
        return await publicClient.readContract({
          address: eip1967Beacon as `0x${string}`,
          abi: PROXY_CONTRACT_IMPLEMENTATION_ABI,
          functionName: 'implementation',
        });
      });
    }

    return null;
  } catch (error) {
    console.warn('Failed to check proxy implementation:', error);
    return null;
  }
};
