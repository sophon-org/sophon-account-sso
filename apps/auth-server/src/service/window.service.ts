import {
  registerRNHandler,
  sendMessageToRN,
} from '@sophon-labs/account-message-bridge';
import type { FromWebActions } from '@sophon-labs/account-message-bridge/dist/src/messages';
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
    window.close();
  },

  sendMessage: (message: unknown) => {
    // alert(`sendMessage webview ${JSON.stringify(message)}`);
    window.opener.postMessage(message, '*');
  },

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

const webViewWindowService: WindowCommunicationService = {
  name: 'webview',

  isManaged: () => !isSSR() && !!window.ReactNativeWebView,

  reload: () => {},

  close: () => {
    sendMessageToRN('closeModal', {});
  },

  sendMessage: (message: unknown) => {
    // alert(`sendMessage webview ${JSON.stringify(message)}`);
    sendMessageToRN('rpc', message as FromWebActions['rpc']);
  },

  listen: (callback: (message: unknown) => void) => {
    console.log('listen webview');
    return registerRNHandler('rpc', callback);
  },
};

const availableServices: WindowCommunicationService[] = [
  popupWindowService,
  webViewWindowService,
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

  listen = (callback: (message: unknown) => void) =>
    this.proxy.listen(callback);
}

export const windowService = new DelegateWindowService();
