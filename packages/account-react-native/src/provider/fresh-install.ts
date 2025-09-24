import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendUIMessage } from '../messaging';
import { SophonAppStorage } from './storage';

export const isFreshInstall = async () => {
  const firstLaunch = await AsyncStorage.getItem('appHasBeenLaunched');
  return !firstLaunch;
};

export async function freshInstallActions() {
  const freshInstall = await isFreshInstall();
  if (freshInstall) {
    console.log('✅ Fresh install, cleaning storage');
    // First launch after a possible uninstall or fresh install
    // You would need to get a list of your keys or clear them all
    sendUIMessage('clearMainViewCache', {});
    SophonAppStorage.clear();
    // Set the flag to prevent clearing on subsequent launches
    await AsyncStorage.setItem('appHasBeenLaunched', 'true');
  } else {
    console.log('❌ Not fresh install, skipping storage cleanup');
  }
  sendUIMessage('initialized', {});
}
