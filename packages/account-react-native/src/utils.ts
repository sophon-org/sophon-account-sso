export function shortenAddress(
  address: `0x${string}` | string | undefined,
  chars = 3,
): string | undefined {
  return address && `${address.slice(0, chars + 3)}...${address.slice(-5)}`;
}
