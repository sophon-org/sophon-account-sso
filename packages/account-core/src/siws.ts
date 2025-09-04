export interface SiwsParams {
  domain: string;
  address: string;
  statement: string;
  chainId: number | string;
  nonce: string;
}

export class SiwsMessage {
  constructor(private readonly params: SiwsParams) {}

  prepareMessage() {
    return `${this.params.domain} wants you to sign in with your Sophon account:

'${this.params.statement}'

Address: ${this.params.address}
Chain ID: ${this.params.chainId}
Nonce: ${this.params.nonce}

Issued At: ${new Date().toISOString()}
`;
  }
}
