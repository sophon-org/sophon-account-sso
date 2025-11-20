export enum ChainCapabilityValue {
  DISABLED = 'disable',
  ENABLED = 'enabled',
  OFF_CHAIN = 'off-chain',
}

export interface ChainCapability {
  sns: ChainCapabilityValue;
  signature: ChainCapabilityValue;
  transactions: ChainCapabilityValue;
  deployContract: ChainCapabilityValue;
}
