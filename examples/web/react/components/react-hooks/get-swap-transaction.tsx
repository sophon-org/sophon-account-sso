import {
  TransactionType,
  useGetSwapTransaction,
} from '@sophon-labs/account-react';
import { useEffect, useMemo, useState } from 'react';

export const GetSwapTransaction = () => {
  const [enabled, setEnabled] = useState(false);
  const [hasData, setHasData] = useState(false);

  // Form state for config
  const [formData, setFormData] = useState({
    sender: '0x4fAA9B1aF8ee73B922f821D3574Ef068948d03a5',
    sourceChain: 1,
    destinationChain: 8453,
    sourceToken: '0x0000000000000000000000000000000000000000',
    destinationToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    amount: '1000000000000000000',
    slippage: 0.5,
    baseUrl: 'http://localhost:4001',
  });

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
    {
      config,
      enabled: enabled,
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
    setEnabled(true);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-white text-2xl font-bold mb-6">
        Get Swap Transaction
      </h1>

      {/* Configuration Form */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-600">
        <h3 className="text-white text-lg font-semibold mb-4">Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* API Config */}
          <div className="space-y-3">
            <h4 className="text-gray-300 font-medium">API Settings</h4>
            <div>
              <label
                htmlFor="baseUrl"
                className="block text-sm text-gray-300 mb-1"
              >
                Base URL
              </label>
              <input
                id="baseUrl"
                type="text"
                value={formData.baseUrl}
                onChange={(e) => handleInputChange('baseUrl', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
            </div>
          </div>

          {/* Transaction Config */}
          <div className="space-y-3">
            <h4 className="text-gray-300 font-medium">Transaction Settings</h4>
            <div>
              <label
                htmlFor="sender"
                className="block text-sm text-gray-300 mb-1"
              >
                Sender Address
              </label>
              <input
                id="sender"
                type="text"
                value={formData.sender}
                onChange={(e) => handleInputChange('sender', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="sourceChain"
              className="block text-sm text-gray-300 mb-1"
            >
              Source Chain
            </label>
            <input
              id="sourceChain"
              type="number"
              value={formData.sourceChain}
              onChange={(e) =>
                handleInputChange('sourceChain', parseInt(e.target.value))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="destinationChain"
              className="block text-sm text-gray-300 mb-1"
            >
              Destination Chain
            </label>
            <input
              id="destinationChain"
              type="number"
              value={formData.destinationChain}
              onChange={(e) =>
                handleInputChange('destinationChain', parseInt(e.target.value))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="sourceToken"
              className="block text-sm text-gray-300 mb-1"
            >
              Source Token
            </label>
            <input
              id="sourceToken"
              type="text"
              value={formData.sourceToken}
              onChange={(e) => handleInputChange('sourceToken', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="destinationToken"
              className="block text-sm text-gray-300 mb-1"
            >
              Destination Token
            </label>
            <input
              id="destinationToken"
              type="text"
              value={formData.destinationToken}
              onChange={(e) =>
                handleInputChange('destinationToken', e.target.value)
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="amount"
              className="block text-sm text-gray-300 mb-1"
            >
              Amount (Wei)
            </label>
            <input
              id="amount"
              type="text"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="slippage"
              className="block text-sm text-gray-300 mb-1"
            >
              Slippage (%)
            </label>
            <input
              id="slippage"
              type="number"
              step="0.1"
              value={formData.slippage}
              onChange={(e) =>
                handleInputChange('slippage', parseFloat(e.target.value))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            />
          </div>
        </div>
      </div>

      {!hasData ? (
        <button
          type="button"
          onClick={handleEnable}
          className="px-5 py-2 text-white border-none rounded cursor-pointer mb-5 transition-colors bg-blue-600 hover:bg-blue-700"
        >
          Enable
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClearData}
          className="px-5 py-2 text-white border-none rounded cursor-pointer mb-5 transition-colors bg-gray-600 hover:bg-gray-700"
        >
          Clear Data
        </button>
      )}

      {isLoading && (
        <div className="p-4 bg-blue-50 border border-blue-300 rounded mb-5 text-blue-800">
          🔄 Loading swap transaction...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-300 rounded mb-5 text-red-800">
          ❌ Error: {error.message}
        </div>
      )}

      {hasData && data && (
        <div className="border border-gray-300 rounded-lg p-5 bg-gray-50 text-gray-900">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            ✅ Swap Transaction Ready
          </h2>

          <div className="grid gap-4">
            <div>
              <span className="font-semibold text-gray-900">
                Transaction ID:
              </span>
              <div className="font-mono text-xs bg-white text-gray-900 p-2 rounded mt-1 break-all border">
                {data.transactionId}
              </div>
            </div>

            <div>
              <span className="font-semibold text-gray-900">Provider:</span>
              <span className="text-gray-800 ml-2">{data.provider}</span>
            </div>

            <div>
              <span className="font-semibold text-gray-900">
                Exchange Rate:
              </span>{' '}
              <span className="text-gray-800">
                {data.exchangeRate?.toLocaleString()} USDC per ETH
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-900">
                Estimated Time:
              </span>
              <span className="text-gray-800 ml-2">
                {data.estimatedTime} seconds
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-900">Fees:</span>
              <div className="ml-3 text-sm text-gray-800 space-y-1 mt-2">
                <div>
                  • Protocol Fee:{' '}
                  {(Number(data.fees.protocol) / 1e18).toFixed(6)} ETH
                </div>
                <div>• Gas Fee: {data.fees.gas} ETH</div>
                <div>
                  • Total Fees: {(Number(data.fees.total) / 1e18).toFixed(6)}{' '}
                  ETH
                </div>
              </div>
            </div>

            <div>
              <span className="font-semibold text-gray-900">
                Transaction Details:
              </span>
              <div className="bg-white text-gray-900 p-3 rounded border mt-2 text-xs font-mono">
                <div className="mb-2">
                  <span className="font-semibold">To:</span>{' '}
                  {data.transaction.to}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Value:</span>{' '}
                  {(Number(data.transaction.value) / 1e18).toFixed(6)} ETH
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Chain ID:</span>{' '}
                  {data.transaction.chainId}
                </div>
                <div>
                  <span className="font-semibold">Data:</span>
                  <div className="max-h-24 overflow-auto bg-gray-100 text-gray-800 p-2 mt-1 rounded break-all">
                    {data.transaction.data}
                  </div>
                </div>
              </div>
            </div>

            {data.requiredApprovals && data.requiredApprovals.length > 0 && (
              <div>
                <span className="font-semibold text-gray-900">
                  Required Approvals:
                </span>
                <div className="ml-3 text-gray-800">
                  {data.requiredApprovals.map((approval, index) => (
                    <div
                      key={`approval-${approval.token || index}`}
                      className="text-sm"
                    >
                      • {JSON.stringify(approval)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-green-50 border border-green-300 rounded text-green-800">
              <div className="font-semibold">🚀 Ready to Execute!</div>
              <div className="text-sm mt-1">
                This transaction is ready to be sent to your wallet for
                execution.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
