import {
  TransactionType,
  useGetSwapTransaction,
  useSophonAccount,
} from '@sophon-labs/account-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { Button } from '../ui/button';

export const GetSwapTransaction = () => {
  const { account } = useSophonAccount();
  const [enabled, setEnabled] = useState(false);
  const [hasData, setHasData] = useState(false);

  // Form state for config
  const [formData, setFormData] = useState({
    sender: account?.address || '',
    sourceChain: 1,
    destinationChain: 8453,
    sourceToken: '0x0000000000000000000000000000000000000000',
    destinationToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    amount: '1000000000000000000',
    slippage: 0.5,
    baseUrl: 'http://localhost:4001',
  });

  // Update sender when account changes
  useEffect(() => {
    if (account?.address) {
      setFormData((prev) => ({ ...prev, sender: account.address }));
    }
  }, [account?.address]);

  const config = useMemo(
    () => ({
      actionType: TransactionType.SWAP,
      sender: formData.sender,
      sourceChain: formData.sourceChain,
      destinationChain: formData.destinationChain,
      sourceToken: formData.sourceToken,
      destinationToken: formData.destinationToken,
      amount: BigInt(formData.amount),
      slippage: formData.slippage,
    }),
    [formData],
  );

  const apiConfig = useMemo(
    () => ({
      baseUrl: formData.baseUrl,
    }),
    [formData.baseUrl],
  );

  const { data, isLoading, error } = useGetSwapTransaction(
    { config, enabled },
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
      Alert.alert('Error', 'Please connect your wallet first');
      return;
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
        Get Swap Transaction
      </Text>

      {/* Configuration Form */}
      <View className="bg-gray-100 rounded-lg p-4 mb-4">
        <Text className="text-black text-lg font-semibold mb-3">
          Configuration
        </Text>

        {/* Transaction Config */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">
            Transaction Settings
          </Text>

          <Text className="text-sm text-gray-600 mb-1">Source Chain</Text>
          <TextInput
            value={formData.sourceChain.toString()}
            onChangeText={(text) =>
              handleInputChange('sourceChain', Number.parseInt(text) || 1)
            }
            className="bg-white border border-gray-300 rounded p-2 mb-2 text-black"
            keyboardType="numeric"
            placeholder="1"
          />

          <Text className="text-sm text-gray-600 mb-1">Destination Chain</Text>
          <TextInput
            value={formData.destinationChain.toString()}
            onChangeText={(text) =>
              handleInputChange(
                'destinationChain',
                Number.parseInt(text) || 8453,
              )
            }
            className="bg-white border border-gray-300 rounded p-2 mb-2 text-black"
            keyboardType="numeric"
            placeholder="8453"
          />

          <Text className="text-sm text-gray-600 mb-1">Source Token</Text>
          <TextInput
            value={formData.sourceToken}
            onChangeText={(text) => handleInputChange('sourceToken', text)}
            className="bg-white border border-gray-300 rounded p-2 mb-2 text-black font-mono text-xs"
            placeholder="0x..."
          />

          <Text className="text-sm text-gray-600 mb-1">Destination Token</Text>
          <TextInput
            value={formData.destinationToken}
            onChangeText={(text) => handleInputChange('destinationToken', text)}
            className="bg-white border border-gray-300 rounded p-2 mb-2 text-black font-mono text-xs"
            placeholder="0x..."
          />

          <Text className="text-sm text-gray-600 mb-1">Amount (wei)</Text>
          <TextInput
            value={formData.amount}
            onChangeText={(text) => handleInputChange('amount', text)}
            className="bg-white border border-gray-300 rounded p-2 mb-2 text-black"
            placeholder="1000000000000000000"
          />

          <Text className="text-sm text-gray-600 mb-1">Slippage (%)</Text>
          <TextInput
            value={formData.slippage.toString()}
            onChangeText={(text) =>
              handleInputChange('slippage', Number.parseFloat(text) || 0.5)
            }
            className="bg-white border border-gray-300 rounded p-2 mb-2 text-black"
            keyboardType="numeric"
            placeholder="0.5"
          />

          <Text className="text-sm text-gray-600 mb-1">Base URL</Text>
          <TextInput
            value={formData.baseUrl}
            onChangeText={(text) => handleInputChange('baseUrl', text)}
            className="bg-white border border-gray-300 rounded p-2 mb-2 text-black"
            placeholder="http://localhost:4001"
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
          <Text className="text-blue-800">🔄 Loading swap transaction...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View className="p-4 bg-red-50 border border-red-300 rounded mb-4">
          <Text className="text-red-800">❌ Error: {error.message}</Text>
        </View>
      )}

      {/* Transaction Data */}
      {hasData && data && (
        <View className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <Text className="text-xl font-semibold mb-3 text-gray-900">
            🔄 Swap Transaction Data
          </Text>

          <View className="space-y-3">
            <View>
              <Text className="font-semibold text-gray-900">
                Transaction ID:
              </Text>
              <Text className="text-gray-800 font-mono text-xs mt-1">
                {data.transactionId}
              </Text>
            </View>

            <View>
              <Text className="font-semibold text-gray-900">Provider:</Text>
              <Text className="text-gray-800 ml-2">{data.provider}</Text>
            </View>

            <View>
              <Text className="font-semibold text-gray-900">
                Exchange Rate:
              </Text>
              <Text className="text-gray-800 ml-2">{data.exchangeRate}</Text>
            </View>

            <View>
              <Text className="font-semibold text-gray-900">
                Estimated Time:
              </Text>
              <Text className="text-gray-800 ml-2">{data.estimatedTime}</Text>
            </View>

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

            {data.transaction && (
              <View>
                <Text className="font-semibold text-gray-900">
                  Transaction:
                </Text>
                <View className="bg-white p-3 rounded border mt-2">
                  <Text className="text-gray-800 mb-1">
                    <Text className="font-semibold">To:</Text>{' '}
                    {data.transaction.to}
                  </Text>
                  <Text className="text-gray-800 mb-1">
                    <Text className="font-semibold">Value:</Text>{' '}
                    {data.transaction.value}
                  </Text>
                  <Text className="text-gray-800 mb-1">
                    <Text className="font-semibold">Chain ID:</Text>{' '}
                    {data.transaction.chainId}
                  </Text>
                  <Text className="text-gray-800">
                    <Text className="font-semibold">Data:</Text>{' '}
                    {data.transaction.data.substring(0, 20)}...
                  </Text>
                </View>
              </View>
            )}

            {data.requiredApprovals && data.requiredApprovals.length > 0 && (
              <View>
                <Text className="font-semibold text-gray-900">
                  Required Approvals:
                </Text>
                <View className="ml-3 mt-2">
                  {data.requiredApprovals.map(
                    (approval: any, approvalIndex: number) => (
                      <View
                        key={`approval-${approvalIndex}-${approval.token}`}
                        className="mb-2"
                      >
                        <Text className="text-gray-800">
                          • Token: {approval.token}
                        </Text>
                        <Text className="text-gray-800">
                          {' '}
                          Spender: {approval.spender}
                        </Text>
                        <Text className="text-gray-800">
                          {' '}
                          Amount: {approval.amount}
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              </View>
            )}

            <View className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded">
              <Text className="font-semibold text-blue-800">
                📈 Ready to Execute
              </Text>
              <Text className="text-blue-800 text-sm mt-1">
                Transaction data prepared successfully. You can now use this
                data to execute the swap.
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};
