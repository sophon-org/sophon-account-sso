import type { Address } from 'viem';
import { env } from '../env';

interface K1OwnerState {
  accounts: Address[];
  k1Owner: Address;
}

class HyperindexService {
  private readonly graphqlEndpoint: string;

  constructor() {
    this.graphqlEndpoint = env.HYPERINDEX_ENDPOINT;
    if (!this.graphqlEndpoint?.trim()) {
      throw new Error('HYPERINDEX_ENDPOINT is not set');
    }
  }

  private async query(query: string, variables: Record<string, unknown>) {
    const response = await fetch(this.graphqlEndpoint, {
      method: 'POST',
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      console.log(response.statusText);
      // throw new Error('Failed to get smart accounts');
    }

    return response.json();
  }

  public async getOwnedSmartAccounts(
    ownerAddress: Address,
  ): Promise<Address[]> {
    const response = await this.query(
      `query getSmartAccountBySigner($ownerAddress: String!) {
        K1OwnerState(where: {k1Owner: {_ilike: $ownerAddress}}) {
          accounts
          k1Owner
        }
      }`,
      { ownerAddress },
    );

    const owners = response.data.K1OwnerState as K1OwnerState[];
    return owners.flatMap((owner) => owner.accounts);
  }
}

export const hyperindexService = new HyperindexService();
