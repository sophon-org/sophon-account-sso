# @sophon-labs/account-react

React hooks and utilities for integrating Sophon swap functionality into React applications. This package provides a comprehensive set of hooks for managing token swaps, ERC-20 approvals, and gas estimation within the Sophon ecosystem.

## Features

- 🔄 **Swap Transaction Management** - Prepare and execute token swaps
- 📊 **Swap Status Tracking** - Monitor transaction progress and completion
- ✅ **ERC-20 Token Approvals** - Handle token approval workflows
- ⛽ **Gas Estimation** - Accurate gas cost predictions for transactions
- 🔧 **TypeScript Support** - Fully typed for better developer experience
- 🧪 **Well Tested** - Comprehensive test coverage with Vitest

## Installation

```bash
npm install @sophon-labs/account-react
# or
yarn add @sophon-labs/account-react
```

## Hooks

### `useGetSwapTransaction`

Prepare a swap transaction by calling the `/swap/transaction` endpoint.

```tsx
import { useGetSwapTransaction } from '@sophon-labs/account-react';

const { data, isLoading, error } = useGetSwapTransaction(
  {
    config: {
      fromToken: '0x...',
      toToken: '0x...',
      amount: '1000000000000000000',
      slippage: 0.005
    },
    enabled: true
  },
  {
    baseUrl: 'https://api.sophon.xyz',
    partnerId: 'your-partner-id'
  }
);
```

### `useGetSwapStatus`

Track the status of a swap transaction.

```tsx
import { useGetSwapStatus } from '@sophon-labs/account-react';

const { data, isLoading, error } = useGetSwapStatus(
  {
    txHash: '0x...',
    enabled: true
  },
  {
    baseUrl: 'https://api.sophon.xyz',
    partnerId: 'your-partner-id'
  }
);
```

### `useERC20Approval`

Manage ERC-20 token approvals for swap contracts.

```tsx
import { useERC20Approval } from '@sophon-labs/account-react';

const { approve, allowance, isLoading, error } = useERC20Approval({
  tokenAddress: '0x...',
  spenderAddress: '0x...',
  account: '0x...'
});
```

### `useGasEstimation`

Estimate gas costs for transactions.

```tsx
import { useGasEstimation } from '@sophon-labs/account-react';

const { gasEstimate, isLoading, error } = useGasEstimation({
  transaction: {
    to: '0x...',
    data: '0x...',
    value: '0'
  }
});
```

## Utilities

### API Client

The package includes utilities for making API calls to Sophon services:

```tsx
import { createApiClient, serializeSwapConfig } from '@sophon-labs/account-react';

const apiClient = createApiClient({
  baseUrl: 'https://api.sophon.xyz',
  partnerId: 'your-partner-id'
});
```

## TypeScript Types

All hooks and utilities are fully typed. Import types for better development experience:

```tsx
import type { 
  SwapApiConfig,
  UnifiedTransactionResponse,
  SwapStatus 
} from '@sophon-labs/account-react';
```

## Dependencies

### Peer Dependencies
- React (>=19.x)
- React DOM (>=19.x)  
- viem (>=2.x)
- wagmi (>=2.x)
- @tanstack/react-query (>=5.x)

### Core Dependencies
- axios (for API calls)
- clsx (for utility functions)

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci
```
