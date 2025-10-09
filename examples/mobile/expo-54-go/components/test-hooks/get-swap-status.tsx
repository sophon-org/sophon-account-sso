import {
  useGetSwapStatus,
  useSophonAccount,
} from '@sophon-labs/account-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { Button } from '../ui/button';

export const GetSwapStatus = () => {
  const { account } = useSophonAccount();
  const [enabled, setEnabled] = useState(false);
  const [hasData, setHasData] = useState(false);

  // Form state for config
  const [formData, setFormData] = useState({
    txHash:
      '0xd56968cf4fede6a0773f3e6dfad7d1088aacd3994bada55d44faee9596dadff2',
    chainId: 10,
    refetchInterval: 0,
    baseUrl: 'http://localhost:4001',
  });

  const apiConfig = useMemo(
    () => ({
      baseUrl: formData.baseUrl,
    }),
    [formData.baseUrl],
  );

  const { data, isLoading, error } = useGetSwapStatus(
    {
      txHash: formData.txHash,
      chainId: formData.chainId,
      enabled: enabled,
      refetchInterval: formData.refetchInterval,
    },
    apiConfig,
  );

  // Update hasData when we receive data
  useEffect(() => {
    if (data) {
      setHasData(true);
      setEnabled(false); // Stop fetching once we have data
    }
  }, [data]);

  const handleClearData = () => {
    setHasData(false);
    setEnabled(false);
  };

  const handleEnable = () => {
    if (!account?.address) {
      Alert.alert(
        'Info',
        'You can check transaction status without connecting wallet',
      );
    }
    setEnabled(true);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-black text-xl font-bold mb-4">
        Get Swap Transaction Status
      </Text>

      {/* Configuration Form */}
      <View className="bg-gray-100 rounded-lg p-4 mb-4">
        <Text className="text-black text-lg font-semibold mb-3">
          Configuration
        </Text>

        {/* API Config */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">API Settings</Text>

          <Text className="text-sm text-gray-600 mb-1">Base URL</Text>
          <TextInput
            value={formData.baseUrl}
            onChangeText={(text) => handleInputChange('baseUrl', text)}
            className="bg-white border border-gray-300 rounded p-2 mb-2 text-black"
            placeholder="http://localhost:4001"
          />
        </View>

        {/* Status Config */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">
            Status Settings
          </Text>

          <Text className="text-sm text-gray-600 mb-1">Transaction Hash</Text>
          <TextInput
            value={formData.txHash}
            onChangeText={(text) => handleInputChange('txHash', text)}
            className="bg-white border border-gray-300 rounded p-2 mb-2 text-black font-mono text-xs"
            placeholder="0x..."
            multiline={true}
            numberOfLines={2}
          />

          <Text className="text-sm text-gray-600 mb-1">
            Chain ID (Optional)
          </Text>
          <TextInput
            value={formData.chainId.toString()}
            onChangeText={(text) =>
              handleInputChange('chainId', Number.parseInt(text) || 10)
            }
            className="bg-white border border-gray-300 rounded p-2 mb-2 text-black"
            keyboardType="numeric"
            placeholder="10"
          />

          <Text className="text-sm text-gray-600 mb-1">
            Polling Interval (ms, 0 = no polling)
          </Text>
          <TextInput
            value={formData.refetchInterval.toString()}
            onChangeText={(text) =>
              handleInputChange('refetchInterval', Number.parseInt(text) || 0)
            }
            className="bg-white border border-gray-300 rounded p-2 mb-2 text-black"
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View className="mb-4">
        {!hasData ? (
          <Button onPress={handleEnable} className="bg-blue-600 mb-2">
            <Text className="text-white font-bold">Enable</Text>
          </Button>
        ) : (
          <Button onPress={handleClearData} className="bg-gray-600 mb-2">
            <Text className="text-white font-bold">Clear Data</Text>
          </Button>
        )}
      </View>

      {/* Loading State */}
      {isLoading && (
        <View className="p-4 bg-blue-50 border border-blue-300 rounded mb-4">
          <Text className="text-blue-800">
            🔄 Loading transaction status...
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View className="p-4 bg-red-50 border border-red-300 rounded mb-4">
          <Text className="text-red-800">❌ Error: {error.message}</Text>
        </View>
      )}

      {/* Transaction Status Data */}
      {hasData && data && (
        <View className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <Text className="text-xl font-semibold mb-3 text-gray-900">
            📊 Transaction Status
          </Text>

          <View className="space-y-3">
            <View>
              <Text className="font-semibold text-gray-900">Found:</Text>
              <Text
                className={`ml-2 ${
                  data.found ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {data.found ? '✅ Yes' : '❌ No'}
              </Text>
            </View>

            <View>
              <Text className="font-semibold text-gray-900">Status:</Text>
              <Text className="ml-2 text-gray-800">{data.status}</Text>
            </View>

            <View>
              <Text className="font-semibold text-gray-900">Provider:</Text>
              <Text className="ml-2 text-gray-800">{data.provider}</Text>
            </View>

            {data.transaction && (
              <View>
                <Text className="font-semibold text-gray-900">
                  Transaction Details:
                </Text>
                <View className="bg-white p-3 rounded border mt-2">
                  <Text className="text-gray-800 mb-1">
                    <Text className="font-semibold">Hash:</Text>{' '}
                    <Text className="font-mono text-xs">
                      {data.transaction.hash}
                    </Text>
                  </Text>
                  <Text className="text-gray-800 mb-1">
                    <Text className="font-semibold">Source Chain:</Text>{' '}
                    {data.transaction.sourceChain}
                  </Text>
                  <Text className="text-gray-800 mb-1">
                    <Text className="font-semibold">Destination Chain:</Text>{' '}
                    {data.transaction.destinationChain}
                  </Text>
                  <Text className="text-gray-800 mb-1">
                    <Text className="font-semibold">Amount:</Text>{' '}
                    {data.transaction.amount}
                  </Text>
                  {data.transaction.recipient && (
                    <Text className="text-gray-800">
                      <Text className="font-semibold">Recipient:</Text>{' '}
                      <Text className="font-mono text-xs">
                        {data.transaction.recipient}
                      </Text>
                    </Text>
                  )}
                </View>
              </View>
            )}

            {data.fees && (
              <View>
                <Text className="font-semibold text-gray-900">Fees:</Text>
                <View className="ml-3 mt-2">
                  <Text className="text-gray-800">
                    • Gas Fee: {data.fees.gas}
                  </Text>
                  <Text className="text-gray-800">
                    • Protocol Fee: {data.fees.protocol}
                  </Text>
                  <Text className="text-gray-800">
                    • Total Fees: {data.fees.total}
                  </Text>
                </View>
              </View>
            )}

            {data.timestamps && (
              <View>
                <Text className="font-semibold text-gray-900">Timestamps:</Text>
                <View className="ml-3 mt-2">
                  {data.timestamps.initiated && (
                    <Text className="text-gray-800">
                      • Initiated:{' '}
                      {new Date(data.timestamps.initiated).toLocaleString()}
                    </Text>
                  )}
                  {data.timestamps.confirmed && (
                    <Text className="text-gray-800">
                      • Confirmed:{' '}
                      {new Date(data.timestamps.confirmed).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {data.links && (
              <View>
                <Text className="font-semibold text-gray-900">Links:</Text>
                <View className="ml-3 mt-2">
                  {data.links.explorer && (
                    <Text className="text-gray-800">
                      • Explorer: {data.links.explorer}
                    </Text>
                  )}
                  {data.links.providerTracker && (
                    <Text className="text-gray-800">
                      • Provider Tracker: {data.links.providerTracker}
                    </Text>
                  )}
                </View>
              </View>
            )}

            <View className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded">
              <Text className="font-semibold text-blue-800">
                📈 Status Tracking
              </Text>
              <Text className="text-blue-800 text-sm mt-1">
                Transaction status retrieved successfully from the swap
                provider.
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};
