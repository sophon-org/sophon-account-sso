// Import polyfills FIRST before any other imports
import '@sophon-labs/account-react-native/src/pollyfills';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import './global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Web3Provider>
        <ThemeProvider defaultTheme="system">
          <Stack>
            <Stack.Screen name="(screens)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </Web3Provider>
    </GestureHandlerRootView>
  );
}
