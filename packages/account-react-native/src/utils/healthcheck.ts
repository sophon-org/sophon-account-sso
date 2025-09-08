/**
 * WebView Healthcheck Utility
 * Quick server availability check before operations
 */

/**
 * Performs a quick server availability check using HEAD request
 * @param url The auth server URL
 * @param timeout Request timeout in milliseconds (default: 3000)
 * @returns Promise resolving to true if server is available
 */
export async function quickHealthCheck(
  url: string, 
  timeout: number = 3000
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Use HEAD for faster check - same as in connect() method
    const response = await fetch(`${url}/api/health`, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ [HEALTHCHECK] Server is available');
      return true;
    } else {
      console.log('⚠️ [HEALTHCHECK] Server returned status:', response.status);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ [HEALTHCHECK] Server unavailable:', errorMessage);
    return false;
  }
}
