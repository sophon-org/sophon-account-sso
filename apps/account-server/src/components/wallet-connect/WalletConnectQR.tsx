'use client';
import Image from 'next/image';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Loader } from '@/components/loader';

interface WalletConnectQRProps {
  qrCodeUri?: string;
  qrCodeDataUrl?: string;
  isLoading?: boolean;
  error?: string | null;
  onSuccess: () => void;
}

export function WalletConnectQR({
  qrCodeUri,
  qrCodeDataUrl,
  isLoading,
  error,
  onSuccess,
}: WalletConnectQRProps) {
  const { isConnected, address } = useAccount();

  useEffect(() => {
    if (isConnected && address) {
      onSuccess();
    }
  }, [isConnected, address, onSuccess]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader className="w-8 h-8 border-black border-r-transparent" />
        <p className="mt-4 text-sm text-gray-600">
          Initializing WalletConnect...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {qrCodeDataUrl ? (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <Image
            src={qrCodeDataUrl}
            alt="WalletConnect QR Code"
            width={278}
            height={278}
            className="mx-auto"
          />
        </div>
      ) : qrCodeUri ? (
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-xs break-all max-w-xs bg-gray-100 p-2 rounded font-mono">
            {qrCodeUri}
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Copy this URI to your mobile wallet
          </p>
        </div>
      ) : (
        <div className="text-sm text-gray-500">QR code not available</div>
      )}

      <p className="mt-8 text-center">
        Scan this QR code with your mobile wallet or device camera
      </p>
    </div>
  );
}
