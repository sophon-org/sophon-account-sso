import { isAddress, zeroAddress } from 'viem';

export function isValidPaymaster(paymaster: string) {
  const isZeroAddress = paymaster === zeroAddress;
  const isValidAddress = isAddress(paymaster);
  return !isZeroAddress && isValidAddress;
}
