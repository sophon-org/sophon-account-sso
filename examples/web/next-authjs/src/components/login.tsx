'use client';

import { SiwsMessage } from '@sophon-labs/account-core';
import { createSophonEIP1193Provider } from '@sophon-labs/account-provider';
import { getCsrfToken, signIn } from 'next-auth/react';
import { createWalletClient, custom } from 'viem';
import { sophon, sophonTestnet } from 'viem/chains';
import { eip712WalletActions } from 'viem/zksync';

export const LoginButton = () => {
  const handleConnect = async () => {
    const networkType = process.env.NETWORK_TYPE as 'mainnet' | 'testnet';
    const currentNetwork = networkType === 'mainnet' ? sophon : sophonTestnet;

    const provider = createSophonEIP1193Provider(networkType);

    const walletClient = createWalletClient({
      chain: currentNetwork,
      transport: custom(provider),
    }).extend(eip712WalletActions());

    const connectedWallets = await walletClient.requestAddresses();
    console.log('connectedWallets', connectedWallets);
    if (!connectedWallets.length) {
      throw new Error('No wallet connected');
    }

    const messageBuilder: SiwsMessage = new SiwsMessage({
      domain: window.location.host,
      address: connectedWallets[0],
      statement: 'Hello world from Sophon and Next-Auth!',
      chainId: currentNetwork.id,
      nonce: await getCsrfToken(),
    });

    const message = messageBuilder.prepareMessage();
    const signature = await walletClient.signMessage({
      message,
      account: connectedWallets[0],
    });

    await signIn('credentials', {
      message,
      redirect: false,
      signature,
      callbackUrl: '/',
      address: connectedWallets[0],
    });
  };

  return (
    <button
      style={{
        backgroundColor: 'purple',
        padding: 10,
        borderRadius: 16,
        color: 'white',
        cursor: 'pointer',
      }}
      onClick={handleConnect}
      type="button"
    >
      Connect
    </button>
  );
};
