import { useMemo } from 'react';
import { useSophonContext } from './use-sophon-context';

export const useSophonAccount = () => {
  const { provider, account } = useSophonContext();

  // const connect = useCallback(async () => {
  //   const addresses = await walletClient!.requestAddresses();
  //   setAccount({
  //     address: addresses[0],
  //   });
  // }, [walletClient, setAccount]);

  const isConnected = useMemo(() => !!account, [account]);

  // const showProfile = useCallback(async () => {
  //   if (account) {
  //     // sendUIMessage('showModal', {});
  //   }
  // }, [account]);

  return {
    isConnected,
    account,
    provider,
  };
};
