# @sophon-labs/account-react-native

Library to handle sophon account on react native environments

## Installation

Before you start, you need these libraries:

```sh
# Expo packages
npx expo install expo-standard-web-crypto expo-crypto expo-network expo-secure-store expo-linking @react-native-async-storage/async-storage @gorhom/bottom-sheet react-native-gesture-handler react-native-reanimated react-native-svg
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

### Gesture Handler Setup

This library relies on **`react-native-gesture-handler`** for handling bottom sheets, swipe gestures, and modal transitions.
To ensure proper gesture functionality, your app must be wrapped in a [`GestureHandlerRootView`](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation#1-start-with-installing-the-package-from-npm).

If your app is **not already wrapped**, update your root component as shown below:

```tsx
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SophonContextProvider } from "@sophon-labs/account-react-native";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SophonContextProvider>{/* Your components*/}</SophonContextProvider>
    </GestureHandlerRootView>
  );
}
```

If your app **already uses `GestureHandlerRootView`** (for example, when using `@gorhom/bottom-sheet` or React Navigation), you **do not need to wrap it again**.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
