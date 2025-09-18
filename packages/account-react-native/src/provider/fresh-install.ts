import AsyncStorage from '@react-native-async-storage/async-storage';
import { SophonAppStorage } from './storage';

export async function freshInstallActions() {
  const firstLaunch = await AsyncStorage.getItem('appHasBeenLaunched');
  if (!firstLaunch) {
    console.log('✅ Fresh install, cleaning storage');
    // First launch after a possible uninstall or fresh install
    // You would need to get a list of your keys or clear them all
    SophonAppStorage.clear();
    // Set the flag to prevent clearing on subsequent launches
    await AsyncStorage.setItem('appHasBeenLaunched', 'true');
  } else {
    console.log('❌ Not fresh install, skipping storage cleanup');
  }
}
