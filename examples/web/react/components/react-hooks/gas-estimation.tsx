import { useGasEstimation } from '@sophon-labs/account-react';
import { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';

export const GasEstimation = () => {
  const [hasData, setHasData] = useState(false);
  const { address } = useAccount();

  // Form state for config
  const [formData, setFormData] = useState({
    to: '0xE676a42fEd98d51336f02510bB5d598893AbfE90', // MOCK MintMe token
    data: '0xa9059cbb000000000000000000000000feb22da05537b4b63bb63417b10935819facb81c0000000000000000000000000000000000000000000000000de0b6b3a7640000', // transfer(address,uint256)
    value: '0',
    chainId: 531050104, // Sophon Testnet
    enabled: false,
  });

  const config = useMemo(
    () => ({
      to: formData.to as `0x${string}`,
      from: address,
      data: formData.data,
      value: BigInt(formData.value),
      chainId: formData.chainId,
      enabled: formData.enabled,
    }),
    [formData, address],
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
    setFormData((prev) => ({ ...prev, enabled: true }));
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

  const handleRefetch = () => {
    refetch();
  };

  // Format gas values for display
  const formatGas = (value: bigint | undefined | null) => {
    if (!value) return '0';
    return value.toString();
  };

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-white text-2xl font-bold mb-6">Gas Estimation</h1>

      {/* Configuration Form */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-600">
        <h3 className="text-white text-lg font-semibold mb-4">Configuration</h3>

        <div className="grid grid-cols-1 gap-4">
          {/* Transaction Config */}
          <div className="space-y-3">
            <h4 className="text-gray-300 font-medium">Transaction Settings</h4>
            <div>
              <label htmlFor="to" className="block text-sm text-gray-300 mb-1">
                To Address
              </label>
              <input
                id="to"
                type="text"
                value={formData.to}
                onChange={(e) => handleInputChange('to', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
              />
            </div>
            <div>
              <label
                htmlFor="data"
                className="block text-sm text-gray-300 mb-1"
              >
                Transaction Data (hex)
              </label>
              <textarea
                id="data"
                value={formData.data}
                onChange={(e) => handleInputChange('data', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono h-24"
                placeholder="0x..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="value"
                  className="block text-sm text-gray-300 mb-1"
                >
                  Value (wei)
                </label>
                <input
                  id="value"
                  type="text"
                  value={formData.value}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="chainId"
                  className="block text-sm text-gray-300 mb-1"
                >
                  Chain ID
                </label>
                <input
                  id="chainId"
                  type="number"
                  value={formData.chainId}
                  onChange={(e) =>
                    handleInputChange('chainId', parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-4 pt-4 border-t border-gray-600">
          <h4 className="text-gray-300 font-medium mb-3">Quick Presets</h4>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  to: '0xE676a42fEd98d51336f02510bB5d598893AbfE90',
                  data: '0xa9059cbb000000000000000000000000feb22da05537b4b63bb63417b10935819facb81c0000000000000000000000000000000000000000000000000de0b6b3a7640000',
                  value: '0',
                }));
              }}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              ERC20 Transfer
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  to: '0xfeb22da05537b4b63bb63417b10935819facb81c',
                  data: '0x',
                  value: '1000000000000000000', // 1 SOPH
                }));
              }}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            >
              SOPH Transfer
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  to: '0xE676a42fEd98d51336f02510bB5d598893AbfE90',
                  data: '0x095ea7b3000000000000000000000000feb22da05537b4b63bb63417b10935819facb81cffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
                  value: '0',
                }));
              }}
              className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              ERC20 Approve
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        {!hasData ? (
          <button
            type="button"
            onClick={handleEstimate}
            disabled={!address}
            className="px-5 py-2 text-white border-none rounded cursor-pointer transition-colors bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!address ? 'Connect Wallet' : 'Estimate Gas'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleClearData}
            className="px-5 py-2 text-white border-none rounded cursor-pointer transition-colors bg-gray-600 hover:bg-gray-700"
          >
            Clear Data
          </button>
        )}

        <button
          type="button"
          onClick={handleRefetch}
          disabled={!address}
          className="px-5 py-2 text-white border-none rounded cursor-pointer transition-colors bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Refresh Estimate
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-4 bg-blue-50 border border-blue-300 rounded mb-5 text-blue-800">
          🔄 Estimating gas...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-300 rounded mb-5 text-red-800">
          ❌ Error: {error.message}
        </div>
      )}

      {/* Gas Estimation Results */}
      {hasData && !isLoading && (
        <div className="border border-gray-300 rounded-lg p-5 bg-gray-50 text-gray-900">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            ⛽ Gas Estimation Results
          </h2>

          <div className="grid gap-4">
            <div>
              <span className="font-semibold text-gray-900">Gas Estimate:</span>
              <span className="ml-2 text-gray-800 font-mono">
                {formatGas(gasEstimate)} units
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-900">Gas Price:</span>
              <span className="ml-2 text-gray-800 font-mono">
                {formatGas(gasPrice)} wei
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-900">
                Total Fee Estimate:
              </span>
              <div className="ml-2 space-y-1">
                <div className="text-gray-800 font-mono">
                  {totalFeeEstimate?.toString() || '0'} wei
                </div>
                <div className="text-sm text-gray-600">
                  ≈{' '}
                  {totalFeeEstimate
                    ? (
                        Number(totalFeeEstimate) /
                        Number(BigInt(10) ** BigInt(18))
                      ).toFixed(8)
                    : '0'}{' '}
                  ETH
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-white border rounded">
              <div className="font-semibold text-gray-900 mb-2">
                Transaction Details:
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">From:</span>{' '}
                  <span className="font-mono">
                    {address || 'Not connected'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">To:</span>{' '}
                  <span className="font-mono">{formData.to}</span>
                </div>
                <div>
                  <span className="font-medium">Value:</span>{' '}
                  <span className="font-mono">{formData.value} wei</span>
                </div>
                <div>
                  <span className="font-medium">Chain ID:</span>{' '}
                  <span className="font-mono">{formData.chainId}</span>
                </div>
                <div>
                  <span className="font-medium">Data:</span>{' '}
                  <span className="font-mono text-xs break-all">
                    {formData.data || '0x (empty)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded text-blue-800">
              <div className="font-semibold">⚡ How it works</div>
              <div className="text-sm mt-1 space-y-1">
                <div>• Estimates gas units needed for the transaction</div>
                <div>• Gets current network gas price</div>
                <div>• Calculates total transaction fee</div>
                <div>• Use presets for common transaction types</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
