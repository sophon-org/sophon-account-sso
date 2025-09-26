import { useERC20Approval } from '@sophon-labs/account-react';
import { useEffect, useMemo, useState } from 'react';

export const ERC20Approval = () => {
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

  const handleEnable = () => {
    // This will trigger the hook to check allowance
    refetch();
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApprove = async () => {
    try {
      await approve();
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleRefetch = () => {
    refetch();
  };

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-white text-2xl font-bold mb-6">
        ERC20 Token Approval
      </h1>

      {/* Configuration Form */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-600">
        <h3 className="text-white text-lg font-semibold mb-4">Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Token Config */}
          <div className="space-y-3">
            <h4 className="text-gray-300 font-medium">Token Settings</h4>
            <div>
              <label
                htmlFor="tokenAddress"
                className="block text-sm text-gray-300 mb-1"
              >
                Token Address
              </label>
              <input
                id="tokenAddress"
                type="text"
                value={formData.tokenAddress}
                onChange={(e) =>
                  handleInputChange('tokenAddress', e.target.value)
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
              />
            </div>
            <div>
              <label
                htmlFor="spender"
                className="block text-sm text-gray-300 mb-1"
              >
                Spender Address
              </label>
              <input
                id="spender"
                type="text"
                value={formData.spender}
                onChange={(e) => handleInputChange('spender', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
              />
            </div>
          </div>

          {/* Approval Config */}
          <div className="space-y-3">
            <h4 className="text-gray-300 font-medium">Approval Settings</h4>
            <div>
              <label
                htmlFor="amount"
                className="block text-sm text-gray-300 mb-1"
              >
                Amount (in token units)
              </label>
              <input
                id="amount"
                type="text"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
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

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        {!hasData ? (
          <button
            type="button"
            onClick={handleEnable}
            className="px-5 py-2 text-white border-none rounded cursor-pointer transition-colors bg-blue-600 hover:bg-blue-700"
          >
            Check Allowance
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
          className="px-5 py-2 text-white border-none rounded cursor-pointer transition-colors bg-green-600 hover:bg-green-700"
        >
          Refresh Allowance
        </button>

        {hasData && !isApproved && (
          <button
            type="button"
            onClick={handleApprove}
            disabled={isLoading}
            className="px-5 py-2 text-white border-none rounded cursor-pointer transition-colors bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Approving...' : 'Approve'}
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-4 bg-blue-50 border border-blue-300 rounded mb-5 text-blue-800">
          🔄 Processing approval...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-300 rounded mb-5 text-red-800">
          ❌ Error: {error.message}
        </div>
      )}

      {/* Approval Status */}
      {hasData && (
        <div className="border border-gray-300 rounded-lg p-5 bg-gray-50 text-gray-900">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            🔐 Approval Status
          </h2>

          <div className="grid gap-4">
            <div>
              <span className="font-semibold text-gray-900">Is Approved:</span>
              <span
                className={`ml-2 ${isApproved ? 'text-green-600' : 'text-red-600'}`}
              >
                {isApproved ? '✅ Yes' : '❌ No'}
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-900">
                Current Allowance:
              </span>
              <span className="ml-2 text-gray-800 font-mono">
                {currentAllowance?.toString() || '0'}
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-900">
                Required Amount:
              </span>
              <span className="ml-2 text-gray-800 font-mono">
                {formData.amount}
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-900">
                Token Address:
              </span>
              <span className="ml-2 text-gray-800 font-mono text-sm">
                {formData.tokenAddress}
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-900">
                Spender Address:
              </span>
              <span className="ml-2 text-gray-800 font-mono text-sm">
                {formData.spender}
              </span>
            </div>

            {approvalTxHash && (
              <div>
                <span className="font-semibold text-gray-900">
                  Approval Transaction:
                </span>
                <div className="mt-2 p-3 bg-white border rounded">
                  <div className="text-sm font-mono text-gray-800 mb-2">
                    Hash: {approvalTxHash}
                  </div>
                  <div className="text-sm">
                    Status:{' '}
                    <span
                      className={`font-semibold ${
                        isConfirmed ? 'text-green-600' : 'text-yellow-600'
                      }`}
                    >
                      {isConfirmed ? '✅ Confirmed' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded text-blue-800">
              <div className="font-semibold">💡 How it works</div>
              <div className="text-sm mt-1 space-y-1">
                <div>• Check current allowance for the token/spender pair</div>
                <div>
                  • If insufficient, click "Approve" to grant permission
                </div>
                <div>• Monitor transaction confirmation status</div>
                <div>• Refresh to see updated allowance</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
