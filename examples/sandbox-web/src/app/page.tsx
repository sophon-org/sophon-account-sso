'use client';

import { useEffect, useState } from 'react';
import { parseEther } from 'viem';
import { sophonTestnet } from 'viem/chains';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSendTransaction,
  useSignTypedData,
} from 'wagmi';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  const { connect, connectors, isPending } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const {
    signTypedData,
    data: signatureData,
    isPending: isSignPending,
    error: signError,
  } = useSignTypedData();
  const { sendTransaction, isPending: isSendPending } = useSendTransaction();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  const handleWagmiConnect = () => {
    const sophonConnector = connectors.find((c) => c.name === 'ZKsync');

    if (sophonConnector) {
      connect({
        connector: sophonConnector,
        chainId: sophonTestnet.id,
      });
    } else {
      console.error('Sophon connector not found!');
    }
  };

  const handleSignMessage = () => {
    signTypedData({
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
        from: address as `0x${string}`,
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
      },
    });
  };

  const handleSendTransaction = () => {
    sendTransaction({
      to: '0x0d94c4DBE58f6FE1566A7302b4E4C3cD03744626',
      value: parseEther('0.001'),
      data: '0x',
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Sophon Account Example - Next + Wagmi</h1>

        {/* Wagmi Connection Test */}
        <div
          style={{
            margin: '20px 0',
            padding: '20px',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
          }}
        >
          <h3 style={{ color: '#3b82f6', marginTop: 0 }}>
            Wagmi Connector Test
          </h3>

          {isConnected ? (
            <div>
              <p style={{ color: '#0f766e' }}>✅ Connected!</p>
              <p style={{ fontSize: '14px' }}>
                Address: <code>{address}</code>
              </p>
              <div style={{ margin: '10px 0' }}>
                <a
                  href="https://my.staging.sophon.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#6161d0',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: isSignPending ? 'not-allowed' : 'pointer',
                    marginRight: '10px',
                  }}
                >
                  Open Profile
                </a>
                <button
                  type="button"
                  onClick={handleSignMessage}
                  disabled={isSignPending}
                  style={{
                    backgroundColor: isSignPending ? '#94a3b8' : '#059669',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: isSignPending ? 'not-allowed' : 'pointer',
                    marginRight: '10px',
                  }}
                >
                  {isSignPending ? 'Signing...' : 'Sign Message'}
                </button>
                <button
                  type="button"
                  onClick={handleSendTransaction}
                  disabled={isSendPending}
                  style={{
                    backgroundColor: isSignPending ? '#94a3b8' : '#059669',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: isSignPending ? 'not-allowed' : 'pointer',
                    marginRight: '10px',
                  }}
                >
                  {isSignPending ? 'Sending...' : 'Send Transaction'}
                </button>
                <button
                  type="button"
                  onClick={() => disconnect()}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Disconnect
                </button>
              </div>
              {signError && (
                <div style={{ color: 'red', marginTop: '10px' }}>
                  {signError.message}
                </div>
              )}
              {signatureData && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #059669',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  <p
                    style={{
                      color: '#059669',
                      fontWeight: 'bold',
                      margin: '0 0 5px 0',
                    }}
                  >
                    ✅ Message Signed!
                  </p>
                  <code style={{ wordBreak: 'break-all', color: '#374151' }}>
                    {signatureData}
                  </code>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleWagmiConnect}
              disabled={isPending}
              style={{
                backgroundColor: isPending ? '#94a3b8' : '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: isPending ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              {isPending ? 'Connecting...' : 'Connect with Wagmi'}
            </button>
          )}
        </div>

        <div style={{ marginTop: '40px', fontSize: '12px', color: '#64748b' }}>
          <p>Make sure your auth-server is running on localhost:3000</p>
          <code>cd packages/auth-server && npm run dev</code>
        </div>
      </header>
    </div>
  );
}
