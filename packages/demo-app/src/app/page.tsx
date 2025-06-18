"use client";
import { connectSophon, SophonAuthResult } from "sophon-sso";
import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SophonAuthResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const resetTest = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Test Sophon SSO</h1>

        {!result && !error && (
          <div style={{ margin: "20px 0" }}>
            <button
              onClick={handleConnect}
              disabled={loading}
              style={{
                backgroundColor: loading ? "#94a3b8" : "#3b82f6",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "16px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
              }}
            >
              {loading ? "Opening popup..." : "Connect with Sophon"}
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
            <h3 style={{ color: "#0f766e", marginTop: 0 }}>Success!</h3>
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
            <h3 style={{ color: "#dc2626", marginTop: 0 }}>Error</h3>
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

        <div style={{ marginTop: "40px", fontSize: "12px", color: "#64748b" }}>
          <p>Make sure your auth-server is running on localhost:3000</p>
          <code>cd packages/auth-server && npm run dev</code>
        </div>
      </header>
    </div>
  );
}
