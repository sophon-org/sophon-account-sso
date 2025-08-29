import { type Address, createPublicClient, http } from 'viem';
import { sophon, sophonTestnet } from 'viem/chains';
import { sophonAAFactoryAbi } from './abis/SophonAAFactory';
import { sophonAccountCodeStorageAbi } from './abis/SophonAccountStorageAbi';

const COLOR_PALETTE_200 = [
  '#CCE4FF',
  '#FFFAB8',
  '#FFDAC2',
  '#FABEDE',
  '#CCB0F5',
];

const COLOR_PALETTE_400 = [
  '#122B5C',
  '#474309',
  '#5C2907',
  '#662548',
  '#341A5C',
];

export const SOPHON_ACCOUNT_CODE_STORAGE_CONTRACT_ADDRESS: Address =
  '0x0000000000000000000000000000000000008002';

export const SOPHON_AA_FACTORY_ADDRESS: Address =
  '0x9Bb2603866dD254d4065E5BA50f15F8F058F600E';

export const SOPHON_SESSION_KEY_MODULE_ADDRESS: Address =
  '0x3E9AEF9331C4c558227542D9393a685E414165a3';

type GradientParams = {
  color1: string;
  color2: string;
  colorText: string;
  angle: number;
  centerX: number;
  centerY: number;
};

export interface AAFactoryAccount {
  accountId: `0x${string}`;
  factoryVersion: Address;
}

/**
 * Hash function to convert a string to a number
 * @param {string} str - Input string
 * @returns {number} - A number derived from the string
 */
const hashString = (str: string): number => {
  const H1 = 0xdeadbeef ^ 0;
  const H2 = 0x41c6ce57 ^ 0;
  const MULT1 = 2654435761; // 2654435761
  const MULT2 = 1597334677; // 1597334677
  const FINAL_MULT1 = 2246822507; // 2246822507
  const FINAL_MULT2 = 3266489909; // 3266489909
  const UINT32_MAX_PLUS_ONE = 4294967296; // 4294967296
  const H2_MASK = 2097151; // 2097151

  let h1 = H1;
  let h2 = H2;

  for (let i = 0, ch: number; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, MULT1);
    h2 = Math.imul(h2 ^ ch, MULT2);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), FINAL_MULT1);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), FINAL_MULT2);
  h2 = Math.imul(h2 ^ (h2 >>> 16), FINAL_MULT1);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), FINAL_MULT2);

  return UINT32_MAX_PLUS_ONE * (H2_MASK & h2) + (h1 >>> 0);
};

/**
 * Generates parameters from an input string
 * @param {string} inputString - The input string
 * @returns {Object} - Object containing two colors, an angle, and a Vector2
 */
export const generateParamsFromString = (
  inputString: string,
): GradientParams => {
  if (!inputString || typeof inputString !== 'string') {
    throw new Error('Input string is required');
  }

  // Generate a hash from the input string
  const hash = hashString(inputString);

  // Use the hash to select two different colors from the palette
  let colorIndex1 = Math.abs(hash % COLOR_PALETTE_200.length);
  const colorIndex2 = Math.abs((hash >> 8) % COLOR_PALETTE_200.length);

  // Ensure the colors are different
  if (colorIndex1 === colorIndex2) {
    colorIndex1 = (colorIndex1 + 1) % COLOR_PALETTE_200.length;
  }

  const color1 = COLOR_PALETTE_200[colorIndex1];
  const color2 = COLOR_PALETTE_200[colorIndex2];

  // Generate an angle (0 to 2π), counterclockwise
  const angle = ((Math.abs(hash >> 16) % 1000) / 1000) * 2 * Math.PI; // Range: 0 to 2π

  // Generate a Vector2 with values between 0.2 and 0.8
  const centerX = ((Math.abs(hash >> 24) % 101) / 100) * 0.6 + 0.2; // Range: 0.2 to 0.8
  const centerY = ((Math.abs(hash >> 16) % 101) / 100) * 0.6 + 0.2; // Range: 0.2 to 0.8

  const colorText = COLOR_PALETTE_400[colorIndex1];

  return {
    color1,
    color2,
    colorText,
    angle: Number(angle.toFixed(3)),
    centerX: Number(centerX.toFixed(3)),
    centerY: Number(centerY.toFixed(3)),
  };
};

export const getSVGAvatarFromString = (inputString: string): string => {
  const params = generateParamsFromString(inputString);
  const { color1, color2, angle, centerX, centerY } = params;

  // Calculate the gradient end point based on the starting point and angle
  const gradientLength = 1; // Length of the gradient vector
  const x2 = centerX + Math.cos(angle) * gradientLength;
  const y2 = centerY + Math.sin(angle) * gradientLength;

  const svg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradient" x1="${centerX * 100}%" y1="${centerY * 100}%" x2="${x2 * 100}%" y2="${y2 * 100}%">
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="100%" stop-color="${color2}"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#gradient)"/>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

/**
 * Returns true if the address is a Sophon account
 * @param address - The address of the account to check
 * @param testnet - Whether to use the testnet chain
 * @param rpcUrl - A custom RPC URL to use for the client
 * @returns True if the address is a Sophon account, false otherwise
 */
export const isSophonAccount = async (
  address: string,
  testnet: boolean = true,
  rpcUrl?: string,
) => {
  const client = createPublicClient({
    chain: testnet ? sophonTestnet : sophon,
    transport: http(rpcUrl),
  });

  const account = (await client.readContract({
    address: SOPHON_AA_FACTORY_ADDRESS,
    abi: sophonAAFactoryAbi,
    functionName: 'getAccount',
    args: [address],
  })) as AAFactoryAccount;

  return (
    account.accountId !==
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  );
};

/**
 * Returns true if the address is an EraVM contract(An EraVM contract is a contract compiled by zkzsolc and deployed on the zkVM)
 * @param address - The address of the contract to check
 * @param testnet - Whether to use the testnet chain
 * @param customRpc - A custom RPC URL to use for the client
 * @returns True if the address is an EraVM contract, false otherwise
 */
export const isEraVMContract = async (
  address: `0x${string}`,
  testnet: boolean = true,
  customRpc?: string,
) => {
  const client = createPublicClient({
    chain: testnet ? sophonTestnet : sophon,
    transport: customRpc ? http(customRpc) : http(),
  });

  const code = await client.getCode({ address });
  if (!code || code === '0x') {
    return false;
  }

  const isAccountEVM = await client.readContract({
    address: SOPHON_ACCOUNT_CODE_STORAGE_CONTRACT_ADDRESS,
    abi: sophonAccountCodeStorageAbi,
    functionName: 'isAccountEVM',
    args: [address],
  });

  return !isAccountEVM;
};
