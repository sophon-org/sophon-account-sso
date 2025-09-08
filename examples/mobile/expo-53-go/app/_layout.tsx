// import { polyfillWebCrypto } from 'expo-standard-web-crypto';
// import 'text-encoding-polyfill';
// import { randomUUID } from 'expo-crypto';

// polyfillWebCrypto();
// // @ts-ignore
// crypto.randomUUID = randomUUID;
// //

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import './global.css';

import { ThemeProvider } from '@/lib/theme-context';
import { Web3Provider } from '@/providers/Web3Provider';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <Web3Provider>
      <ThemeProvider defaultTheme="system">
        <Stack>
          <Stack.Screen name="(screens)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </Web3Provider>
  );
}
