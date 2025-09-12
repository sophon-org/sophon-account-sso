'use client';
import { createSophonEIP1193Provider } from '@sophon-labs/account-provider';
import { useCallback, useMemo, useState } from 'react';
import { type Address, createWalletClient, custom } from 'viem';
import { sophonTestnet } from 'viem/chains';
import { eip712WalletActions } from 'viem/zksync';
import { Logo } from '../../components/logo';

export default function Home() {
  const [address, setAddress] = useState<Address>();
  const [error, setError] = useState<string>();
  const [signature, setSignature] = useState<string>();

  const provider = useMemo(() => {
    return createSophonEIP1193Provider(
      'testnet',
      '123b216c-678e-4611-af9a-2d5b7b061258',
    );
  }, []);

  const walletClient = useMemo(() => {
    return createWalletClient({
      chain: sophonTestnet,
      transport: custom(provider),
    }).extend(eip712WalletActions());
  }, [provider]);

  const handleConnect = useCallback(async () => {
    const addresses = await walletClient.requestAddresses();
    if (!addresses.length) {
      setError('No addresses found');
      return;
    }

    setAddress(addresses[0]);

    const signature = await walletClient.signMessage({
      account: addresses[0],
      message: 'Hello from Sophon',
    });
    setSignature(signature);
  }, [walletClient]);

  const handleDisconnect = useCallback(async () => {
    setAddress(undefined);
    setError(undefined);
    setSignature(undefined);
    await provider.disconnect();
  }, [provider]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex flex-col gap-2 max-w-md w-full items-center">
        <Logo className="mb-4" />
        {address && <div>You are connected as: {address}</div>}
        {signature && <div>Signature: {signature}</div>}
        {error && <div>Error: {error}</div>}
        {!address && (
          <button
            onClick={handleConnect}
            type="button"
            className="bg-purple-500/80 hover:bg-purple-500 transition-all duration-300 border border-purple-500/50 text-white px-4 py-2 rounded-md"
          >
            Connect
          </button>
        )}
        {address && (
          <button
            onClick={handleDisconnect}
            type="button"
            className="bg-red-500/80 hover:bg-red-500 transition-all duration-300 border border-red-500/50 text-white px-4 py-2 rounded-md"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}
