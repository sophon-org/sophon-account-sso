'use client';
import { useState } from 'react';
import { Logo } from '../../components/logo';
import { createSophonProvider } from '@sophon-labs/account-connector';
import { Address, createWalletClient, custom } from 'viem';
import { sophonTestnet } from 'viem/chains';
import { eip712WalletActions } from 'viem/zksync';

export default function Home() {
  const [address, setAddress] = useState<Address>();
  const [error, setError] = useState<string>();

  const handleConnect = async () => {
    const provider = createSophonProvider(
      '123b216c-678e-4611-af9a-2d5b7b061258',
      'testnet',
    );
    const walletClient = createWalletClient({
      chain: sophonTestnet,
      transport: custom(provider),
    }).extend(eip712WalletActions());

    const addresses = await walletClient.requestAddresses();
    if (!addresses.length) {
      setError('No addresses found');
      return;
    }

    setAddress(addresses[0]);
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex flex-col gap-2 max-w-md w-full items-center">
        <Logo className="mb-4" />
        <button onClick={handleConnect} type="button">
          Connect
        </button>
        {address && <div>Address: {address}</div>}
        {error && <div>Error: {error}</div>}
      </div>
    </div>
  );
}
