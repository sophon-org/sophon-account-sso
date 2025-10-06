import { shortenAddress } from '@sophon-labs/account-core';
import {
  useSophonAccount,
  useSophonClient,
} from '@sophon-labs/account-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  erc20Abi,
  parseEther,
  parseUnits,
  UserRejectedRequestError,
} from 'viem';
import { sophonTestnet } from 'viem/chains';
import { nftAbi } from '@/abis/nft';
import { unverifiedAbi } from '@/abis/unverified';
import { verifiedAbi } from '@/abis/verified';
import JWTPanel from '@/components/me.panel';
import { SendContractButton } from '@/components/send-contract-button';
import { TestDashboard } from '@/components/test-dashboard';
import { Button } from '@/components/ui/button';

export default function HomeScreen() {
  const { initialized, connect, isConnected, account, logout, isConnecting } =
    useSophonAccount();

  useEffect(() => {
    console.log('is connected', isConnected);
    console.log('is initialized', initialized);
  }, [isConnected, initialized]);

  const { walletClient } = useSophonClient();
  const [signature, setSignature] = useState<string>();
  const [typedDataSignature, setTypedDataSignature] = useState<string>();
  const [transaction, setTransaction] = useState<string>();
  const [error, setError] = useState<string>('');
  const [showTestDashboard, setShowTestDashboard] = useState(false);

  useEffect(() => {
    console.log('accountError', error);
  }, [error]);

  const handleAuthenticate = async () => {
    setError('');
    await connect().catch((e) => {
      console.log(e);
      if (e.code !== UserRejectedRequestError.code) {
        // non user rejected errors
        setError(e.details ?? e.message);
      }
    });
  };

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
    <ScrollView>
      <View className="flex-1 items-center justify-center bg-white py-8 h-screen">
        {!isConnected && (
          <Button onPress={handleAuthenticate} disabled={isConnecting}>
            <Text className="text-xl font-bold text-white">
              {isConnecting ? 'Connecting...' : 'Authenticate'}
            </Text>
          </Button>
        )}
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
              onPress={logout}
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
          <>
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
              <Text className="text-xl font-bold text-white">
                ✍️ Sign Message
              </Text>
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

        {isConnected && (
          <>
            <Button
              className="mt-4 bg-purple-500/90 w-full max-w-[80%]"
              onPress={async () => {
                try {
                  setError('');
                  const tx = await walletClient!.sendTransaction({
                    to: '0xC988e0b689898c3D1528182F6917b765aB6C469A',
                    value: parseEther('0.006'),
                    data: '0x',
                    account: account!.address,
                    chain: sophonTestnet,
                  });
                  setTransaction(tx);
                } catch (e: any) {
                  setError(e.details ?? e.message);
                }
              }}
            >
              <Text className="text-xl font-bold text-white">👑 Send SOPH</Text>
            </Button>

            {transaction && (
              <Text className="text-xs my-4 text-black max-w-[80%]">
                {transaction ?? 'N/A'}
              </Text>
            )}
          </>
        )}

        {isConnected && (
          <SendContractButton
            title="👑 Send 0.001 DTN"
            transactionParams={{
              account: account!.address,
              address: '0xE676a42fEd98d51336f02510bB5d598893AbfE90',
              abi: erc20Abi,
              functionName: 'transfer',
              args: [
                '0xC988e0b689898c3D1528182F6917b765aB6C469A',
                parseUnits('0.001', 18),
              ],
            }}
          />
        )}

        {isConnected && (
          <SendContractButton
            title="👑 Approve 0.001 DTN"
            transactionParams={{
              account: account!.address,
              address: '0xE676a42fEd98d51336f02510bB5d598893AbfE90',
              abi: erc20Abi,
              functionName: 'approve',
              args: [
                '0xC988e0b689898c3D1528182F6917b765aB6C469A',
                parseUnits('0.001', 18),
              ],
            }}
          />
        )}

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
