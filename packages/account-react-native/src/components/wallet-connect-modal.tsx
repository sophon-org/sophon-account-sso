import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSophonContext } from '../hooks';
import { SUPPORTED_WALLETS, type WalletOption } from '../lib/wallet-options';
import { useThemeColors } from '../ui';

const INSTALLED_WALLETS_KEY = '@sophon:installed_wallets';

interface WalletConnectModalProps {
  visible: boolean;
  onClose: () => void;
}

export const WalletConnectModal = ({
  visible,
  onClose,
}: WalletConnectModalProps) => {
  const colors = useThemeColors();
  const { wcProvider } = useSophonContext();
  const [wcUri, setWcUri] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [installedWallets, setInstalledWallets] = useState<Set<string>>(
    new Set(),
  );

  // Listen for WalletConnect URI
  useEffect(() => {
    if (!wcProvider) return;

    const handleDisplayUri = (uri: string) => {
      console.log('🔗 WalletConnect URI generated:', uri);
      setWcUri(uri);
    };

    wcProvider.on('display_uri', handleDisplayUri);

    return () => {
      wcProvider.off('display_uri', handleDisplayUri);
    };
  }, [wcProvider]);

  // Load previously successful wallets from storage
  useEffect(() => {
    const loadInstalledWallets = async () => {
      try {
        const stored = await AsyncStorage.getItem(INSTALLED_WALLETS_KEY);
        if (stored) {
          const walletIds = JSON.parse(stored);
          setInstalledWallets(new Set(walletIds));
          console.log('📱 Previously used wallets:', walletIds);
        } else {
          console.log('📱 No previously used wallets found');
        }
      } catch (error) {
        console.error('Failed to load installed wallets:', error);
      }
    };

    if (visible) {
      loadInstalledWallets();
    }
  }, [visible]);

  // Mark wallet as installed when successfully opened
  const markWalletAsInstalled = async (walletId: string) => {
    try {
      const newInstalled = new Set(installedWallets);
      newInstalled.add(walletId);
      setInstalledWallets(newInstalled);

      await AsyncStorage.setItem(
        INSTALLED_WALLETS_KEY,
        JSON.stringify(Array.from(newInstalled)),
      );
      console.log(
        `✅ Marked ${walletId} as installed. Total: ${newInstalled.size}`,
      );
    } catch (error) {
      console.error('Failed to save installed wallet:', error);
    }
  };

  // Sort wallets: installed first, then by original order
  const sortedWallets = [...SUPPORTED_WALLETS].sort((a, b) => {
    const aInstalled = installedWallets.has(a.id);
    const bInstalled = installedWallets.has(b.id);

    if (aInstalled && !bInstalled) return -1;
    if (!aInstalled && bInstalled) return 1;
    return 0;
  });

  const handleWalletPress = useCallback(
    async (wallet: WalletOption) => {
      if (!wcUri) {
        Alert.alert('Error', 'Connection not ready. Please try again.');
        return;
      }

      try {
        setConnecting(true);
        setConnectingWallet(wallet.id);

        const encodedUri = encodeURIComponent(wcUri);
        let walletOpened = false;

        // Try universal link first (opens App Store if not installed)
        if (wallet.universalLink) {
          const url = `${wallet.universalLink}?uri=${encodedUri}`;
          console.log(`🔗 Trying universal link for ${wallet.name}:`, url);

          try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
              await Linking.openURL(url);
              console.log(`✅ Opened ${wallet.name} via universal link`);
              walletOpened = true;

              // Only mark as installed if it's a deep link that worked
              // Universal links might just open a website
            }
          } catch (universalError) {
            console.log(`⚠️ Universal link failed for ${wallet.name}`);
          }
        }

        // Try deep link if universal link didn't work
        if (!walletOpened) {
          const deepLinkUrl = `${wallet.deepLink}?uri=${encodedUri}`;
          console.log(`🔗 Trying deep link for ${wallet.name}:`, deepLinkUrl);

          try {
            await Linking.openURL(deepLinkUrl);
            console.log(`✅ Opened ${wallet.name} via deep link`);
            walletOpened = true;

            // Mark as installed since deep link worked
            await markWalletAsInstalled(wallet.id);
          } catch (deepLinkError) {
            console.log(`❌ Deep link failed for ${wallet.name}`);
          }
        }

        // If neither worked, show App Store prompt
        if (!walletOpened) {
          throw new Error('Wallet not installed');
        }
      } catch (error: any) {
        console.log(`ℹ️ ${wallet.name} is not installed`);

        Alert.alert(
          `${wallet.name} not installed`,
          `Please install ${wallet.name} from the App Store to continue.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open App Store',
              onPress: () => {
                Linking.openURL(wallet.appStoreUrl);
              },
            },
          ],
        );
      } finally {
        setConnecting(false);
        setConnectingWallet(null);
      }
    },
    [wcUri, installedWallets],
  );

  const renderWalletItem = useCallback(
    ({ item }: { item: WalletOption }) => {
      const isInstalled = installedWallets.has(item.id);

      return (
        <TouchableOpacity
          style={[styles.walletItem, { borderColor: colors.gray[700] }]}
          onPress={() => handleWalletPress(item)}
          disabled={connecting}
        >
          <View style={styles.walletInfo}>
            <Text style={styles.walletIcon}>{item.icon}</Text>
            <Text style={[styles.walletName, { color: colors.text.primary }]}>
              {item.name}
            </Text>
          </View>

          <View style={styles.rightSection}>
            {isInstalled && (
              <Text style={styles.installedBadge}>Installed</Text>
            )}
            {connecting && connectingWallet === item.id && (
              <ActivityIndicator
                size="small"
                color={colors.text.secondary}
                style={styles.spinner}
              />
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [handleWalletPress, connecting, connectingWallet, colors, installedWallets],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.background.primary },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Connect Wallet
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text
                style={[styles.closeText, { color: colors.text.secondary }]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {!wcUri ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.text.primary} />
              <Text
                style={[styles.loadingText, { color: colors.text.secondary }]}
              >
                Preparing connection...
              </Text>
            </View>
          ) : (
            <FlatList
              data={sortedWallets}
              renderItem={renderWalletItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.walletList}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 24,
    fontWeight: '300',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  walletList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  walletInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  installedBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  spinner: {
    marginLeft: 8,
  },
});
