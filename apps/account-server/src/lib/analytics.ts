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

/**
 * Automatically include partner_id in all events and group them for analytics 
 */
export const registerPostHogPartnerId = (partnerId: string) => {
  if (!partnerId || typeof window === 'undefined') {
    return;
  }

  try {
    posthog.register({ partner_id: partnerId });
    posthog.group('partner', partnerId);
  } catch (error) {
    console.warn('Failed to register partner_id with PostHog:', error);
  }
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

// Consent tracking functions
export const trackConsentScreenViewed = (
  source: string = 'first_data_source_connect',
  screenType: string = 'modal',
) => {
  posthog.capture('consent_screen_viewed', {
    source,
    screen_type: screenType,
    ...getGlobalProperties(),
  });
};

export const trackConsentOptionSelected = (
  option: 'personalization' | 'ads',
  action: 'accept' | 'reject',
) => {
  posthog.capture('consent_option_selected', {
    option,
    action,
    ...getGlobalProperties(),
  });
};

export const trackConsentAcceptAll = (
  options: Array<'personalization' | 'ads'> = ['personalization', 'ads'],
) => {
  posthog.capture('consent_accept_all', {
    options,
    action: 'accept_all',
    ...getGlobalProperties(),
  });
};

export const trackConsentContinue = (
  optionsSelected: {
    personalization: 'accept' | 'reject';
    ads: 'accept' | 'reject';
  },
  method: 'accept_all' | 'individual' = 'individual',
) => {
  posthog.capture('consent_continue', {
    options_selected: optionsSelected,
    method,
    ...getGlobalProperties(),
  });
};

export const trackConsentDismissed = (
  optionsSelected: {
    personalization: 'accept' | 'reject' | 'pending';
    ads: 'accept' | 'reject' | 'pending';
  },
  dismissReason: 'modal_closed' | 'navigated_away' | 'session_timeout',
) => {
  posthog.capture('consent_dismissed', {
    options_selected: optionsSelected,
    dismiss_reason: dismissReason,
    ...getGlobalProperties(),
  });
};

export const trackPageReady = () => {
  posthog.capture('page_ready', {
    timestamp: new Date().toISOString(),
    ...getGlobalProperties(),
  });
};

export const trackAccountCreated = (
  accountAddress: string,
  accountType: 'passkey' | 'eoa',
  authMethod?: 'wallet' | 'passkey' | 'social',
) => {
  posthog.capture('account_created', {
    account_address: accountAddress,
    account_type: accountType,
    auth_method: authMethod,
    timestamp: new Date().toISOString(),
    ...getGlobalProperties(),
  });
};

