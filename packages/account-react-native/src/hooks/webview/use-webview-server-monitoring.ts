import { useEffect, useRef } from 'react';
import { sendUIMessage } from '../../messaging/ui';

interface ServerMonitoringProps {
  serverAvailable: boolean;
  hasPendingRPC: boolean;
  authServerUrl?: string;
  setServerAvailable: (available: boolean) => void;
  setHasPendingRPC: (pending: boolean) => void;
  rpcTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

/**
 * Hook to monitor server health and handle server recovery
 * Periodically checks server health when unavailable or when RPC is pending
 */
export function useWebViewServerMonitoring({
  serverAvailable,
  hasPendingRPC,
  authServerUrl,
  setServerAvailable,
  setHasPendingRPC,
  rpcTimeoutRef
}: ServerMonitoringProps) {
  const healthCheckInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if ((!serverAvailable || hasPendingRPC) && authServerUrl) {
      const reason = !serverAvailable ? 'server recovery' : 'pending RPC monitoring';
      console.log(`🔍 [SERVER-HEALTH] Starting health check interval for ${reason}`);
      
      healthCheckInterval.current = setInterval(async () => {
        try {
          console.log(`🔍 [SERVER-HEALTH] Checking server (${reason})...`);
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 3000);
          
          const response = await fetch(`${authServerUrl}/api/health`, {
            method: 'GET',
            signal: controller.signal,
          });
          
          if (response.ok) {
            console.log('✅ [SERVER-HEALTH] Server is alive!');
            setServerAvailable(true);
            
            // Notify that server recovered
            sendUIMessage('serverRecovered', {});
            
            // If we had pending RPC and server is alive, it means RPC is stuck
            if (hasPendingRPC) {
              console.log('🚨 [RPC-INFLIGHT] Server alive but RPC pending - server may have crashed during RPC!');
              console.log('🔄 [RPC-INFLIGHT] Reloading WebView to recover from stuck RPC...');
              
              // Send critical error to app
              sendUIMessage('sdkCriticalError', {
                type: 'server_crash',
                message: 'Server crashed during authentication/transaction. Connection recovered automatically.',
                timestamp: Date.now(),
                recoverySuggestion: 'Please retry your transaction'
              });
              
              // Clear stuck RPC state
              setHasPendingRPC(false);
              if (rpcTimeoutRef.current) {
                clearTimeout(rpcTimeoutRef.current);
                rpcTimeoutRef.current = null;
              }
              
              // Reject any pending connection
              sendUIMessage('webWalletStatus', { 
                success: false, 
                error: 'Server crashed during authentication. Please try again.'
              });
              
              console.log('🚨 [RELOAD-DISABLED] Skipping WebView reload to prevent loops');
            }
            
            // Clear health check interval if server recovered
            if (healthCheckInterval.current) {
              clearInterval(healthCheckInterval.current);
              healthCheckInterval.current = null;
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log('🔍 [SERVER-HEALTH] Server still unavailable:', errorMessage);
          
          // If RPC was pending and server is down, reject immediately
          if (hasPendingRPC) {
            console.log('🚨 [RPC-INFLIGHT] Server down + pending RPC = reject immediately');
            
            sendUIMessage('sdkCriticalError', {
              type: 'connection_lost',
              message: 'Lost connection to server during authentication/transaction',
              timestamp: Date.now(),
              recoverySuggestion: 'Please check server status and retry'
            });
            
            setHasPendingRPC(false);
            sendUIMessage('webWalletStatus', { 
              success: false, 
              error: 'Server became unavailable during authentication'
            });
          }
        }
      }, 5000); // Check every 5 seconds for faster recovery
    }

    // Cleanup on unmount
    return () => {
      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
        healthCheckInterval.current = null;
      }
      if (rpcTimeoutRef.current) {
        clearTimeout(rpcTimeoutRef.current);
        rpcTimeoutRef.current = null;
      }
    };
  }, [serverAvailable, hasPendingRPC, authServerUrl, setServerAvailable, setHasPendingRPC, rpcTimeoutRef]);
}
