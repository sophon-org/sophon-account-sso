import { useCallback, useMemo } from 'react';
import type { Address } from 'viem';
import { dynamicClient } from '../lib/dynamic';
import { sendUIMessage } from '../messaging';
import { getRefusedRPC } from '../messaging/utils';
import { useSophonContext } from './use-sophon-context';

// const getSmartAccount = async (owner: Address) => {
//   const response = await fetch(
//     `http://localhost:4001/contract/by-owner/${owner}`,
//   );
//   return response.json();
// };

// const deploySmartAccount = async (owner: Address) => {
//   const response = await fetch(`http://localhost:4001/contract/${owner}`, {
//     method: 'POST',
//   });
//   return response.json();
// };

export const useFlowManager = () => {
  const { currentRequest, setCurrentRequest, setAccount } = useSophonContext();
  const method = useMemo(() => {
    // biome-ignore lint/suspicious/noExplicitAny: to type better later
    const content: any = currentRequest?.content;
    return content?.action?.method;
  }, [currentRequest]);

  const clearCurrentRequest = useCallback(() => {
    setCurrentRequest(undefined);
  }, []);

  const waitForAuthentication = useCallback(async () => {
    return new Promise<Address>((resolve, reject) => {
      // dynamicClient.auth.on('authSuccess', (data) => {
      //   console.log('authSuccess', data);
      //   resolve(data);
      // });

      dynamicClient.wallets.on('primaryChanged', (data) => {
        console.log('primaryChanged', data);
        if (data?.address) {
          resolve(data.address as Address);
        } else {
          reject(new Error('No primary wallet found'));
        }
      });

      dynamicClient.auth.on('authFailed', (data) => {
        reject(data);
      });
    });
  }, []);

  const authenticate = useCallback(async (owner: Address) => {
    // const account = await getSmartAccount(owner);

    // if (!account) {
    //   const response = await deploySmartAccount(owner);
    //   account = response.address;
    // }

    // if (!account) {
    //   throw new Error('Failed to deploy smart account');
    // }

    setAccount({
      address: owner,
      owner: owner,
    });
    // setCurrentRequest(undefined);
  }, []);

  const authorize = useCallback(async () => {
    // request nonce
    // request signature
    // exchange tokens
    // save tokens
    setCurrentRequest(undefined);
  }, []);

  const consent = useCallback(async () => {
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
    actions: {
      authenticate,
      authorize,
      consent,
      waitForAuthentication,
    },
  };
};
