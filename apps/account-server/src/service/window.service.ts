import { isSSR } from '@sophon-labs/account-core';
import type { FromWebActions } from '@sophon-labs/account-message-bridge';
import {
  registerRNHandler,
  sendMessageToRN,
} from '@sophon-labs/account-message-bridge';
import { logWithUser } from '@/debug/log';
import { env } from '@/env';

/**
 * Simple interface to be used by all possible comnunications services,
 * usually they are related to windows or iframes.
 */
interface WindowCommunicationService {
  name: string;

  /**
   * @returns if this service is active
   */
  isManaged: () => boolean;

  /**
   * Reloads the current attached window to the communication bridge
   */
  reload: () => void;

  /**
   * Execute actions related to closing the active window
   */
  close: () => void;

  /**
   * Sends a message to the active window
   */
  sendMessage: (message: unknown) => void;

  /**
   * Emits a token to the bridge
   */
  emitAccessToken: (token: string, expiresAt: number) => void;

  /**
   * Emits a refresh token to the bridge
   */
  emitRefreshToken: (refreshToken: string, expiresAt: number) => void;

  /**
   * Sends logout signal to the bridge
   */
  logout: () => void;

  /**
   * @returns if this service represents a mobile environment
   */
  isMobile: () => boolean;

  listen: (callback: (message: unknown) => void) => () => void;
}

const noopWindowService: WindowCommunicationService = {
  name: 'noop',

  isManaged: () => false,

  reload: () => {},

  close: () => {},

  sendMessage: (message: unknown) => {
    alert(`sendMessage noop ${JSON.stringify(message)}`);
  },

  emitAccessToken: (token: string, expiresAt: number) => {
    console.log('Token emitted (noop):', token, 'expiresAt:', expiresAt);
  },

  emitRefreshToken: (refreshToken: string, expiresAt: number) => {
    console.log(
      'Refresh Token emitted (noop):',
      refreshToken,
      'expiresAt:',
      expiresAt,
    );
  },

  logout: () => {
    console.log('Logout (noop)');
  },

  isMobile: () => false,

  listen: () => {
    return () => {};
  },
};

const popupWindowService: WindowCommunicationService = {
  name: 'popup',

  isManaged: () => !isSSR() && !!window.opener,

  reload: () => {
    window.location.reload();
  },

  close: () => {
    window.opener.postMessage({ event: 'PopupUnload' }, '*');
  },

  sendMessage: (message: unknown) => {
    window.opener.postMessage(message, '*');
  },

  emitAccessToken: (value: string, expiresAt: number) => {
    window.opener.postMessage(
      { type: 'access.token', payload: { value, expiresAt } },
      '*',
    );
  },

  emitRefreshToken: (value: string, expiresAt: number) => {
    window.opener.postMessage(
      { type: 'refresh.token', payload: { value, expiresAt } },
      '*',
    );
  },

  logout: () => {
    window.opener.postMessage({ type: 'logout' }, '*');
  },

  isMobile: () => false,

  listen: (callback: (message: unknown) => void) => {
    const listener = (event: MessageEvent) => {
      callback(event.data);
    };
    window.addEventListener('message', listener);

    return () => {
      window.removeEventListener('message', listener);
    };
  },
};

const embeddedWindowService: WindowCommunicationService = {
  name: 'embedded',

  isManaged: () => !isSSR() && !!window.parent,

  reload: () => {
    window.location.reload();
  },

  close: () => {
    sendMessageToRN('closeModal', {});
  },

  sendMessage: (message: unknown) => {
    sendMessageToRN('rpc', message as FromWebActions['rpc']);
  },

  emitAccessToken: (value: string, expiresAt: number) => {
    sendMessageToRN('account.access.token.emitted', { value, expiresAt });
  },

  emitRefreshToken: (value: string, expiresAt: number) => {
    sendMessageToRN('account.refresh.token.emitted', {
      value,
      expiresAt,
    });
  },

  logout: () => {
    sendMessageToRN('logout', null);
  },

  isMobile: () => true,

  listen: (callback: (message: unknown) => void) => {
    return registerRNHandler('rpc', callback);
  },
};

const webViewWindowService: WindowCommunicationService = {
  name: 'webview',

  isManaged: () => !isSSR() && !!window.ReactNativeWebView,

  reload: () => {},

  close: () => {
    sendMessageToRN('closeModal', {});
    logWithUser('closed auth modal');
  },

  sendMessage: (message: unknown) => {
    sendMessageToRN('rpc', message as FromWebActions['rpc']);
    logWithUser(`sent RPC message to webview: ${JSON.stringify(message)}`);
  },

  emitAccessToken: (value: string, expiresAt: number) => {
    sendMessageToRN('account.access.token.emitted', { value, expiresAt });
    logWithUser('emitted an access token');
  },

  emitRefreshToken: (value: string, expiresAt: number) => {
    sendMessageToRN('account.refresh.token.emitted', {
      value,
      expiresAt,
    });
    logWithUser('emitted a refresh token');
  },

  logout: () => {
    sendMessageToRN('logout', null);
    logWithUser('logged out');
  },

  isMobile: () => true,

  listen: (callback: (message: unknown) => void) => {
    return registerRNHandler('rpc', callback);
  },
};

const availableServices: WindowCommunicationService[] = [
  popupWindowService,
  webViewWindowService,
  ...(env.NEXT_PUBLIC_EMBEDDED_FLOW_ENABLED ? [embeddedWindowService] : []),
];

class DelegateWindowService implements WindowCommunicationService {
  proxy: WindowCommunicationService;
  constructor() {
    this.proxy =
      availableServices.find((service) => service.isManaged()) ||
      noopWindowService;
  }

  public get name() {
    return this.proxy.name;
  }

  isManaged = () => this.proxy.isManaged();

  reload = () => this.proxy.reload();

  close = () => this.proxy.close();

  sendMessage = (message: unknown) => this.proxy.sendMessage(message);

  emitAccessToken = (token: string, expiresAt: number) =>
    this.proxy.emitAccessToken(token, expiresAt);

  emitRefreshToken = (refreshToken: string, expiresAt: number) =>
    this.proxy.emitRefreshToken(refreshToken, expiresAt);

  logout = () => this.proxy.logout();

  isMobile = () => this.proxy.isMobile();

  listen = (callback: (message: unknown) => void) =>
    this.proxy.listen(callback);
}

export const windowService = new DelegateWindowService();
