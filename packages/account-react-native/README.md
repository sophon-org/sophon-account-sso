# @sophon-labs/account-react-native

Library to handle sophon account on react native environments

## Installation

Before you start, you need these libraries:

```sh
# Passkey requirements
npm install @simplewebauthn/browser @simplewebauthn/server

# Pollyfills
npm install expo-crypto expo-standard-web-crypto react-native-url-polyfill text-encoding-polyfill

# Overall native requirements
npm install expo-network react-native-mmkv react-native-webview
```

After that, you are ready to install our SDK:

```sh
# Sophon Library
npm install @sophon-labs/account-react-native
```

## Usage

Before anything, you need to wrap your application with `SophonContextProvider`, that will store context information about the accoint and walletClient connection.

```ts
import { SophonContextProvider } from "@sophon-labs/account-react-native";

export default function RootLayout() {
  // ...

  return <SophonContextProvider network="testnet">{/* Your components*/}</SophonContextProvider>;
}
```

With that ready, you can now use our hooks to interact with Sophon.

```ts
import { useSophonAccount } from "@sophon-labs/account-react-native";

export default function YourComponent() {
  const { connect, account } = useSophonAccount();
  // ...
}
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
