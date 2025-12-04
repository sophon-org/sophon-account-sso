export type ExplorerTokenInfo = {
  contractAddress: string;
  tokenName: string;
  symbol: string;
  tokenDecimal: string;
  tokenPriceUSD: string;
  liquidity: string;
  l1Address: string;
  iconURL: string;
};
export type ExplorerAbiFunction = {
  type: 'function';
  name: string;
  inputs?: Array<{
    name?: string;
    type: string;
    internalType?: string;
  }>;
  outputs?: Array<{
    name?: string;
    type: string;
  }>;
  stateMutability?: string;
};

export interface ExplorerContractInfo {
  abi: readonly ExplorerAbiFunction[] | null;
  name: string | null;
  isVerified: boolean;
}
