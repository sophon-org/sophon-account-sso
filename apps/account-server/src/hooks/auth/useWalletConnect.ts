'use client';
import QRCodeStyling from 'qr-code-styling';
import { useCallback, useEffect, useState } from 'react';
import { useConnect } from 'wagmi';

interface UseWalletConnectReturn {
  qrCodeUri: string;
  qrCodeDataUrl: string;
  isLoading: boolean;
  error: string | null;
  showQR: boolean;
  setShowQR: (show: boolean) => void;
  initializeWalletConnect: () => Promise<void>;
  closeQR: () => void;
  resetError: () => void;
}

export function useWalletConnect(): UseWalletConnectReturn {
  const { connectors } = useConnect();
  const [qrCodeUri, setQrCodeUri] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const handleDisplayUri = useCallback((uri: string) => {
    setQrCodeUri(uri);
    setIsLoading(false);
  }, []);

  const initializeWalletConnect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setQrCodeUri('');

      const connector = connectors.find((c) => c.name === 'WalletConnect');

      if (!connector) {
        throw new Error('WalletConnect connector not found');
      }

      // Set up the URI handler before connecting
      if ('onDisplayUri' in connector) {
        connector.onDisplayUri = handleDisplayUri;
      }

      // Show QR modal
      setShowQR(true);

      // Trigger the connection to get the URI
      await connector.connect();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to initialize WalletConnect';
      console.error('WalletConnect initialization error:', err);
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [connectors, handleDisplayUri]);

  const closeQR = useCallback(() => {
    setShowQR(false);
    setQrCodeUri('');
    setError(null);
    setIsLoading(false);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    const generateQRCode = async () => {
      setIsLoading(true);
      if (qrCodeUri) {
        try {
          const qrCode = new QRCodeStyling({
            width: 278,
            height: 278,
            type: 'canvas',
            data: qrCodeUri,
            image: '/images/supported-wallets/wallet-connect.png',
            dotsOptions: {
              color: '#000000',
              type: 'rounded',
            },
            backgroundOptions: {
              color: '#FFFFFF',
            },
            imageOptions: {
              crossOrigin: 'anonymous',
              margin: 10,
              imageSize: 0.5,
            },
          });

          // Get the QR code as a data URL
          const blob = await qrCode.getRawData('png');
          const dataUrl = URL.createObjectURL(blob as Blob);
          setQrCodeDataUrl(dataUrl);
        } catch (err) {
          console.error('Failed to generate QR code:', err);
          // Keep the existing qrCodeDataUrl if generation fails
        } finally {
          setIsLoading(false);
        }
      }
    };

    generateQRCode();
  }, [qrCodeUri]);

  return {
    qrCodeUri,
    qrCodeDataUrl,
    isLoading,
    error,
    showQR,
    setShowQR,
    initializeWalletConnect,
    closeQR,
    resetError,
  };
}
