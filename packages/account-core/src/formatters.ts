/**
 * Shorten an address to the first 3 and last 5 characters, useful for display purposes
 *
 * @param address - The address to shorten
 * @param chars - The number of characters to keep from the start and end
 * @returns The shortened address
 */
export const shortenAddress = (
  address: `0x${string}` | undefined,
  chars = 3,
): string | undefined => {
  return address && `${address.slice(0, chars + 3)}...${address.slice(-5)}`;
};
