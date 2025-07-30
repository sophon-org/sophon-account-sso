<p align="center">
    <img width="200" src="https://portal.sophon.xyz/img/logo-sophon.svg" alt="Sophon Logo">
</p>

# Sophon SDK

The Sophon SDK provides tools and interfaces to integrate Sophon Global Wallet into your applications. This SDK is designed to work with modern web applications and follows Ethereum standards for wallet integration.

## Receiving a Partner ID

Local development does not require a separate partner ID, you can use the default one `123b216c-678e-4611-af9a-2d5b7b061258`. For production, you will need to receive a partner ID from us. Please reach out to us to get a partner ID via dropping a mail to [product@sophon.xyz](mailto:product@sophon.xyz).

## Motivation

The Sophon SDK addresses several key challenges in blockchain application development:

1. **Seamless Wallet Integration**: Provides a standardized way to integrate with the Sophon wallet without complex configuration
2. **EIP Standards Compliance**: Follows Ethereum Improvement Proposals (EIPs) to ensure compatibility with the ecosystem
3. **Multi-Wallet Support**: Implements EIP-6963 for better multi-wallet discovery and interaction
4. **Developer Experience**: Simplifies the wallet connection process to let developers focus on building their applications

## Packages

The SDK is organized into the following packages:

### @sophon/wallet

Core wallet functionality that implements the Ethereum Provider API (EIP-1193). This package provides the basic wallet interface for interacting with the Sophon ecosystem.

### @sophon/eip6963

Implementation of the EIP-6963 standard (Multi Injected Provider Discovery) for Sophon wallet. This enables applications to discover the Sophon wallet alongside other wallets in a standardized way.

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

To integrate the Sophon wallet with EIP-6963 support in your project:

```bash
# Using npm
npm install @sophon/eip6963

# Using yarn
yarn add @sophon/eip6963
```

## Using the EIP-6963 Package

EIP-6963 is a standard that allows multiple Ethereum wallet providers to be discovered on a web page without conflicting with each other, unlike the traditional `window.ethereum` approach.

### Basic Integration

1. Import and initialize the EIP-6963 emitter in your application entry point:

```javascript
import "@sophon/eip6963";

// The Sophon wallet will now announce itself via the EIP-6963 protocol
// No additional setup is required
```

This will automatically:

- Register the Sophon wallet provider
- Announce it through the EIP-6963 events
- Make it available to EIP-6963 compatible applications

### Working with Wallet Connection Libraries

Most modern wallet connection libraries, like RainbowKit, wagmi, or Reown Appkit, support EIP-6963. Here's how to connect with wagmi:

```javascript
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sophonTestnet, sophon } from "wagmi/chains";
import "@sophon/eip6963"; // Import to announce the Sophon provider

export const config = getDefaultConfig({
  appName: "Your Application",
  projectId: "YOUR_PROJECT_ID",
  chains: [sophon, sophonTestnet],
  ssr: true,
});
```

With this setup, the Sophon wallet will appear in the wallet selection UI provided by RainbowKit.

### Manual EIP-6963 Integration

If you're building your own wallet connection UI or need more control, you can manually interact with the EIP-6963 protocol:

```javascript
// Import the EIP-6963 package to announce the Sophon provider
import "@sophon/eip6963";

// Request all available providers
const providers = [];

// Listen for provider announcements
window.addEventListener("eip6963:announceProvider", (event) => {
  const providerDetail = event.detail;
  providers.push(providerDetail);

  // Check if this is the Sophon wallet
  if (providerDetail.info.rdns === "com.sophon.wallet") {
    // Use the Sophon wallet provider
    const sophonProvider = providerDetail.provider;

    // Now you can use the provider for transactions, signing, etc.
    // Example: Request accounts
    sophonProvider.request({ method: "eth_requestAccounts" }).then((accounts) => {
      console.log("Connected accounts:", accounts);
    });
  }
});

// Request providers to announce themselves
window.dispatchEvent(new Event("eip6963:requestProvider"));
```

## Technical Details

### EIP-1193 Compliance

The Sophon wallet implements the Ethereum Provider JavaScript API (EIP-1193), which defines a standard interface for Ethereum providers. This ensures compatibility with existing tools and libraries in the Ethereum ecosystem.

### EIP-6963 Implementation

The `@sophon/eip6963` package implements the Multi Injected Provider Discovery specification, which:

1. Announces the Sophon wallet provider through window events
2. Provides wallet metadata (name, icon, RDNS identifier)
3. Returns a compliant EIP-1193 provider interface
4. Responds to provider discovery requests

## Examples

See the `examples/rainbow-wagmi` directory for a complete example of integrating the Sophon wallet with RainbowKit and wagmi.

## License

[MIT License](LICENSE)
