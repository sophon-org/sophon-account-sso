import { shortenAddress } from '@sophon-labs/account-core';
import {
  ConnectButton,
  useSophonAccount,
  useSophonClient,
  useSophonConsent,
} from '@sophon-labs/account-react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { parseEther } from 'viem';
import { sophonTestnet } from 'viem/chains';
import { nftAbi } from '@/abis/nft';
import { unverifiedAbi } from '@/abis/unverified';
import { verifiedAbi } from '@/abis/verified';
import JWTPanel from '@/components/me.panel';
import { SendContractButton } from '@/components/send-contract-button';
import { TestDashboard } from '@/components/test-dashboard';
import { TokenTransaction } from '@/components/token-transaction';
import { Button } from '@/components/ui/button';
import { UserBalance } from '@/components/user-balance';

export default function HomeScreen() {
  const { initialized, isConnected, account, logout } = useSophonAccount();

  useEffect(() => {}, [isConnected, initialized]);

  useEffect(() => {
    const unlockScreenOerientation = async () => {
      await ScreenOrientation.unlockAsync();
    };
    unlockScreenOerientation();
  }, []);

  const { walletClient } = useSophonClient();
  const [signature, setSignature] = useState<string>();
  const [typedDataSignature, setTypedDataSignature] = useState<string>();
  const [error, setError] = useState<string>('');
  const [showTestDashboard, setShowTestDashboard] = useState(false);
  const { requestConsent, hasConsent } = useSophonConsent();

  if (!initialized) {
    return (
      <View className="flex-1 items-center justify-center bg-white py-8 h-screen">
        <Text className="text-xl font-bold text-black">Initializing...</Text>
      </View>
    );
  }

  // If showing test dashboard, render it instead of the main screen
  if (showTestDashboard) {
    return (
      <View className="flex-1 bg-white">
        {/* Header with back button */}
        <View className="bg-gray-800 px-4 py-3 flex-row items-center justify-between">
          <Button
            onPress={() => setShowTestDashboard(false)}
            className="bg-violet-500/30 border border-violet-500/50"
          >
            <Text className="text-white">← Back</Text>
          </Button>
          <Text className="text-white text-lg font-semibold">Hook Testing</Text>
          <View className="w-16" />
        </View>
        <TestDashboard />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 4,
          backgroundColor: 'white',
        }}
      >
        {!isConnected && <ConnectButton />}
        {error && (
          <Text className="text-xl mt-2 font-bold text-red-500 p-2 mb-4 w-2/3 text-center">
            {error}
          </Text>
        )}
        {isConnected && (
          <>
            <Text className="text-xl font-bold text-black">
              {shortenAddress(account?.address)}
            </Text>
            <Button
              onPress={async () => {
                console.log('logging out', account?.address);
                await logout();
              }}
              className="mt-4 bg-red-500/90 w-full max-w-[80%]"
            >
              <Text className="text-white font-bold">Logout</Text>
            </Button>
          </>
        )}
        {isConnected && (
          <Button
            onPress={() => setShowTestDashboard(true)}
            className="mt-4 bg-violet-500/30 border border-violet-500/50 w-full max-w-[80%]"
          >
            <Text className="text-white font-bold">🧪 Test React Hooks</Text>
          </Button>
        )}
        {isConnected && (
          <View className="mt-4 w-full max-w-[80%]">
            <JWTPanel />
          </View>
        )}
        {isConnected && (
          <Button
            className="mt-4 bg-purple-500/90 w-full max-w-[80%]"
            onPress={async () => {
              try {
                setError('');
                const response = await requestConsent();
                console.log('consent', response);
              } catch (e: any) {
                setError(e.details ?? e.message);
              }
            }}
          >
            <Text className="text-xl font-bold text-white">📝 Consent</Text>
          </Button>
        )}
        {isConnected && (
          <Text className="text-xs my-4 text-black max-w-[80%]">
            {hasConsent ? 'Consent granted' : 'Consent denied'}
          </Text>
        )}
        {isConnected && (
          <>
            <Text className="text-left text-xl font-bold">Signatures</Text>
            <Button
              className="mt-4 bg-purple-500/90 w-full max-w-[80%]"
              onPress={async () => {
                try {
                  setError('');
                  const signature = await walletClient!.signMessage({
                    account: account!.address,
                    message: 'Hello from Sophon SSO!',
                  });
                  setSignature(signature);
                } catch (e: any) {
                  setError(e.details ?? e.message);
                }
              }}
            >
              <Text className="text font-bold text-white">✍️ Sign Message</Text>
            </Button>

            {signature && (
              <Text className="text-xs my-4 text-black max-w-[80%]">
                {signature ?? 'N/A'}
              </Text>
            )}
          </>
        )}

        {isConnected && (
          <>
            <Button
              className="mt-4 bg-purple-500/90 w-full max-w-[80%]"
              onPress={async () => {
                try {
                  setError('');
                  const signature = await walletClient!.signTypedData({
                    account: account!.address,
                    domain: {
                      name: 'Sophon SSO',
                      version: '1',
                      chainId: sophonTestnet.id,
                    },
                    types: {
                      Message: [
                        { name: 'content', type: 'string' },
                        { name: 'from', type: 'address' },
                        { name: 'timestamp', type: 'uint256' },
                      ],
                    },
                    primaryType: 'Message',
                    message: {
                      content: `Hello from Sophon SSO!\n\nThis message confirms you control this wallet.`,
                      from: account!.address,
                      timestamp: BigInt(Math.floor(Date.now() / 1000)),
                    },
                  });
                  setTypedDataSignature(signature);
                } catch (e: any) {
                  setError(e.details ?? e.message);
                }
              }}
            >
              <Text className="text-xl font-bold text-white">
                ✍️ Sign Typed Data
              </Text>
            </Button>

            {typedDataSignature && (
              <Text className="text-xs my-4 text-black max-w-[80%]">
                {typedDataSignature ?? 'N/A'}
              </Text>
            )}
          </>
        )}

        {isConnected ? <UserBalance /> : null}

        {isConnected ? <TokenTransaction /> : null}

        {isConnected && (
          <SendContractButton
            title="Mint NFT"
            transactionParams={{
              account: account!.address,
              address: '0x1A88CEB0Ef27383f4FB85231765AB8Cf7B27B99C', // MOCK NFT contract
              abi: nftAbi,
              functionName: 'mint',
              args: [account!.address as `0x${string}`],
            }}
          />
        )}

        {isConnected && (
          <SendContractButton
            title="Mint PAID NFT"
            transactionParams={{
              account: account!.address,
              address: '0x1A88CEB0Ef27383f4FB85231765AB8Cf7B27B99C', // MOCK NFT contract
              abi: nftAbi,
              functionName: 'paidMint',
              value: parseEther('1'),
              args: [account!.address as `0x${string}`],
            }}
          />
        )}

        {isConnected && (
          <SendContractButton
            title="Unverified"
            transactionParams={{
              account: account!.address,
              address: '0x0c76828A43556cAA48Fa687e540E6a76155d6850',
              abi: unverifiedAbi,
              functionName: 'setAll',
              args: ['anything', 100],
            }}
          />
        )}

        {isConnected && (
          <SendContractButton
            title="Verified Simple"
            transactionParams={{
              account: account!.address,
              address: '0xC0830ABFe9Ab55b476456f7cA13103c666be5502',
              abi: verifiedAbi,
              functionName: 'setString',
              args: ['Hello World'],
            }}
          />
        )}

        {isConnected && (
          <SendContractButton
            title="Verified Complex"
            transactionParams={{
              account: account!.address,
              address: '0xC0830ABFe9Ab55b476456f7cA13103c666be5502',
              abi: verifiedAbi,
              functionName: 'setStruct',
              args: [
                'another string',
                {
                  testString: 'Hello World',
                  testNumber: 0o020,
                  testAddress: '0x0000000000000000000000000000000000000000',
                  testBool: true,
                },
              ],
            }}
          />
        )}
      </View>
    </ScrollView>
  );
}
