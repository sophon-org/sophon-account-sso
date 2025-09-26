# useERC20Approval

A React hook for handling ERC20 token approvals. This hook manages the complete approval workflow including checking current allowances, executing approval transactions, and monitoring confirmation status.

## Overview

`useERC20Approval` simplifies the process of granting permission for smart contracts to spend ERC20 tokens on behalf of users. It automatically checks current allowances, determines if approval is needed, and provides functions to execute approval transactions with proper error handling and confirmation tracking.

## Import

```typescript
// React (web)
import { useERC20Approval } from '@sophon-labs/account-react'

// React Native
import { useERC20Approval } from '@sophon-labs/account-react-native'
```

## Usage

### React (Web)

```tsx
import { useERC20Approval } from '@sophon-labs/account-react'
import { useMemo, useState } from 'react'

function App() {
  const [formData] = useState({
    tokenAddress: '0x...',
    spender: '0x...',
    amount: '100000000000000000',
    chainId: 531050104, // Sophon Testnet
  })

  const config = useMemo(() => ({
    tokenAddress: formData.tokenAddress,
    spender: formData.spender,
    amount: BigInt(formData.amount),
    chainId: formData.chainId,
  }), [formData])

  const { isApproved, approve, isLoading, currentAllowance } = useERC20Approval(config)

  const handleApprove = async () => {
    try {
      await approve()
    } catch (err) {
      console.error('Approval failed:', err)
    }
  }

  return (
    <div>
      <p>Current Allowance: {currentAllowance.toString()}</p>
      <button onClick={handleApprove} disabled={isApproved || isLoading}>
        {isApproved ? 'Approved' : 'Approve Token'}
      </button>
    </div>
  )
}
```

### React Native

```tsx
import { useERC20Approval, useSophonAccount } from '@sophon-labs/account-react-native'
import { View, Text, Alert } from 'react-native'
import { useMemo, useState } from 'react'
import { Button } from '../ui/button'

function App() {
  const { account } = useSophonAccount()
  
  const [formData] = useState({
    tokenAddress: '0x...',
    spender: '0x...',
    amount: '100000000000000000',
    chainId: 531050104, // Sophon Testnet
  })

  const config = useMemo(() => ({
    tokenAddress: formData.tokenAddress,
    spender: formData.spender,
    amount: BigInt(formData.amount),
    chainId: formData.chainId,
  }), [formData])

  const { isApproved, approve, isLoading, currentAllowance } = useERC20Approval(config)

  const handleApprove = async () => {
    if (!account?.address) {
      Alert.alert('Error', 'Please connect your wallet first')
      return
    }

    try {
      await approve()
      Alert.alert('Success', 'Approval transaction submitted!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Approval failed'
      Alert.alert('Error', message)
    }
  }

  return (
    <View>
      <Text>Current Allowance: {currentAllowance.toString()}</Text>
      <Button onPress={handleApprove} disabled={isApproved || isLoading}>
        <Text>{isApproved ? 'Approved' : 'Approve Token'}</Text>
      </Button>
    </View>
  )
}
```

## Parameters

```typescript
import { type UseERC20ApprovalArgs } from '@sophon-labs/account-react'
```

### tokenAddress

`string`

ERC20 token contract address.

### spender

`string`

Address that will spend the tokens (e.g., DEX router).

### amount

`bigint`

Amount to approve. Use `parseUnits` for proper decimal handling.

### chainId

`number | undefined`

Chain ID. Only required for React (web).

## Return Type

```typescript
import { type UseERC20ApprovalReturn } from '@sophon-labs/account-react'
```

### isApproved

`boolean`

Whether current allowance is greater than or equal to requested amount.

### approve

`() => Promise<void>`

Function to execute approval transaction.

### isLoading

`boolean`

Loading state for approval transaction.

### isError

`boolean`

Whether there's an error.

### error

`Error | null`

Error object if any.

### currentAllowance

`bigint`

Current allowance amount.

### approvalTxHash

`string | null`

Transaction hash after approval is submitted.

### isConfirmed

`boolean`

Whether approval transaction is confirmed.

### refetch

`() => void`

Function to refetch current allowance.

## Helper Hook

### useERC20InfiniteApproval

For infinite approvals (max uint256):

> **Security Warning**: Infinite approvals grant unlimited spending permission to the spender contract. Only use with trusted contracts and consider revoking approvals when no longer needed. For better security, use exact amount approvals with `useERC20Approval` instead.

```tsx
import { useERC20InfiniteApproval } from '@sophon-labs/account-react'

function App() {
  const { isApproved, approve } = useERC20InfiniteApproval({
    tokenAddress: '0x...',
    spender: '0x...',
    chainId: 1,
  })

  return (
    <button onClick={approve} disabled={isApproved}>
      {isApproved ? 'Approved' : 'Approve Infinite'}
    </button>
  )
}
```