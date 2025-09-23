import {
  useGasEstimation,
  useSophonAccount,
} from '@sophon-labs/account-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { Button } from '../ui/button';

export const GasEstimation = () => {
  const { account } = useSophonAccount();
  const [hasData, setHasData] = useState(false);

  // Form state for config
  const [formData, setFormData] = useState({
    to: '0xE676a42fEd98d51336f02510bB5d598893AbfE90', // MOCK MintMe token
    data: '0xa9059cbb000000000000000000000000feb22da05537b4b63bb63417b10935819facb81c0000000000000000000000000000000000000000000000000de0b6b3a7640000', // transfer(address,uint256)
    value: '0', // ETH value to send
    chainId: 531050104, // Sophon Testnet
    enabled: false,
  });

  const config = useMemo(
    () => ({
      to: formData.to,
      from: account?.address,
      data: formData.data,
      value: BigInt(formData.value),
      chainId: formData.chainId,
      enabled: formData.enabled,
    }),
    [
      formData.to,
      formData.data,
      formData.value,
      formData.chainId,
      formData.enabled,
      account?.address,
    ],
  );

  const { gasEstimate, gasPrice, totalFeeEstimate, isLoading, error, refetch } =
    useGasEstimation(config);

  // Update hasData when we have meaningful data
  useEffect(() => {
    if (gasEstimate !== undefined || gasPrice !== undefined || error) {
      setHasData(true);
    }
  }, [gasEstimate, gasPrice, error]);

  const handleClearData = () => {
    setHasData(false);
    setFormData((prev) => ({ ...prev, enabled: false }));
  };

  const handleEstimate = () => {
    if (!account?.address) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }
    // Reset hasData to false when starting new estimation
    setHasData(false);
    setFormData((prev) => ({ ...prev, enabled: true }));
  };

  const handleRefetch = () => {
    refetch();
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Format gas values for display
  const formatGas = (value: bigint | undefined | null) => {
    if (!value) return '0';
    return value.toString();
  };

  const formatEther = (value: bigint | undefined | null) => {
    if (!value) return '0';
    // Convert wei to ether (divide by 10^18)
    const ether = Number(value) / Number(BigInt(10) ** BigInt(18));
    return ether.toFixed(8);
  };

  // Quick preset functions
  const setERC20Transfer = () => {
    setFormData((prev) => ({
      ...prev,
      to: '0xE676a42fEd98d51336f02510bB5d598893AbfE90',
      data: '0xa9059cbb000000000000000000000000feb22da05537b4b63bb63417b10935819facb81c0000000000000000000000000000000000000000000000000de0b6b3a7640000',
      value: '0',
    }));
  };

  const setSOPHTransfer = () => {
    setFormData((prev) => ({
      ...prev,
      to: '0xfeb22da05537b4b63bb63417b10935819facb81c',
      data: '0x',
      value: '1000000000000000000', // 1 SOPH
    }));
  };

  const setERC20Approve = () => {
    setFormData((prev) => ({
      ...prev,
      to: '0xE676a42fEd98d51336f02510bB5d598893AbfE90',
      data: '0x095ea7b3000000000000000000000000feb22da05537b4b63bb63417b10935819facb81cffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      value: '0',
    }));
  };

  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-black text-xl font-bold mb-4">Gas Estimation</Text>

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

          <Text className="text-sm text-gray-600 mb-1">To Address</Text>
          <TextInput
            value={formData.to}
            onChangeText={(text) => handleInputChange('to', text)}
            className="bg-white border border-gray-300 rounded p-2 mb-2 text-black font-mono text-xs"
            placeholder="0x..."
            multiline={true}
            numberOfLines={2}
          />

          <Text className="text-sm text-gray-600 mb-1">
            Transaction Data (hex)
          </Text>
          <TextInput
            value={formData.data}
            onChangeText={(text) => handleInputChange('data', text)}
            className="bg-white border border-gray-300 rounded p-2 mb-2 text-black font-mono text-xs"
            placeholder="0x..."
            multiline={true}
            numberOfLines={4}
          />

          <View className="flex-row space-x-2 mb-2">
            <View className="flex-1">
              <Text className="text-sm text-gray-600 mb-1">Value (wei)</Text>
              <TextInput
                value={formData.value}
                onChangeText={(text) => handleInputChange('value', text)}
                className="bg-white border border-gray-300 rounded p-2 text-black"
                placeholder="0"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-gray-600 mb-1">Chain ID</Text>
              <TextInput
                value={formData.chainId.toString()}
                onChangeText={(text) =>
                  handleInputChange(
                    'chainId',
                    Number.parseInt(text) || 531050104,
                  )
                }
                className="bg-white border border-gray-300 rounded p-2 text-black"
                keyboardType="numeric"
                placeholder="531050104"
              />
            </View>
          </View>
        </View>

        {/* Quick Presets */}
        <View className="mb-4 border-t border-gray-300 pt-4">
          <Text className="text-gray-700 font-medium mb-3">Quick Presets</Text>
          <View className="flex-row flex-wrap gap-2">
            <Button
              onPress={setERC20Transfer}
              className="bg-blue-600 px-3 py-1"
            >
              <Text className="text-white text-xs">ERC20 Transfer</Text>
            </Button>
            <Button
              onPress={setSOPHTransfer}
              className="bg-green-600 px-3 py-1"
            >
              <Text className="text-white text-xs">SOPH Transfer</Text>
            </Button>
            <Button
              onPress={setERC20Approve}
              className="bg-purple-600 px-3 py-1"
            >
              <Text className="text-white text-xs">ERC20 Approve</Text>
            </Button>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="mb-4 space-y-2">
        {!hasData ? (
          <Button
            onPress={handleEstimate}
            disabled={!account?.address}
            className="bg-blue-600 mb-2"
          >
            <Text className="text-white font-bold">
              {!account?.address ? 'Connect Wallet' : 'Estimate Gas'}
            </Text>
          </Button>
        ) : (
          <Button onPress={handleClearData} className="bg-gray-600 mb-2">
            <Text className="text-white font-bold">Clear Data</Text>
          </Button>
        )}

        <Button
          onPress={handleRefetch}
          disabled={!account?.address}
          className="bg-green-600 mb-2"
        >
          <Text className="text-white font-bold">Refresh Estimate</Text>
        </Button>
      </View>

      {/* Loading State */}
      {isLoading && (
        <View className="p-4 bg-blue-50 border border-blue-300 rounded mb-4">
          <Text className="text-blue-800">🔄 Estimating gas...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View className="p-4 bg-red-50 border border-red-300 rounded mb-4">
          <Text className="text-red-800">❌ Error: {error.message}</Text>
        </View>
      )}

      {/* Gas Estimation Results */}
      {hasData && !isLoading && (
        <View className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <Text className="text-xl font-semibold mb-3 text-gray-900">
            ⛽ Gas Estimation Results
          </Text>

          <View className="space-y-3">
            <View>
              <Text className="font-semibold text-gray-900">Gas Estimate:</Text>
              <Text className="ml-2 text-gray-800 font-mono">
                {formatGas(gasEstimate)} units
              </Text>
            </View>

            <View>
              <Text className="font-semibold text-gray-900">Gas Price:</Text>
              <Text className="ml-2 text-gray-800 font-mono">
                {formatGas(gasPrice)} wei
              </Text>
            </View>

            <View>
              <Text className="font-semibold text-gray-900">
                Total Fee Estimate:
              </Text>
              <View className="ml-2 space-y-1">
                <Text className="text-gray-800 font-mono">
                  {totalFeeEstimate?.toString() || '0'} wei
                </Text>
                <Text className="text-sm text-gray-600">
                  ≈ {totalFeeEstimate ? formatEther(totalFeeEstimate) : '0'} ETH
                </Text>
              </View>
            </View>

            <View className="mt-4 p-3 bg-white border rounded">
              <Text className="font-semibold text-gray-900 mb-2">
                Transaction Details:
              </Text>
              <View className="space-y-1 text-sm">
                <Text className="text-gray-800">
                  <Text className="font-medium">From:</Text>{' '}
                  <Text className="font-mono text-xs">
                    {account?.address || 'Not connected'}
                  </Text>
                </Text>
                <Text className="text-gray-800">
                  <Text className="font-medium">To:</Text>{' '}
                  <Text className="font-mono text-xs">{formData.to}</Text>
                </Text>
                <Text className="text-gray-800">
                  <Text className="font-medium">Value:</Text>{' '}
                  <Text className="font-mono">{formData.value} wei</Text>
                </Text>
                <Text className="text-gray-800">
                  <Text className="font-medium">Chain ID:</Text>{' '}
                  <Text className="font-mono">{formData.chainId}</Text>
                </Text>
                <Text className="text-gray-800">
                  <Text className="font-medium">Data:</Text>{' '}
                  <Text className="font-mono text-xs">
                    {formData.data || '0x (empty)'}
                  </Text>
                </Text>
              </View>
            </View>

            <View className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded">
              <Text className="font-semibold text-blue-800">
                ⚡ How it works
              </Text>
              <View className="text-blue-800 text-sm mt-1 space-y-1">
                <Text>• Estimates gas units needed for the transaction</Text>
                <Text>• Gets current network gas price</Text>
                <Text>• Calculates total transaction fee</Text>
                <Text>• Use presets for common transaction types</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};
