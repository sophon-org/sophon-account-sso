import { useCallback, useMemo } from 'react';
import { sendUIMessage } from '../messaging';
import { getRefusedRPC } from '../messaging/utils';
import { useSophonContext } from './use-sophon-context';

export const useFlowManager = () => {
  const { currentRequest, setCurrentRequest } = useSophonContext();
  const method = useMemo(() => {
    // biome-ignore lint/suspicious/noExplicitAny: to type better later
    const content: any = currentRequest?.content;
    return content?.action?.method;
  }, [currentRequest]);

  const clearCurrentRequest = useCallback(() => {
    setCurrentRequest(undefined);
  }, []);

  return {
    hasRequest: !!currentRequest,
    method,
    currentRequest,
    setCurrentRequest,
    clearCurrentRequest,
    cancelCurrentRequest: () => {
      if (currentRequest?.id) {
        sendUIMessage('incomingRpc', getRefusedRPC(currentRequest.id));
        clearCurrentRequest();
      }
    },
  };
};
