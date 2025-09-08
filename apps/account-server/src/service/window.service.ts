import type { FromWebActions } from '@sophon-labs/account-message-bridge';
import {
  registerRNHandler,
  sendMessageToRN,
} from '@sophon-labs/account-message-bridge';
import { env } from '@/env';
import { isSSR } from '@/lib/is-ssr';

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
  emitToken: (token: string) => void;

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

  emitToken: (token: string) => {
    console.log('Token emitted (noop):', token);
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

  emitToken: (token: string) => {
    window.opener.postMessage({ type: 'token', payload: token }, '*');
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

  emitToken: (token: string) => {
    sendMessageToRN('account.token.emitted', token);
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
  },

  sendMessage: (message: unknown) => {
    sendMessageToRN('rpc', message as FromWebActions['rpc']);
  },

  emitToken: (token: string) => {
    sendMessageToRN('account.token.emitted', token);
  },

  logout: () => {
    sendMessageToRN('logout', null);
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

  emitToken = (token: string) => this.proxy.emitToken(token);

  logout = () => this.proxy.logout();

  isMobile = () => this.proxy.isMobile();

  listen = (callback: (message: unknown) => void) =>
    this.proxy.listen(callback);
}

export const windowService = new DelegateWindowService();
