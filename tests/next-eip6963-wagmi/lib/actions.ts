'use client';

import type { Hex } from 'viem';
import * as wagmiActions from 'wagmi/actions';
import { wagmiConfig } from './wagmi';

// biome-ignore lint/suspicious/noExplicitAny: ignore for sake of dynamic testing
export const testableActions = { ...wagmiActions } as any;
export type TestableActionsNames = keyof typeof wagmiActions;
export const totalTestableActions = Object.keys(testableActions).length;

export const executeWagmiAction = async <T extends TestableActionsNames>(
  action: T,
  args: Parameters<(typeof wagmiActions)[T]>[1],
): Promise<ReturnType<(typeof wagmiActions)[T]>> => {
  return await testableActions[action](wagmiConfig, args);
};

export const signTransaction = async (
  // biome-ignore lint/suspicious/noExplicitAny: dynamic testing
  request: any,
): Promise<Hex> => {
  const preparedTransaction = await wagmiActions.prepareTransactionRequest(
    wagmiConfig,
    request,
  );

  const maxFeePerGas =
    preparedTransaction.maxFeePerGas || preparedTransaction.gasPrice || 0;
  const maxPriorityFeePerGas =
    preparedTransaction.maxPriorityFeePerGas || maxFeePerGas;
  const gasPerPubdataByteLimit = 50000;

  // biome-ignore lint/suspicious/noExplicitAny: dynamic testing
  const typedTransaction: any = {
    domain: {
      name: 'zkSync',
      version: '2',
      chainId: preparedTransaction.chainId,
    },
    types: {
      Transaction: [
        { name: 'txType', type: 'uint256' },
        { name: 'from', type: 'uint256' },
        { name: 'to', type: 'uint256' },
        { name: 'gasLimit', type: 'uint256' },
        { name: 'gasPerPubdataByteLimit', type: 'uint256' },
        { name: 'maxFeePerGas', type: 'uint256' },
        { name: 'maxPriorityFeePerGas', type: 'uint256' },
        { name: 'paymaster', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' },
        { name: 'factoryDeps', type: 'bytes32[]' },
        { name: 'paymasterInput', type: 'bytes' },
      ],
    },
    primaryType: 'Transaction',
    message: {
      txType: 0x71,
      from: preparedTransaction.from,
      to: preparedTransaction.to,
      gasPerPubdataByteLimit: gasPerPubdataByteLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce: preparedTransaction.nonce || 0,
      value: preparedTransaction.value || 0,
      data: preparedTransaction.data || '0x',
    },
  };

  return await wagmiActions.signTypedData(wagmiConfig, typedTransaction);
};

export const executeRawTransaction = async (
  // biome-ignore lint/suspicious/noExplicitAny: dynamic testing
  signature: any,
): Promise<Hex> => {
  const walletClient = await wagmiActions.getWalletClient(wagmiConfig);
  return await walletClient.sendRawTransaction({
    serializedTransaction: signature,
  });
};

if (typeof window !== 'undefined') {
  window.executeWagmiAction = executeWagmiAction;
  window.signTransaction = signTransaction;
  window.executeRawTransaction = executeRawTransaction;
}

declare global {
  interface Window {
    executeWagmiAction: (
      action: TestableActionsNames,
      // biome-ignore lint/suspicious/noExplicitAny: ignore for sake of dynamic testing
      args: any,
    ) => Promise<unknown>;
    signTransaction: (
      // biome-ignore lint/suspicious/noExplicitAny: ignore for sake of dynamic testing
      request: any,
    ) => Promise<unknown>;
    executeRawTransaction: (
      // biome-ignore lint/suspicious/noExplicitAny: ignore for sake of dynamic testing
      signature: any,
    ) => Promise<unknown>;
  }
}
