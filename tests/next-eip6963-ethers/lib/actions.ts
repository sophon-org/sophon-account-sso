'use client';

import {
  BrowserProvider,
  Contract,
  type Provider,
  Signer,
} from 'zksync-ethers';
import { getSophonEIP6963Connector } from './eip6963';

export const TestableActions = [
  'signMessage',
  'signTypedData',
  'getChainId',
  'switchChain',
  'getBalance',
  'getGasPrice',
  'getBlockNumber',
  'getBlock',
  'getTransactionCount',
  'getTransaction',
  'getTransactionReceipt',
  'estimateGas',
  'getBytecode',
  'getStorageAt',
  'call',
  'writeContract',
  'sendTransaction',
] as const;

export const totalEthersActions = TestableActions.length;
export type TestableActionsNames = (typeof TestableActions)[number];

const ethersConnect = async () => {
  const sophonProvider = await getSophonEIP6963Connector();

  if (!sophonProvider) {
    console.error('❌ No provider available');
    throw new Error('No injected wallets found');
  }

  const browserProvider = new BrowserProvider(sophonProvider, {
    chainId: 531050104,
    name: 'SOPHON',
  });

  await browserProvider.send('eth_requestAccounts', []);

  const signer = await browserProvider.getSigner();
  if (!signer) {
    console.error('❌ No signer available');
    throw new Error('No signer available');
  }

  sophonProvider.on('accountsChanged', () => {
    console.log('🔍 accountsChanged');
  });
  browserProvider.on('network', () => {
    console.log('🔍 network');
  });

  // Make sure to initialize on L2
  const network = await browserProvider.getNetwork();
  console.log('🌐 Connected to network:', network.toJSON());

  return {
    sophonProvider,
    browserProvider,
    signer,
  };
};

export const executeEthersAction = async (
  action: TestableActionsNames,
  // biome-ignore lint/suspicious/noExplicitAny: dynamic testing
  args: any,
): Promise<unknown> => {
  console.log('🔌 executeEthersAction', action, args);
  const { browserProvider, signer } = await ethersConnect();
  const nonce = await signer.getNonce();
  console.log('nonce', nonce);

  switch (action) {
    case 'signMessage':
      return await signer.signMessage(args.message);
    case 'signTypedData':
      return await signer.signTypedData(args.domain, args.types, args.message);
    case 'getChainId': {
      const network = await browserProvider.getNetwork();
      return network.chainId;
    }
    case 'switchChain': {
      await browserProvider.send('wallet_switchEthereumChain', [
        { chainId: args.chainId },
      ]);
      return await browserProvider.getNetwork();
    }
    case 'getBalance': {
      return await browserProvider.getBalance(args.address);
    }
    case 'getGasPrice': {
      return await browserProvider.getGasPrice();
    }
    case 'getBlockNumber': {
      return await browserProvider.getBlockNumber();
    }
    case 'getBlock': {
      if (args.blockHash) {
        return await browserProvider.getBlock(args.blockHash);
      }
      return await browserProvider.getBlockDetails(args.blockNumber);
    }
    case 'getTransactionCount': {
      return await browserProvider.getTransactionCount(args.address);
    }
    case 'getTransaction': {
      return await browserProvider.getTransaction(args.hash);
    }
    case 'getTransactionReceipt': {
      return await browserProvider.getTransactionReceipt(args.hash);
    }
    case 'estimateGas': {
      const gasPrice = await browserProvider.getGasPrice();
      return await browserProvider.estimateGas({ ...args, gasPrice });
    }
    case 'getBytecode': {
      return await browserProvider.getCode(args.address);
    }
    case 'getStorageAt': {
      return await browserProvider.getStorage(args.address, args.slot);
    }
    case 'call': {
      return await browserProvider.call(args);
    }
    case 'writeContract': {
      const signerL2 = Signer.from(
        signer,
        531050104,
        browserProvider as unknown as Provider,
      );
      const contract = new Contract(args.address, args.abi, signerL2);
      return await contract[args.functionName](...args.args);
    }
    case 'sendTransaction': {
      const signerL2 = Signer.from(
        signer,
        531050104,
        browserProvider as unknown as Provider,
      );
      return await signerL2.sendTransaction(args);
    }
    default:
  }

  throw new Error(`Unknown action: ${action}`);
};

if (typeof window !== 'undefined') {
  window.executeEthersAction = executeEthersAction;
}

declare global {
  interface Window {
    executeEthersAction: (
      action: TestableActionsNames,
      // biome-ignore lint/suspicious/noExplicitAny: ignore for sake of dynamic testing
      args: any,
    ) => Promise<unknown>;
  }
}
