import type { SophonNetworkType } from '@sophon-labs/account-core';
import { JSONRPCClient } from 'json-rpc-2.0';

export const genericRPCHandler = (
  network: SophonNetworkType,
): JSONRPCClient => {
  const rpcClient: JSONRPCClient = new JSONRPCClient((jsonRPCRequest) =>
    fetch(
      network === 'testnet'
        ? 'https://rpc.testnet.sophon.xyz'
        : 'https://rpc.sophon.xyz',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(jsonRPCRequest),
      },
    ).then((response) => {
      if (response.status === 200) {
        return response
          .json()
          .then((jsonRPCResponse) => rpcClient.receive(jsonRPCResponse));
      } else if (jsonRPCRequest.id !== undefined) {
        return Promise.reject(new Error(response.statusText));
      }
    }),
  );
  return rpcClient;
};
