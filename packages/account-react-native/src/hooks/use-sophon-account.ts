import { useCallback, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import type { Address } from 'viem';
import { sendUIMessage, useUIEventHandler } from '../messaging';
import { useSophonContext } from './use-sophon-context';

export const useSophonAccount = () => {
  const { walletClient, setAccount, provider, account, disconnect, authServerUrl } =
    useSophonContext();

  // 🚀 Store single active connection Promise
  const currentConnection = useRef<{ resolve: Function; reject: Function; timeoutId: NodeJS.Timeout } | null>(null);

  // Handle status/results from wallet web app (WebView)
  useUIEventHandler('webWalletStatus', useCallback((result: { success: boolean; error?: string; account?: any }) => {
    console.log('🚀 RECEIVED webWalletStatus:', JSON.stringify(result, null, 2));
    
    const connection = currentConnection.current;
    console.log('🚀 Current connection exists:', !!connection);
    
    if (connection) {
      // Clear timeout and connection
      clearTimeout(connection.timeoutId);
      currentConnection.current = null;
      console.log('🚀 Cleared connection timeout and state');
      
      if (result.success && result.account) {
        console.log('✅ RESOLVING Promise with account:', result.account);
        
        // Set account in context
        setAccount({
          address: result.account[0] as Address,
        });
        
        connection.resolve(result.account);
      } else {
        const errorMessage = result.error || 'Connection failed';
        console.log('❌ REJECTING Promise with error:', errorMessage);
        connection.reject(new Error(errorMessage));
      }
    } else {
      console.log('⚠️ No active connection to handle webWalletStatus - was Promise already resolved/rejected?');
    }
  }, [setAccount]));

  const connect = useCallback(async (): Promise<Address[]> => {
    // 🔥 LOG: Check that changes from sophon-account-sso reach the mobile app
    console.log('💎 [sophon-account-sso] connect() called from package!', new Date().toLocaleTimeString());
    
    // Only one connection at a time
    if (currentConnection.current) {
      throw new Error('Connection already in progress');
    }
    
            // 🚀 Pre-check server availability using context URL
        console.log('🔍 Pre-checking server availability:', authServerUrl);
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(`${authServerUrl}/api/health`, {
            method: 'GET',
            signal: controller.signal,
          });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      console.log('✅ Server is available, proceeding with WebView...');
            } catch (error) {
          console.log('❌ Server pre-check failed:', error);
          throw new Error(`Server unavailable - ${authServerUrl} is not accessible. Please start the development server.`);
        }
    
    return new Promise((resolve, reject) => {
      const timeout = 30000; // 30 seconds default timeout
      console.log('🚀 Creating new Promise for connection with timeout:', timeout + 'ms');
      
      // Set timeout for Promise rejection
      const timeoutId = setTimeout(() => {
        if (currentConnection.current) {
          console.log('⏰ CONNECTION TIMEOUT after', timeout + 'ms');
          currentConnection.current = null;
          reject(new Error('Connection timeout - no response after ' + timeout + 'ms'));
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
        clearTimeout(timeoutId);
        currentConnection.current = null;
        reject(error);
      }
    });
  }, []);

  const isConnected = useMemo(() => !!account, [account]);

  const showProfile = useCallback(async () => {
    console.log('🚀 showProfile called!', { account });
    Alert.alert(
      'Profile Action 2', 
      `showProfile called with account: ${account?.address || 'No account'}`, 
      [{ text: 'OK' }]
    );
    
    if (account) {
      sendUIMessage('showModal', {});
    }
  }, [account]);

  return {
    // ✅ Main account functionality
    isConnected,
    connect,
    disconnect,
    account,
    provider,
    walletClient,
    showProfile,
    

  };
};
