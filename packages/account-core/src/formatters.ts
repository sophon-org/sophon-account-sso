/**
 * Shorten an address to the first N and last 5 characters, useful for display purposes
 *
 * @param address - The address to shorten
 * @param chars - The number of characters to keep after the 0x prefix (default: 3)
 * @returns The shortened address, or undefined if address is falsy, or the original address if too short
 */
export const shortenAddress = (
  address: `0x${string}` | undefined,
  chars = 3,
): string | undefined => {
  if (!address || address.length === 0) {
    return undefined;
  }

  // If address is too short to meaningfully shorten, return as-is
  const minLength = 2 + chars + 5; // "0x" + chars + last 5 chars
  if (address.length <= minLength) {
    return address;
  }

  return `${address.slice(0, 2 + chars)}...${address.slice(-5)}`;
};
