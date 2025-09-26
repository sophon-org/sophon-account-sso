# useGetSwapStatus

A React hook for tracking the status of swap transactions. This hook calls the `/swap/status` endpoint to monitor transaction progress and provides real-time updates on swap completion.

## Overview

`useGetSwapStatus` tracks the progress of a swap transaction by polling the swap API for status updates. It provides detailed information about transaction state, fees, timestamps, and links to block explorers. The hook supports both one-time checks and continuous polling for real-time updates.

## Import

```typescript
// React (web)
import { useGetSwapStatus } from '@sophon-labs/account-react'

// React Native
import { useGetSwapStatus } from '@sophon-labs/account-react-native'
```

## Usage

### React (Web)

```tsx
import { useGetSwapStatus } from '@sophon-labs/account-react'
import { useEffect, useMemo, useState } from 'react'

function App() {
  const [enabled, setEnabled] = useState(false)
  const [hasData, setHasData] = useState(false)

  // Form state for config
  const [formData] = useState({
    txHash: '0x...',
    chainId: 10,
    refetchInterval: 0,
    baseUrl: 'http://localhost:4001',
  })

  const apiConfig = useMemo(() => ({
    baseUrl: formData.baseUrl,
  }), [formData.baseUrl])

  const { data, isLoading, error } = useGetSwapStatus(
    {
      txHash: formData.txHash,
      chainId: formData.chainId,
      enabled: enabled,
      refetchInterval: formData.refetchInterval,
    },
    apiConfig,
  )

  // Update hasData when we receive data
  useEffect(() => {
    if (data) {
      setHasData(true)
      setEnabled(false) // Stop fetching once we have data
    }
  }, [data])

  const handleEnable = () => {
    setEnabled(true)
  }

  if (isLoading) return <div>Checking status...</div>
  if (error) return <div>Error: {error?.message}</div>

  return (
    <div>
      <button onClick={handleEnable}>Check Status</button>
      {hasData && data && (
        <div>
          <p>Found: {data.found ? 'Yes' : 'No'}</p>
          <p>Status: {data.status}</p>
          <p>Provider: {data.provider}</p>
        </div>
      )}
    </div>
  )
}
```

### React Native

```tsx
import { useGetSwapStatus, useSophonAccount } from '@sophon-labs/account-react-native'
import { View, Text, Alert } from 'react-native'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '../ui/button'

function App() {
  const { account } = useSophonAccount()
  const [enabled, setEnabled] = useState(false)
  const [hasData, setHasData] = useState(false)

  // Form state for config
  const [formData] = useState({
    txHash: '0x...',
    chainId: 10,
    refetchInterval: 0,
    baseUrl: 'http://localhost:4001',
  })

  const apiConfig = useMemo(() => ({
    baseUrl: formData.baseUrl,
  }), [formData.baseUrl])

  const { data, isLoading, error } = useGetSwapStatus(
    {
      txHash: formData.txHash,
      chainId: formData.chainId,
      enabled: enabled,
      refetchInterval: formData.refetchInterval,
    },
    apiConfig,
  )

  // Update hasData when we receive data
  useEffect(() => {
    if (data) {
      setHasData(true)
      setEnabled(false) // Stop fetching once we have data
    }
  }, [data])

  const handleEnable = () => {
    if (!account?.address) {
      Alert.alert('Info', 'You can check transaction status without connecting wallet')
    }
    setEnabled(true)
  }

  if (isLoading) return <Text>Checking status...</Text>
  if (error) return <Text>Error: {error?.message}</Text>

  return (
    <View>
      <Button onPress={handleEnable}>
        <Text>Check Status</Text>
      </Button>
      {hasData && data && (
        <View>
          <Text>Found: {data.found ? 'Yes' : 'No'}</Text>
          <Text>Status: {data.status}</Text>
          <Text>Provider: {data.provider}</Text>
        </View>
      )}
    </View>
  )
}
```

## Parameters

```typescript
import { type UseGetSwapStatusArgs } from '@sophon-labs/account-react'
```

### config

Configuration object with the following properties:

#### txHash

`string`

Transaction hash to track.

#### chainId

`number | undefined`

Chain ID where the transaction occurred.

#### enabled

`boolean | undefined`

Whether to enable status checking. Defaults to `true`.

#### refetchInterval

`number | undefined`

Polling interval in milliseconds. Set to `0` to disable polling.

### apiConfig

```typescript
import { type SwapApiConfig } from '@sophon-labs/account-react'
```

#### baseUrl

`string`

Base URL for the swap API.

## Return Type

```typescript
import { type UseGetSwapStatusReturn } from '@sophon-labs/account-react'
```

### data

`UnifiedStatusResponse | null`

Status data containing:
- `found`: Whether transaction was found
- `status`: Current transaction status
- `provider`: Swap provider name
- `transaction`: Transaction details
- `fees`: Fee information
- `timestamps`: Transaction timestamps
- `links`: Block explorer links

### isLoading

`boolean`

Loading state for status check.

### isError

`boolean`

Whether there's an error.

### error

`Error | null`

Error object if status check failed.

### refetch

`() => Promise<void>`

Function to manually refetch status.

## Polling Example

```tsx
import { useGetSwapStatus } from '@sophon-labs/account-react'
import { useState, useEffect } from 'react'

function SwapTracker({ txHash }) {
  const [isPolling, setIsPolling] = useState(true)
  
  const { data, isLoading } = useGetSwapStatus(
    {
      txHash,
      enabled: isPolling,
      refetchInterval: isPolling ? 3000 : 0, // Poll every 3 seconds
    },
    { baseUrl: 'http://localhost:4001' }
  )

  // Stop polling when transaction is complete
  useEffect(() => {
    if (data?.status === 'success' || data?.status === 'failed') {
      setIsPolling(false)
    }
  }, [data?.status])

  return (
    <div>
      <p>Status: {data?.status || 'Unknown'}</p>
      {isPolling && <p>Polling for updates...</p>}
      <button onClick={() => setIsPolling(!isPolling)}>
        {isPolling ? 'Stop Polling' : 'Start Polling'}
      </button>
    </div>
  )
}
```