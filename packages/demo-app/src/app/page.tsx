"use client";
import { connectSophon, SophonAuthResult } from "sophon-sso";
import { sophonTestnet } from "viem/chains";
import { useState, useEffect } from "react";
import {
  useConnect,
  useAccount,
  useDisconnect,
  useSignTypedData,
  useSendTransaction,
} from "wagmi";
import { parseEther } from "viem";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SophonAuthResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const { connect, connectors, isPending } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const {
    signTypedData,
    data: signatureData,
    isPending: isSignPending,
  } = useSignTypedData();
  const { sendTransaction, isPending: isSendPending } = useSendTransaction();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const authResult = await connectSophon();
      setResult(authResult);
      console.log("Authentication successful:", authResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Authentication failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWagmiConnect = () => {
    const sophonConnector = connectors.find((c) => c.name === "ZKsync");

    if (sophonConnector) {
      connect({
        connector: sophonConnector,
        chainId: sophonTestnet.id,
      });
    } else {
      console.error("Sophon connector not found!");
    }
  };

  const handleSignMessage = () => {
    signTypedData({
      domain: {
        name: "Sophon SSO",
        version: "1",
        chainId: sophonTestnet.id,
      },
      types: {
        Message: [
          { name: "content", type: "string" },
          { name: "from", type: "address" },
          { name: "timestamp", type: "uint256" },
        ],
      },
      primaryType: "Message",
      message: {
        content: `Hello from Sophon SSO!\n\nThis message confirms you control this wallet.`,
        from: address as `0x${string}`,
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
      },
    });
  };

  const handleSendTransaction = () => {
    sendTransaction({
      to: "0x0d94c4DBE58f6FE1566A7302b4E4C3cD03744626",
      value: parseEther("0.001"),
      data: "0x",
    });
  };

  const resetTest = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Test Sophon SSO</h1>

        {/* Wagmi Connection Test */}
        <div
          style={{
            margin: "20px 0",
            padding: "20px",
            border: "2px solid #3b82f6",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ color: "#3b82f6", marginTop: 0 }}>
            Wagmi Connector Test
          </h3>

          {isConnected ? (
            <div>
              <p style={{ color: "#0f766e" }}>✅ Connected!</p>
              <p style={{ fontSize: "14px" }}>
                Address: <code>{address}</code>
              </p>
              <div style={{ margin: "10px 0" }}>
                <button
                  onClick={handleSignMessage}
                  disabled={isSignPending}
                  style={{
                    backgroundColor: isSignPending ? "#94a3b8" : "#059669",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    cursor: isSignPending ? "not-allowed" : "pointer",
                    marginRight: "10px",
                  }}
                >
                  {isSignPending ? "Signing..." : "Sign Message"}
                </button>
                <button
                  onClick={handleSendTransaction}
                  disabled={isSendPending}
                  style={{
                    backgroundColor: isSignPending ? "#94a3b8" : "#059669",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    cursor: isSignPending ? "not-allowed" : "pointer",
                    marginRight: "10px",
                  }}
                >
                  {isSignPending ? "Sending..." : "Send Transaction"}
                </button>
                <button
                  onClick={() => disconnect()}
                  style={{
                    backgroundColor: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Disconnect
                </button>
              </div>
              {signatureData && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #059669",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                >
                  <p
                    style={{
                      color: "#059669",
                      fontWeight: "bold",
                      margin: "0 0 5px 0",
                    }}
                  >
                    ✅ Message Signed!
                  </p>
                  <code style={{ wordBreak: "break-all", color: "#374151" }}>
                    {signatureData}
                  </code>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleWagmiConnect}
              disabled={isPending}
              style={{
                backgroundColor: isPending ? "#94a3b8" : "#3b82f6",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "16px",
                cursor: isPending ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
              }}
            >
              {isPending ? "Connecting..." : "Connect with Wagmi"}
            </button>
          )}
        </div>

        {/* Original Popup Test */}
        <div
          style={{
            margin: "20px 0",
            padding: "20px",
            border: "1px solid #6b7280",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ color: "#6b7280", marginTop: 0 }}>
            Original Popup Test
          </h3>

          {!result && !error && (
            <div style={{ margin: "20px 0" }}>
              <button
                onClick={handleConnect}
                disabled={loading}
                style={{
                  backgroundColor: loading ? "#94a3b8" : "#6b7280",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                }}
              >
                {loading ? "Opening popup..." : "Connect with Popup"}
              </button>
            </div>
          )}

          {result && (
            <div
              style={{
                backgroundColor: "#000",
                border: "1px solid #000",
                borderRadius: "8px",
                padding: "20px",
                margin: "20px 0",
                maxWidth: "500px",
              }}
            >
              <h4 style={{ color: "#0f766e", marginTop: 0 }}>Success!</h4>
              <div style={{ textAlign: "left", fontSize: "14px" }}>
                <p>
                  <strong>Address:</strong>
                </p>
                <code
                  style={{
                    backgroundColor: "#000",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    wordBreak: "break-all",
                  }}
                >
                  {result.data.address}
                </code>
                <p style={{ marginTop: "10px" }}>
                  <strong>Mode:</strong> {result.data.mode}
                </p>
                {result.data.username && (
                  <p>
                    <strong>Username:</strong> {result.data.username}
                  </p>
                )}
                <p>
                  <strong>Timestamp:</strong>{" "}
                  {new Date(result.data.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={resetTest}
                style={{
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
              >
                Test Again
              </button>
            </div>
          )}

          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #ef4444",
                borderRadius: "8px",
                padding: "20px",
                margin: "20px 0",
                maxWidth: "500px",
              }}
            >
              <h4 style={{ color: "#dc2626", marginTop: 0 }}>Error</h4>
              <p style={{ color: "#dc2626", fontSize: "14px" }}>{error}</p>
              <button
                onClick={resetTest}
                style={{
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: "40px", fontSize: "12px", color: "#64748b" }}>
          <p>Make sure your auth-server is running on localhost:3000</p>
          <code>cd packages/auth-server && npm run dev</code>
        </div>
      </header>
    </div>
  );
}
