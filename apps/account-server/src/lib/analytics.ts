import posthog from 'posthog-js';
import { LOCAL_STORAGE_KEY } from './constants';

const getGlobalProperties = () => {
  const properties: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    user_agent:
      typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    is_mobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  };

  // Add user address if available in localStorage
  const storedAccount = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (storedAccount) {
    const account = JSON.parse(storedAccount);
    if (account?.address) {
      properties.user_address = account.address;
    }
  }

  return properties;
};

export const identifyUser = (
  smartContractAddress: string,
  properties?: {
    username?: string;
    email?: string;
    authMethod?: 'wallet' | 'passkey' | 'social';
    walletType?: string;
    createdAt?: string;
    lastLoginAt?: string;
  },
) => {
  posthog.identify(smartContractAddress, {
    smart_contract_address: smartContractAddress,
    identified_at: new Date().toISOString(),
    ...properties,
  });

  if (properties) {
    posthog.people.set({
      smart_contract_address: smartContractAddress,
      ...properties,
    });
  }
};

export const updateUserProperties = (properties: Record<string, unknown>) => {
  posthog.people.set(properties);
};

export const trackAuthMethodSelected = (
  method: 'wallet' | 'email' | 'social',
  provider?: string,
) => {
  posthog.capture('auth_method_selected', {
    method,
    social_provider: provider,
    ...getGlobalProperties(),
  });
};

export const trackAuthStarted = (
  method: 'wallet' | 'email' | 'social',
  provider?: string,
) => {
  posthog.capture('auth_started', {
    method,
    social_provider: provider,
    start_time: Date.now(),
    ...getGlobalProperties(),
  });

  // Store start time for duration calculation
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(`auth_start_${method}`, Date.now().toString());
  }
};

export const trackAuthCompleted = (
  method: 'wallet' | 'email' | 'social',
  duration?: number,
) => {
  // Calculate duration if not provided
  let calculatedDuration = duration;
  if (!calculatedDuration && typeof window !== 'undefined') {
    const startTime = window.localStorage.getItem(`auth_start_${method}`);
    if (startTime) {
      calculatedDuration = Date.now() - parseInt(startTime, 10);
      window.localStorage.removeItem(`auth_start_${method}`);
    }
  }

  posthog.capture('auth_completed', {
    method,
    duration_ms: calculatedDuration,
    ...getGlobalProperties(),
  });
};

export const trackAuthFailed = (
  method: 'wallet' | 'email' | 'social',
  error: string,
  step?: string,
) => {
  posthog.capture('auth_failed', {
    method,
    error_message: error,
    step,
    ...getGlobalProperties(),
  });
};

export const trackDialogInteraction = (
  dialogType: string,
  action: 'opened' | 'closed' | 'back' | 'cancel',
) => {
  posthog.capture('dialog_interaction', {
    dialog_type: dialogType,
    action,
    ...getGlobalProperties(),
  });
};

export const trackNetworkEvent = (
  event:
    | 'wrong_network_detected'
    | 'network_switch_started'
    | 'network_switch_completed'
    | 'network_switch_failed',
  currentChain?: number,
  targetChain?: number,
  error?: string,
) => {
  posthog.capture('network_event', {
    event,
    current_chain: currentChain,
    target_chain: targetChain,
    error_message: error,
    ...getGlobalProperties(),
  });
};

export const trackSigningRequestReceived = (
  requestType: 'message' | 'typed_data' | 'transaction',
  dappOrigin?: string,
) => {
  posthog.capture('signing_request_received', {
    request_type: requestType,
    dapp_origin: dappOrigin,
    ...getGlobalProperties(),
  });
};

export const trackSigningRequestResult = (
  requestType: 'message' | 'typed_data' | 'transaction',
  approved: boolean,
  error?: string,
) => {
  posthog.capture('signing_request_result', {
    request_type: requestType,
    approved,
    error_message: error,
    ...getGlobalProperties(),
  });
};

export const trackTransactionRequest = (
  dappOrigin?: string,
  transactionValue?: string,
  paymaster?: string,
) => {
  posthog.capture('transaction_request_received', {
    dapp_origin: dappOrigin,
    transaction_value: transactionValue,
    paymaster: paymaster,
    ...getGlobalProperties(),
  });
};

export const trackTransactionResult = (
  approved: boolean,
  transactionHash?: string,
  error?: string,
) => {
  posthog.capture('transaction_request_result', {
    approved,
    transaction_hash: transactionHash,
    error_message: error,
    ...getGlobalProperties(),
  });
};
