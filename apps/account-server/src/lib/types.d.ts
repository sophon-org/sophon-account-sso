/**
 * Interface for the list of contract addresses used in the app.
 */
export interface ContractAddresses {
  session: `0x${string}`;
  passkey: `0x${string}`;
  accountFactory: `0x${string}`;
  accountPaymaster: `0x${string}`;
  recovery: `0x${string}`;
}
