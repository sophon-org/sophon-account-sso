import { useGetSwapStatus } from '@sophon-labs/account-react';
import { useEffect, useMemo, useState } from 'react';

export const GetSwapTransactionStatus = () => {
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
        Get Swap Transaction Status
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

          {/* Status Config */}
          <div className="space-y-3">
            <h4 className="text-gray-300 font-medium">Status Settings</h4>
            <div>
              <label
                htmlFor="txHash"
                className="block text-sm text-gray-300 mb-1"
              >
                Transaction Hash
              </label>
              <input
                id="txHash"
                type="text"
                value={formData.txHash}
                onChange={(e) => handleInputChange('txHash', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="chainId"
              className="block text-sm text-gray-300 mb-1"
            >
              Chain ID (Optional)
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

          <div>
            <label
              htmlFor="refetchInterval"
              className="block text-sm text-gray-300 mb-1"
            >
              Polling Interval (ms, 0 = no polling)
            </label>
            <input
              id="refetchInterval"
              type="number"
              value={formData.refetchInterval}
              onChange={(e) =>
                handleInputChange('refetchInterval', parseInt(e.target.value))
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
          🔄 Loading transaction status...
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
            📊 Transaction Status
          </h2>

          <div className="grid gap-4">
            <div>
              <span className="font-semibold text-gray-900">Found:</span>
              <span
                className={`ml-2 ${data.found ? 'text-green-600' : 'text-red-600'}`}
              >
                {data.found ? '✅ Yes' : '❌ No'}
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-900">Status:</span>
              <span className="ml-2 text-gray-800">{data.status}</span>
            </div>

            <div>
              <span className="font-semibold text-gray-900">Provider:</span>
              <span className="ml-2 text-gray-800">{data.provider}</span>
            </div>

            {data.transaction && (
              <div>
                <span className="font-semibold text-gray-900">
                  Transaction Details:
                </span>
                <div className="bg-white text-gray-900 p-3 rounded border mt-2 text-xs font-mono">
                  <div className="mb-2">
                    <span className="font-semibold">Hash:</span>{' '}
                    {data.transaction.hash}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Source Chain:</span>{' '}
                    {data.transaction.sourceChain}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Destination Chain:</span>{' '}
                    {data.transaction.destinationChain}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Amount:</span>{' '}
                    {data.transaction.amount}
                  </div>
                  {data.transaction.recipient && (
                    <div>
                      <span className="font-semibold">Recipient:</span>{' '}
                      {data.transaction.recipient}
                    </div>
                  )}
                </div>
              </div>
            )}

            {data.fees && (
              <div>
                <span className="font-semibold text-gray-900">Fees:</span>
                <div className="ml-3 text-sm text-gray-800 space-y-1 mt-2">
                  <div>• Gas Fee: {data.fees.gas}</div>
                  <div>• Protocol Fee: {data.fees.protocol}</div>
                  <div>• Total Fees: {data.fees.total}</div>
                </div>
              </div>
            )}

            {data.timestamps && (
              <div>
                <span className="font-semibold text-gray-900">Timestamps:</span>
                <div className="ml-3 text-sm text-gray-800 space-y-1 mt-2">
                  {data.timestamps.initiated && (
                    <div>
                      • Initiated:{' '}
                      {new Date(data.timestamps.initiated).toLocaleString()}
                    </div>
                  )}
                  {data.timestamps.confirmed && (
                    <div>
                      • Confirmed:{' '}
                      {new Date(data.timestamps.confirmed).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {data.links && (
              <div>
                <span className="font-semibold text-gray-900">Links:</span>
                <div className="ml-3 text-sm space-y-1 mt-2">
                  {data.links.explorer && (
                    <div>
                      • Explorer:{' '}
                      <a
                        href={data.links.explorer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {data.links.explorer}
                      </a>
                    </div>
                  )}
                  {data.links.providerTracker && (
                    <div>
                      • Provider Tracker:{' '}
                      <a
                        href={data.links.providerTracker}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {data.links.providerTracker}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded text-blue-800">
              <div className="font-semibold">📈 Status Tracking</div>
              <div className="text-sm mt-1">
                Transaction status retrieved successfully from the swap
                provider.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
