# useGetSwapTransaction

A React hook for preparing swap transactions. This hook calls the `/swap/transaction` endpoint and returns transaction data ready to be executed.

## Overview

`useGetSwapTransaction` prepares a swap transaction by fetching the necessary transaction data from the swap API. It handles the complex process of route calculation, fee estimation, and transaction preparation, returning a ready-to-execute transaction object.

## Import

```typescript
// React (web)
import { useGetSwapTransaction } from '@sophon-labs/account-react'

// React Native
import { useGetSwapTransaction } from '@sophon-labs/account-react-native'
```

## Usage

### React (Web)

```tsx
import { useGetSwapTransaction, TransactionType } from '@sophon-labs/account-react'
import { useState, useMemo } from 'react'

function App() {
  const [enabled, setEnabled] = useState(false)

  const config = useMemo(() => ({
    actionType: TransactionType.SWAP,
    sender: '0x...',
    sourceChain: 1, // Ethereum
    destinationChain: 8453, // Base
    sourceToken: '0x...',
    destinationToken: '0x...',
    amount: BigInt('1000000000000000000'),
    slippage: 0.5,
  }), [])

  const apiConfig = useMemo(() => ({
    baseUrl: 'http://localhost:4001',
  }), [])

  const { data, isLoading, error } = useGetSwapTransaction(
    { config, enabled },
    apiConfig
  )

  if (isLoading) return <div>Preparing swap...</div>
  if (error) return <div>Error: {error?.message}</div>

  return (
    <div>
      <button onClick={() => setEnabled(true)}>
        Prepare Swap
      </button>
      {data && (
        <div>
          <p>Transaction ID: {data.transactionId}</p>
          <p>Provider: {data.provider}</p>
          <p>Exchange Rate: {data.exchangeRate}</p>
        </div>
      )}
    </div>
  )
}
```

### React Native

```tsx
import { useGetSwapTransaction, TransactionType, useSophonAccount } from '@sophon-labs/account-react-native'
import { View, Text, Alert } from 'react-native'
import { useState, useMemo, useEffect } from 'react'
import { Button } from '../ui/button'

function App() {
  const { account } = useSophonAccount()
  const [enabled, setEnabled] = useState(false)

  const [formData, setFormData] = useState({
    sender: account?.address || '',
    sourceChain: 1,
    destinationChain: 8453,
    sourceToken: '0x...',
    destinationToken: '0x...',
    amount: '1000000000000000000',
    slippage: 0.5,
    baseUrl: 'http://localhost:4001',
  })

  // Update sender when account changes
  useEffect(() => {
    if (account?.address) {
      setFormData((prev) => ({ ...prev, sender: account.address }))
    }
  }, [account?.address])

  const config = useMemo(() => ({
    actionType: TransactionType.SWAP,
    sender: formData.sender,
    sourceChain: formData.sourceChain,
    destinationChain: formData.destinationChain,
    sourceToken: formData.sourceToken,
    destinationToken: formData.destinationToken,
    amount: BigInt(formData.amount),
    slippage: formData.slippage,
  }), [formData])

  const apiConfig = useMemo(() => ({
    baseUrl: formData.baseUrl,
  }), [formData.baseUrl])

  const { data, isLoading, error } = useGetSwapTransaction(
    { config, enabled },
    apiConfig
  )

  const handleEnable = () => {
    if (!account?.address) {
      Alert.alert('Error', 'Please connect your wallet first')
      return
    }
    setEnabled(true)
  }

  if (isLoading) return <Text>Preparing swap...</Text>
  if (error) return <Text>Error: {error?.message}</Text>

  return (
    <View>
      <Button onPress={handleEnable}>
        <Text>Prepare Swap</Text>
      </Button>
      {data && (
        <View>
          <Text>Transaction ID: {data.transactionId}</Text>
          <Text>Provider: {data.provider}</Text>
          <Text>Exchange Rate: {data.exchangeRate}</Text>
        </View>
      )}
    </View>
  )
}
```

## Parameters

```typescript
import { type UseGetSwapTransactionArgs } from '@sophon-labs/account-react'
```

### config

Swap configuration object:

#### actionType

`'swap'`

Type of transaction action.

#### sender

`string`

Address initiating the swap.

#### sourceChain

`number`

Source chain ID.

#### destinationChain

`number`

Destination chain ID.

#### sourceToken

`string`

Source token contract address. Use `0x0000000000000000000000000000000000000000` for native tokens.

#### destinationToken

`string`

Destination token contract address.

#### amount

`bigint`

Amount to swap in source token's smallest unit.

#### slippage

`number`

Maximum slippage tolerance (e.g., `0.5` for 0.5%).

#### recipient

`string | undefined`

Optional recipient address. Defaults to sender if not provided.

### enabled

`boolean | undefined`

Whether to enable the swap preparation. Defaults to `false`.

### apiConfig

```typescript
import { type SwapApiConfig } from '@sophon-labs/account-react'
```

#### baseUrl

`string`

Base URL for the swap API.

## Return Type

```typescript
import { type UseGetSwapTransactionReturn } from '@sophon-labs/account-react'
```

### data

`UnifiedTransactionResponse | null`

Transaction data containing:
- `transactionId`: Unique transaction identifier
- `provider`: Swap provider name
- `transaction`: Ready-to-execute transaction object
- `fees`: Fee breakdown
- `exchangeRate`: Token exchange rate
- `estimatedTime`: Estimated completion time
- `requiredApprovals`: Required token approvals

### isLoading

`boolean`

Loading state for transaction preparation.

### isError

`boolean`

Whether there's an error.

### error

`Error | null`

Error object if preparation failed.

### refetch

`() => Promise<void>`

Function to manually refetch transaction data.

## Helper Hook

### useGetSwapTransactionWithDefaults

Uses default API configuration from Sophon context:

```tsx
import { useGetSwapTransactionWithDefaults } from '@sophon-labs/account-react'

function App() {
  const { data, isLoading } = useGetSwapTransactionWithDefaults({
    config: {
      actionType: 'swap',
      sender: '0x...',
      sourceChain: 1,
      destinationChain: 8453,
      sourceToken: '0x...',
      destinationToken: '0x...',
      amount: BigInt('1000000000000000000'),
      slippage: 0.5,
    },
    enabled: true,
  })

  return <div>{data ? 'Transaction prepared!' : 'Preparing...'}</div>
}
```