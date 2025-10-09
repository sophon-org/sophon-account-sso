# useGasEstimation

A React hook for estimating gas costs for blockchain transactions. This hook provides gas unit estimates, current gas prices, and calculates total transaction fees to help users understand costs before executing transactions.

## Overview

`useGasEstimation` simplifies the process of estimating transaction costs by combining gas estimation and gas price fetching into a single hook. It automatically calculates total fees and provides formatted values for display, helping users make informed decisions about transaction execution.

## Import

```typescript
// React (web)
import { useGasEstimation } from '@sophon-labs/account-react'

// React Native
import { useGasEstimation } from '@sophon-labs/account-react-native'
```

## Usage

### React (Web)

```tsx
import { useGasEstimation } from '@sophon-labs/account-react'
import { useAccount } from 'wagmi'
import { useMemo, useState } from 'react'

function App() {
  const { address } = useAccount()
  
  const [formData] = useState({
    to: '0x...',
    data: '0xa9059cbb000000000000000000000000feb22da05537b4b63bb63417b10935819facb81c0000000000000000000000000000000000000000000000000de0b6b3a7640000', // transfer(address,uint256)
    value: '0',
    chainId: 531050104, // Sophon Testnet
    enabled: false,
  })

  const config = useMemo(() => ({
    to: formData.to,
    from: address,
    data: formData.data,
    value: BigInt(formData.value),
    chainId: formData.chainId,
    enabled: formData.enabled,
  }), [formData, address])

  const { gasEstimate, gasPrice, totalFeeEstimate, isLoading } = useGasEstimation(config)

  if (isLoading) return <div>Estimating gas...</div>

  return (
    <div>
      <p>Gas Estimate: {gasEstimate?.toString()} units</p>
      <p>Gas Price: {gasPrice?.toString()} wei</p>
      <p>Total Fee: {totalFeeEstimate?.toString()} wei</p>
    </div>
  )
}
```

### React Native

```tsx
import { useGasEstimation, useSophonAccount } from '@sophon-labs/account-react-native'
import { View, Text } from 'react-native'
import { useMemo, useState } from 'react'

function App() {
  const { account } = useSophonAccount()
  
  const [formData] = useState({
    to: '0x...', // MOCK MintMe token
    data: '0xa9059cbb000000000000000000000000feb22da05537b4b63bb63417b10935819facb81c0000000000000000000000000000000000000000000000000de0b6b3a7640000', // transfer(address,uint256)
    value: '0',
    chainId: 531050104, // Sophon Testnet
    enabled: false,
  })

  const config = useMemo(() => ({
    to: formData.to,
    from: account?.address,
    data: formData.data,
    value: BigInt(formData.value),
    enabled: formData.enabled,
  }), [formData, account?.address])

  const { gasEstimate, gasPrice, totalFeeEstimate, isLoading } = useGasEstimation(config)

  if (isLoading) return <Text>Estimating gas...</Text>

  return (
    <View>
      <Text>Gas Estimate: {gasEstimate?.toString()} units</Text>
      <Text>Gas Price: {gasPrice?.toString()} wei</Text>
      <Text>Total Fee: {totalFeeEstimate?.toString()} wei</Text>
    </View>
  )
}
```

## Parameters

```typescript
import { type UseGasEstimationArgs } from '@sophon-labs/account-react'
```

### to

`string`

Target address for the transaction.

### from

`string | undefined`

Sender address. Optional, will use connected account if not provided.

### data

`string`

Transaction data (hex encoded).

### value

`bigint`

Transaction value in wei.

### chainId

`number | undefined`

Chain ID. Only required for React (web).

### enabled

`boolean | undefined`

Whether to enable gas estimation. Defaults to `true`.

## Return Type

```typescript
import { type UseGasEstimationReturn } from '@sophon-labs/account-react'
```

### gasEstimate

`bigint | undefined`

Estimated gas units required for the transaction.

### gasPrice

`bigint | undefined`

Current network gas price in wei.

### totalFeeEstimate

`bigint | undefined`

Total estimated fee (gasEstimate * gasPrice).

### isLoading

`boolean`

Loading state for gas estimation.

### isError

`boolean`

Whether there's an error.

### error

`Error | null`

Error object if estimation failed.

### refetch

`() => Promise<void>`

Function to refetch gas estimates.

## Helper Hook

### useSwapGasEstimation

For estimating gas for swap transactions:

```tsx
import { useSwapGasEstimation } from '@sophon-labs/account-react-native'

function App() {
  const { gasEstimate, totalFeeEstimate } = useSwapGasEstimation(
    {
      to: '0x...',
      data: '0xabcdef...',
      value: '1000000000000000000',
    },
    1 // chainId
  )

  return (
    <div>
      <p>Swap Gas: {gasEstimate?.toString()} units</p>
      <p>Swap Fee: {totalFeeEstimate?.toString()} wei</p>
    </div>
  )
}
```