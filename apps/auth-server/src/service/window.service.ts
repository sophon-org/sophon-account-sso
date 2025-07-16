import { isSSR } from "@/lib/is-ssr";

/**
 * Simple interface to be used by all possible comnunications services,
 * usually they are related to windows or iframes.
 */
interface WindowCommunicationService {
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
}

const noopWindowService: WindowCommunicationService = {
  isManaged: () => false,

  reload: () => {},

  close: () => {},

  sendMessage: () => {},
};

const popupWindowService: WindowCommunicationService = {
  isManaged: () => !isSSR() && !!window.opener,

  reload: () => {
    window.location.reload();
  },

  close: () => {
    window.close();
  },

  sendMessage: (message: unknown) => {
    window.opener.postMessage(message, "*");
  },
};

const webViewWindowService: WindowCommunicationService = {
  isManaged: () => !isSSR() && !!window.ReactNativeWebView,

  reload: () => {},

  close: () => {},

  sendMessage: () => {},
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

  isManaged = () => this.proxy.isManaged();

  reload = () => this.proxy.reload();

  close = () => this.proxy.close();

  sendMessage = (message: unknown) => this.proxy.sendMessage(message);
}

export const windowService = new DelegateWindowService();
