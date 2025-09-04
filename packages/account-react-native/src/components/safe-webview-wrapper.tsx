import React from 'react';
import { View, Text } from 'react-native';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface SafeWebViewWrapperProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error Boundary for WebView to prevent app crashes
 * PROBLEM 4 DEBUG: Catches WebView-related crashes
 */
export class SafeWebViewWrapper extends React.Component<SafeWebViewWrapperProps, ErrorBoundaryState> {
  constructor(props: SafeWebViewWrapperProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.log('🚨 [CRASH-DEBUG] Error Boundary caught error:', error.message);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // ✅ Use console.log instead of console.error to avoid red screen
    console.log('🚨 [CRASH-DEBUG] WebView Error Boundary caught (gracefully handled):', {
      error: error.message,
      componentStack: errorInfo.componentStack?.slice(0, 300) || 'No stack trace',
      timestamp: new Date().toLocaleTimeString()
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      console.log('🔍 [CRASH-DEBUG] Rendering error fallback UI');
      
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            🚨 WebView Error
          </Text>
          <Text style={{ fontSize: 14, textAlign: 'center', color: '#666' }}>
            The wallet interface encountered an error. Please try again.
          </Text>
          <Text style={{ fontSize: 12, marginTop: 10, color: '#999' }}>
            Error: {this.state.error?.message || 'Unknown error'}
          </Text>
        </View>
      );
    }

    return <>{this.props.children}</>;
  }
}
