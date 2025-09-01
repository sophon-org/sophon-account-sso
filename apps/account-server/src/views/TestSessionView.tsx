'use client';

import {
  getCreateSessionTxForViem,
  getInstallSessionKeyModuleTxForViem,
  getSessionActionsHash,
  getZKSyncSessionClientCreationParams,
  isSessionKeyModuleInstalled,
  LimitType,
} from '@sophon-labs/account-core';
import { useEffect } from 'react';
import { getAddress } from 'viem';
import { createZksyncSessionClient } from 'zksync-sso/client';
import { Button } from '@/components/ui/button';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useTransaction } from '@/hooks/useTransaction';
import { SOPHON_VIEM_CHAIN } from '@/lib/constants';

export default function TestSessionView() {
  const { account } = useAccountContext();

  const { sendTransaction, transactionError } = useTransaction();

  const useAllowedSessions =
    typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('allowedSessions') ??
        false)
      : false;

  const signerPrivateKey =
    '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';
  const signerAddress = '0x36615cf349d7f6344891b1e7ca7c72883f5dc049';

  const sessionConfig = {
    signer: getAddress(signerAddress.toLowerCase()) as `0x${string}`,
    expiresAt: BigInt(1000000000000000000),
    feeLimit: {
      limitType: LimitType.Allowance,
      limit: BigInt(1000000000000000000),
      period: BigInt(1000000000000000000),
    },
    callPolicies: [],
    transferPolicies: [
      {
        target: getAddress(signerAddress.toLowerCase()) as `0x${string}`,
        maxValuePerUse: BigInt(1000000000000000000),
        valueLimit: {
          limitType: LimitType.Allowance,
          limit: BigInt(1000000000000000000),
          period: BigInt(1000000000000000000),
        },
      },
    ],
  };

  useEffect(() => {
    if (transactionError) {
      console.error(transactionError);
    }
  }, [transactionError]);

  const handleCreateSession = async () => {
    console.log('create session');

    const installed = await isSessionKeyModuleInstalled(
      account!.address,
      useAllowedSessions,
      true,
    );

    if (!installed) {
      const installTx = getInstallSessionKeyModuleTxForViem(
        {
          accountAddress: account!.address,
        },
        useAllowedSessions,
        true,
      );

      await sendTransaction(installTx, null);
      console.log('done 1');
    } else {
      console.log('Session key module already installed');
    }

    console.log(getSessionActionsHash(sessionConfig));

    const createSessionTx = getCreateSessionTxForViem(
      {
        sessionConfig,
      },
      account!.address,
      useAllowedSessions,
    );
    await sendTransaction(createSessionTx, null);

    console.log('done');
  };

  const handleTestSession = async () => {
    const sessionClientParams = getZKSyncSessionClientCreationParams(
      sessionConfig,
      account!.address,
      signerPrivateKey as `0x${string}`,
      SOPHON_VIEM_CHAIN,
      useAllowedSessions,
      true,
    );

    const sessionClient = createZksyncSessionClient(sessionClientParams);

    console.log(sessionClient);

    const tx = await sessionClient.sendTransaction({
      to: signerAddress.toLowerCase() as `0x${string}`,
      value: BigInt(5),
    });

    console.log(tx);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 mt-3 flex-grow">
      <Button onClick={handleCreateSession}>Create Session</Button>
      <Button onClick={handleTestSession}>Test Session</Button>
    </div>
  );
}
