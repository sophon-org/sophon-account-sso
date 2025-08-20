import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDisconnect } from 'wagmi';
import { IconGreenCheck } from '@/components/icons/icons-green-check';
import { Loader } from '@/components/loader';
import { useAccountContext } from '@/hooks/useAccountContext';
import { LOCAL_STORAGE_KEY } from '@/lib/constants';

type LogoutState = 'logging-out' | 'success';

export const LogoutView = () => {
  const { disconnect } = useDisconnect();
  const { logout } = useAccountContext();
  const { handleLogOut, user } = useDynamicContext();
  const hasLoggedOut = useRef(false);
  const [logoutState, setLogoutState] = useState<LogoutState>('logging-out');

  const handleLogout = useCallback(async () => {
    if (hasLoggedOut.current) {
      return;
    }

    setLogoutState('logging-out');

    try {
      if (user) {
        // handle Dynamic logout on 6963 event
        // set the flag to true to prevent multiple logouts
        hasLoggedOut.current = true;
        await handleLogOut();
      } else {
        // manually remove the local storage key and disconnect wagmi/walletconnect
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        disconnect();
        logout();
      }

      setLogoutState('success');

      setTimeout(() => {
        window.close();
      }, 2500);
    } catch (error) {
      console.error('Logout failed:', error);
      setLogoutState('success');
      setTimeout(() => {
        window.close();
      }, 2500);
    }
  }, [handleLogOut, user, disconnect, logout]);

  useEffect(() => {
    setTimeout(() => {
      handleLogout();
    }, 2000);
  }, [handleLogout]);

  const renderLoggingOut = () => (
    <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
      <Loader className="w-10 h-10 border-gray-500 border-r-transparent" />
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Securely closing your session...
        </p>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-500">
      <IconGreenCheck className="w-10 h-10" />

      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-green-600">
          Successfully logged out!
        </h2>
        <p className="text-sm text-muted-foreground">
          Your session has been securely closed
        </p>
      </div>

      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
        <span>Closing window...</span>
      </div>
    </div>
  );

  return (
    <div className="gap-8 mt-6 flex flex-grow flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="w-full max-w-sm">
        <div>
          {logoutState === 'logging-out' && renderLoggingOut()}
          {logoutState === 'success' && renderSuccess()}
        </div>
      </div>
    </div>
  );
};
