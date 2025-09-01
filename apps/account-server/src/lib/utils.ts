import { type ByteArray, bytesToHex, type Hex } from 'viem';

export const safeHexString = (input?: string | ByteArray): Hex => {
  if (input && Array.isArray(input)) {
    return bytesToHex(input as ByteArray);
  }

  return input as Hex;
};

export const isValidPaymaster = (address?: string) => {
  return address !== undefined && address !== '0x' && address !== '0';
};
