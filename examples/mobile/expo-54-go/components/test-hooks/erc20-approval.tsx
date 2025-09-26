import {
  useERC20Approval,
  useSophonAccount,
} from '@sophon-labs/account-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { Button } from '../ui/button';

export const ERC20Approval = () => {
  const { account } = useSophonAccount();
  const [hasData, setHasData] = useState(false);

  // Form state for config
  const [formData, setFormData] = useState({
    tokenAddress: '0xE676a42fEd98d51336f02510bB5d598893AbfE90', // MOCK MintMe token
    spender: '0xfeb22da05537b4b63bb63417b10935819facb81c', // Example 1inch router
    amount: '100000000000000000', // 0.1 (18 decimals)
    chainId: 531050104, // Sophon Testnet
  });

  const config = useMemo(
    () => ({
      tokenAddress: formData.tokenAddress,
      spender: formData.spender,
      amount: BigInt(formData.amount),
      chainId: formData.chainId,
    }),
    [formData],
  );

  const {
    isApproved,
    approve,
    isLoading,
    error,
    currentAllowance,
    approvalTxHash,
    isConfirmed,
    refetch,
  } = useERC20Approval(config);

  // Update hasData when we have meaningful data
  useEffect(() => {
    if (currentAllowance !== undefined || error) {
      setHasData(true);
    }
  }, [currentAllowance, error]);

  const handleClearData = () => {
    setHasData(false);
  };

  const handleCheckAllowance = () => {
    if (!account?.address) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }
    refetch();
  };

  const handleApprove = async () => {
    if (!account?.address) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    try {
      await approve();
      Alert.alert('Success', 'Approval transaction submitted!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Approval failed';
      Alert.alert('Error', message);
    }
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
        ERC20 Token Approval
      </Text>

      {/* Configuration Form */}
      <View className="bg-gray-100 rounded-lg p-4 mb-4">
        <Text className="text-black text-lg font-semibold mb-3">
          Configuration
        </Text>

        {/* Token Config */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Token Settings</Text>

          <Text className="text-sm text-gray-600 mb-1">Token Address</Text>
          <TextInput
            value={formData.tokenAddress}
            onChangeText={(text) => handleInputChange('tokenAddress', text)}
            className="bg-white border border-gray-300 rounded p-2 mb-2 text-black font-mono text-xs"
            placeholder="0x..."
            multiline={true}
            numberOfLines={2}
          />

          <Text className="text-sm text-gray-600 mb-1">Spender Address</Text>
          <TextInput
            value={formData.spender}
            onChangeText={(text) => handleInputChange('spender', text)}
            className="bg-white border border-gray-300 rounded p-2 mb-2 text-black font-mono text-xs"
            placeholder="0x..."
            multiline={true}
            numberOfLines={2}
          />
        </View>

        {/* Approval Config */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">
            Approval Settings
          </Text>

          <Text className="text-sm text-gray-600 mb-1">
            Amount (in token units)
          </Text>
          <TextInput
            value={formData.amount}
            onChangeText={(text) => handleInputChange('amount', text)}
            className="bg-white border border-gray-300 rounded p-2 mb-2 text-black"
            placeholder="100000000000000000"
          />

          <Text className="text-sm text-gray-600 mb-1">Chain ID</Text>
          <TextInput
            value={formData.chainId.toString()}
            onChangeText={(text) =>
              handleInputChange('chainId', Number.parseInt(text) || 531050104)
            }
            className="bg-white border border-gray-300 rounded p-2 mb-2 text-black"
            keyboardType="numeric"
            placeholder="531050104"
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View className="mb-4 space-y-2">
        <Button
          onPress={handleCheckAllowance}
          disabled={!account?.address || isLoading}
          className="bg-blue-600 mb-2"
        >
          <Text className="text-white font-bold">Check Allowance</Text>
        </Button>

        <Button
          onPress={handleApprove}
          disabled={!account?.address || isLoading || isApproved}
          className="bg-green-600 mb-2"
        >
          <Text className="text-white font-bold">
            {isApproved ? 'Already Approved' : 'Approve'}
          </Text>
        </Button>

        {hasData && (
          <Button onPress={handleClearData} className="bg-gray-600 mb-2">
            <Text className="text-white font-bold">Clear Data</Text>
          </Button>
        )}
      </View>

      {/* Loading State */}
      {isLoading && (
        <View className="p-4 bg-blue-50 border border-blue-300 rounded mb-4">
          <Text className="text-blue-800">
            🔄 {isApproved ? 'Processing approval...' : 'Loading...'}
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View className="p-4 bg-red-50 border border-red-300 rounded mb-4">
          <Text className="text-red-800">❌ Error: {error.message}</Text>
        </View>
      )}

      {/* Approval Status */}
      {hasData && !isLoading && (
        <View className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <Text className="text-xl font-semibold mb-3 text-gray-900">
            🔐 ERC20 Approval Status
          </Text>

          <View className="space-y-3">
            <View>
              <Text className="font-semibold text-gray-900">
                Approval Status:
              </Text>
              <Text
                className={`ml-2 ${
                  isApproved ? 'text-green-600' : 'text-orange-600'
                }`}
              >
                {isApproved ? '✅ Approved' : '⚠️ Insufficient Allowance'}
              </Text>
            </View>

            <View>
              <Text className="font-semibold text-gray-900">
                Current Allowance:
              </Text>
              <Text className="ml-2 text-gray-800 font-mono">
                {currentAllowance?.toString() || '0'}
              </Text>
            </View>

            <View>
              <Text className="font-semibold text-gray-900">
                Required Amount:
              </Text>
              <Text className="ml-2 text-gray-800 font-mono">
                {formData.amount}
              </Text>
            </View>

            <View>
              <Text className="font-semibold text-gray-900">
                Token Address:
              </Text>
              <Text className="ml-2 text-gray-800 font-mono text-xs">
                {formData.tokenAddress}
              </Text>
            </View>

            <View>
              <Text className="font-semibold text-gray-900">
                Spender Address:
              </Text>
              <Text className="ml-2 text-gray-800 font-mono text-xs">
                {formData.spender}
              </Text>
            </View>

            {approvalTxHash && (
              <View>
                <Text className="font-semibold text-gray-900">
                  Transaction Hash:
                </Text>
                <Text className="ml-2 text-gray-800 font-mono text-xs">
                  {approvalTxHash}
                </Text>
                <Text
                  className={`ml-2 text-sm ${
                    isConfirmed ? 'text-green-600' : 'text-orange-600'
                  }`}
                >
                  {isConfirmed ? '✅ Confirmed' : '⏳ Pending'}
                </Text>
              </View>
            )}

            <View className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded">
              <Text className="font-semibold text-blue-800">
                🔧 How it works
              </Text>
              <View className="text-blue-800 text-sm mt-1 space-y-1">
                <Text>
                  • Check current allowance for the token/spender pair
                </Text>
                <Text>
                  • If insufficient, click &quot;Approve&quot; to grant
                  permission
                </Text>
                <Text>• Monitor transaction confirmation status</Text>
                <Text>• Refresh to see updated allowance</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};
