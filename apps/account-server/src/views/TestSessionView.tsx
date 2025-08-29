'use client';

import {
  getCreateSessionTxForViem,
  getInstallSessionKeyModuleTxForViem,
  isSessionKeyModuleInstalled,
  LimitType,
} from '@sophon-labs/account-core';
import { createPublicClient, http } from 'viem';
import { sophonTestnet } from 'viem/chains';
import { useWalletClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { useAccountContext } from '@/hooks/useAccountContext';

export default function TestSessionView() {
  const { account } = useAccountContext();

  const { data: walletClient } = useWalletClient();

  const handleCreateSession = async () => {
    console.log('create session');

    const publicClient = createPublicClient({
      chain: sophonTestnet,
      transport: http(),
    });

    const installed = await isSessionKeyModuleInstalled(
      account!.address,
      true,
      true,
    );

    if (!installed) {
      const installTx = getInstallSessionKeyModuleTxForViem(
        {
          accountAddress: account!.address,
        },
        true,
        true,
      );

      const installHash = await walletClient!.sendTransaction(installTx);
      await publicClient.waitForTransactionReceipt({ hash: installHash });
    } else {
      console.log('Session key module already installed');
    }

    const createSessionTx = getCreateSessionTxForViem(
      {
        sessionConfig: {
          signer: account!.address,
          expiresAt: BigInt(1000000000000000000),
          feeLimit: {
            limitType: LimitType.Allowance,
            limit: BigInt(1000000000000000000),
            period: BigInt(1000000000000000000),
          },
          callPolicies: [],
          transferPolicies: [],
        },
      },
      account!.address,
    );
    const sessionHash = await walletClient!.sendTransaction(createSessionTx);
    await publicClient.waitForTransactionReceipt({ hash: sessionHash });

    console.log('tx', sessionHash);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 mt-3 flex-grow">
      <Button onClick={handleCreateSession}>Create Session</Button>
    </div>
  );
}
