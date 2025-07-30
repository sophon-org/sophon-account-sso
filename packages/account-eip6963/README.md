# @sophon-labs/account-eip6963

Implementation of the [EIP-6963](https://eips.ethereum.org/EIPS/eip-6963) standard (Multi Injected Provider Discovery) for Sophon wallet. This enables applications to discover the Sophon wallet alongside other wallets providers like Metamask, RainbowKit etc... in a standardized way.

## Features

- **EIP-6963** compliant wallet discovery
- Support for both **mainnet** and **testnet**
- Seamless integration with modern wallet connection libraries
- Automatic provider announcement

## Installation

```bash
npm install @sophon-labs/account-eip6963
# or
yarn add @sophon-labs/account-eip6963
# or
pnpm install @sophon-labs/account-eip6963
```

## Using the EIP-6963 Package

EIP-6963 is a standard that allows multiple Ethereum wallet providers to be discovered on a web page without conflicting with each other, unlike the traditional `window.ethereum` approach.

### Basic Integration

1. Import and initialize the **EIP-6963** emitter in your application entry point:

```typescript
import "@sophon-labs/account-eip6963/testnet";

// or

import "@sophon-labs/account-eip6963/mainnet";

// The Sophon wallet will now announce itself via the EIP-6963 protocol
// No additional setup is required
```

This will automatically:

- Register the Sophon wallet provider
- Announce it through the EIP-6963 events
- Make it available to EIP-6963 compatible applications

### Working with Wallet Connection Libraries

Most modern wallet connection libraries, like RainbowKit, wagmi, or Reown Appkit, support EIP-6963. Here's how to connect with wagmi:

### Integration with RainbowKit

```typescript
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sophon, sophonTestnet } from "wagmi/chains";
import "@sophon-labs/account-eip6963/testnet";

export const config = getDefaultConfig({
  appName: "Your App",
  projectId: "YOUR_PROJECT_ID",
  chains: [sophon, sophonTestnet],
  ssr: true,
});
```

## API Reference

### Functions

- `createSophonEIP6963Emitter`: Creates and announces a Sophon wallet provider
  - Parameters:
    - `network`: 'mainnet' | 'testnet'
    - `uuidOverride?`: Optional custom UUID for the provider

## Dependencies

- @dynamic-labs/global-wallet-client
- @sophon-labs/account-core
