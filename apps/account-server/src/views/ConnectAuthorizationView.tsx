'use client';

import { useEffect } from 'react';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useAuthResponse } from '@/hooks/useAuthResponse';
import { windowService } from '@/service/window.service';

export default function ConnectAuthorizationView() {
  const { handleAuthSuccessResponse } = useAuthResponse();
  const { incoming: incomingRequest, session: sessionPreferences } =
    MainStateMachineContext.useSelector((state) => state.context.requests);
  const { account } = useAccountContext();
  useEffect(() => {
    if (account && incomingRequest?.id) {
      console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥 handleAuthSuccessResponse');
      handleAuthSuccessResponse(
        { address: account.address },
        incomingRequest!,
        sessionPreferences,
      );
      windowService.close();
    }
  }, [account, handleAuthSuccessResponse, incomingRequest, sessionPreferences]);

  return (
    <div className="mt-6 flex flex-col gap-8 items-center justify-center text-center">
      <p className="text-gray-600 mb-4">Signup Request</p>
    </div>
  );
}
