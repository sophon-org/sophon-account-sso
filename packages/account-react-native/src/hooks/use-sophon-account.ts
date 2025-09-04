import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Address } from 'viem';
import { sendUIMessage, useUIEventHandler } from '../messaging';

import { useSophonContext } from './use-sophon-context';

export const useSophonAccount = () => {
  const { walletClient, setAccount, provider, account, disconnect, sdkStatus, authServerUrl } =
    useSophonContext();

  // 🚀 Store single active connection Promise with extended timeout on user activity
  const currentConnection = useRef<{ resolve: Function; reject: Function; timeoutId: NodeJS.Timeout } | null>(null);

  // 🚀 Connection state management (moved from apps to SDK)
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // 🔧 Cleanup active timeouts on component unmount (prevents race conditions after Metro restart)
  useEffect(() => {
    return () => {
      console.log('🧹 [CLEANUP] Clearing active connection timeouts on unmount');
      const connection = currentConnection.current;
      if (connection) {
        clearTimeout(connection.timeoutId);
        currentConnection.current = null;
      }
    };
  }, []);

  // 🔄 Function to extend timeout when user is active
  const extendConnectionTimeout = useCallback(() => {
    const connection = currentConnection.current;
    if (connection) {
      console.log('🔄 [TIMEOUT-EXTEND] User activity detected - extending connection timeout');
      
      // Clear old timeout
      clearTimeout(connection.timeoutId);
      
      // Set much longer timeout (10 minutes) - auto-recovery handles hung WebViews faster
      const newTimeoutId = setTimeout(() => {
        if (currentConnection.current) {
          console.log('⏰ CONNECTION TIMEOUT after very long period (10min) - this suggests system recovery failed');
          const timeoutError = 'Connection timeout - no response after extended period';
          setIsConnecting(false);
          setConnectionError(timeoutError);
          currentConnection.current = null;
          connection.reject(new Error(timeoutError));
        }
      }, 600000); // 10 minutes instead of 2
      
      // Update stored timeout ID
      connection.timeoutId = newTimeoutId;
    }
  }, []);

  // Handle status/results from wallet web app (WebView)
  useUIEventHandler('webWalletStatus', useCallback((result: { success: boolean; error?: string; account?: any }) => {
    console.log('🔍 [UNRESPONSIVE-DEBUG] RECEIVED webWalletStatus:', JSON.stringify(result, null, 2));
    
    // SDK status is now managed globally in SophonContext
    
    const connection = currentConnection.current;
    console.log('🔍 [UNRESPONSIVE-DEBUG] Current connection exists:', !!connection);
    
    if (connection) {
      // Clear timeout and connection
      clearTimeout(connection.timeoutId);
      currentConnection.current = null;
      console.log('🔍 [UNRESPONSIVE-DEBUG] Cleared connection timeout and state');
      
      // ✅ Clear any stale connection errors on ANY response from WebView
      if (connectionError) {
        console.log('✅ [WEBVIEW-RESPONSE] Clearing stale connection error on WebView response');
        setConnectionError(null);
      }
      
      if (result.success && result.account) {
        console.log('✅ [UNRESPONSIVE-DEBUG] RESOLVING Promise with account:', result.account);
        
        // Set account in context
        setAccount({
          address: result.account[0] as Address,
        });
        
        // 🚀 Update connection state
        setIsConnecting(false);
        setConnectionError(null);
        
        connection.resolve(result.account);
      } else {
        const errorMessage = result.error || 'Connection failed';
        console.log('❌ [UNRESPONSIVE-DEBUG] REJECTING Promise with error:', errorMessage);
        
        // 🚀 Update connection state
        setIsConnecting(false);
        setConnectionError(errorMessage);
        
        connection.reject(new Error(errorMessage));
      }
    } else {
      console.log('⚠️ [UNRESPONSIVE-DEBUG] No active connection to handle webWalletStatus - was Promise already resolved/rejected?');
    }
  }, [setAccount]));

  // 🚀 Handle modal hiding (user closed WebView) - clear connection state
  useUIEventHandler('hideModal', useCallback(() => {
    console.log('🔍 [HIDE-MODAL-DEBUG] hideModal received - checking for active connection');
    
    const connection = currentConnection.current;
    if (connection) {
      console.log('❌ [HIDE-MODAL-DEBUG] User closed modal with active connection - cancelling Promise');
      
      // Clear timeout and connection
      clearTimeout(connection.timeoutId);
      currentConnection.current = null;
      
      // 🚀 Update connection state to cancelled
      setIsConnecting(false);
      setConnectionError(null); // Don't show error for user cancellation
      
      // Reject Promise with cancellation error
      connection.reject(new Error('User cancelled connection'));
    } else {
      console.log('🔍 [HIDE-MODAL-DEBUG] No active connection to cancel');
    }
  }, []));

  // 🔄 Handle modal ready (user sees interface) - extend timeout and clear stale errors
  useUIEventHandler('modalReady', useCallback(() => {
    console.log('🔄 [TIMEOUT-EXTEND] Modal ready - user can now interact, extending timeout');
    
    // ✅ Clear any stale connection errors when WebView loads successfully  
    if (connectionError) {
      console.log('✅ [MODAL-READY] Clearing stale connection error:', connectionError);
      setConnectionError(null);
    }
    
    extendConnectionTimeout();
  }, [extendConnectionTimeout, connectionError]));

  // 🚀 Handle server recovery - clear connection errors
  useUIEventHandler('serverRecovered', useCallback(() => {
    console.log('✅ [SERVER-RECOVERED] Server came back online - clearing connection error');
    if (connectionError) {
      console.log('✅ [SERVER-RECOVERED] Clearing server unavailable error:', connectionError);
      setConnectionError(null);
    }
  }, [connectionError]));

  // SDK status updates are now handled globally in SophonContext

  // 🚨 Handle critical SDK errors (server crashes, WebView failures during transactions)
  const [onCriticalError, setOnCriticalError] = useState<((error: any) => void) | null>(null);
  
  useUIEventHandler('sdkCriticalError', useCallback((error) => {
    console.log('🚨 [SDK-CRITICAL] Critical error occurred:', error);
    
    // Call user-provided error handler if available
    if (onCriticalError) {
      try {
        console.log('🚀 [SDK-CRITICAL] Calling user error handler');
        onCriticalError(error);
      } catch (handlerError) {
        console.error('🚨 [SDK-CRITICAL] User error handler threw:', handlerError);
      }
    } else {
      console.log('⚠️ [SDK-CRITICAL] No user error handler set - error logged only');
    }
  }, [onCriticalError]));

  const connect = useCallback(async (): Promise<Address[]> => {
    // 🔥 LOG: Check that changes from sophon-account-sso reach the mobile app
    console.log('💎 [sophon-account-sso] connect() called from package!', new Date().toLocaleTimeString());
    
    // SDK status updates are handled globally in SophonContext
    
    // Only one connection at a time
    if (currentConnection.current) {
      throw new Error('Connection already in progress');
    }

    // 🚀 Set connecting state and clear previous error
    setIsConnecting(true);
    setConnectionError(null);
    
    // 🚀 Fast server health check with HEAD request (faster than GET)
    console.log('🔍 [HEALTH-CHECK] Quick server availability check before showing WebView');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout for health check

      const response = await fetch(`${authServerUrl}/api/health`, {
        method: 'HEAD', // ← HEAD instead of GET - faster!
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      console.log('✅ [HEALTH-CHECK] Server is available, proceeding with WebView...');
    } catch (error) {
      console.log('❌ [HEALTH-CHECK] Server unavailable:', error);
      
      // 🚀 NOTIFY SYSTEM: Tell main-view that server is down so it starts health monitoring  
      if (authServerUrl) {
        sendUIMessage('serverUnavailable', { authServerUrl });
      }
      
      const serverError = `Server unavailable - please start the development server on ${authServerUrl}`;
      setIsConnecting(false);
      setConnectionError(serverError);
      
      throw new Error(serverError);
    }
    
    return new Promise((resolve, reject) => {
      const timeout = 600000; // 10 minutes - auto-recovery handles hung WebViews faster than this
      console.log('🚀 Creating new Promise for connection with timeout:', timeout + 'ms');
      
      // Set timeout for Promise rejection
      const timeoutId = setTimeout(() => {
        if (currentConnection.current) {
          console.log('⏰ CONNECTION TIMEOUT after', timeout + 'ms - this suggests system recovery completely failed');
          const timeoutError = 'Connection timeout - system recovery failed after 10 minutes';
          setIsConnecting(false);
          setConnectionError(timeoutError);
          currentConnection.current = null;
          reject(new Error(timeoutError));
        }
      }, timeout);
      
      // Store connection resolvers with timeout
      currentConnection.current = { resolve, reject, timeoutId };
      console.log('🚀 Stored connection Promise resolvers');
      
      try {
        console.log('🚀 Sending showModal to WebView...');
        sendUIMessage('showModal', {});
      } catch (error) {
        console.log('❌ Failed to send showModal:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to show modal';
        setIsConnecting(false);
        setConnectionError(errorMessage);
        clearTimeout(timeoutId);
        currentConnection.current = null;
        reject(error);
      }
    });
  }, []);

  const isConnected = useMemo(() => !!account, [account]);

  const showProfile = useCallback(async () => {
    console.log('🔍 [DRAWER-DEBUG] showProfile called manually by user', { 
      hasAccount: !!account,
      address: account?.address,
      timestamp: new Date().toLocaleTimeString()
    });
    
    if (account) {
      console.log('🔍 [DRAWER-DEBUG] Sending showModal from showProfile (user action)');
      sendUIMessage('showModal', {});
    } else {
      console.log('⚠️ [DRAWER-DEBUG] Cannot show profile - no account connected');
    }
  }, [account]);

  // 🔍 PROBLEM 3 DEBUG: Enhanced disconnect is already provided by context
  // We'll add logging to the context version instead of duplicating here

  return {
    // ✅ Main account functionality
    isConnected,
    connect,
    disconnect,
    account,
    provider,
    walletClient,
    showProfile,
    
    // 🚀 Connection state management (moved from apps to SDK)
    isConnecting,
    connectionError,
    
    // 🚀 Safe SDK status monitoring (read-only, never throws)
    sdkStatus,
    
    // 🚨 Set critical error handler for post-connect operations
    setCriticalErrorHandler: (handler: (error: any) => void) => {
      console.log('🔍 [SDK-CRITICAL] User set critical error handler');
      setOnCriticalError(() => handler);
    },
    
    // 🔍 Remove critical error handler
    removeCriticalErrorHandler: () => {
      console.log('🔍 [SDK-CRITICAL] User removed critical error handler');
      setOnCriticalError(null);
    },

  };
};
