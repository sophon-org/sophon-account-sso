import { polyfillWebCrypto } from 'expo-standard-web-crypto';
import 'text-encoding-polyfill';
import { randomUUID } from 'expo-crypto';

polyfillWebCrypto();
crypto.randomUUID = randomUUID;

// Polyfill window object for wagmi
if (typeof window === 'undefined') {
  global.window = global;
}

// Polyfill document for wagmi
if (typeof document === 'undefined') {
  global.document = {
    createElement: () => ({}),
    createEvent: () => ({ initEvent: () => {} }),
    documentElement: { style: {} },
    getElementsByTagName: () => [],
    head: { appendChild: () => {} },
  };
}

// Polyfill addEventListener/removeEventListener for wagmi's visibility detection
if (typeof window !== 'undefined' && !window.addEventListener) {
  const listeners = new Map();

  window.addEventListener = (event, handler) => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event).add(handler);
  };

  window.removeEventListener = (event, handler) => {
    if (listeners.has(event)) {
      listeners.get(event).delete(handler);
    }
  };

  window.dispatchEvent = (event) => {
    if (listeners.has(event.type)) {
      listeners.get(event.type).forEach((handler) => handler(event));
    }
  };
}

// Polyfill visibilityState for wagmi's auto-reconnect
if (typeof document !== 'undefined' && !document.visibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    get: () => 'visible',
    configurable: true,
  });

  Object.defineProperty(document, 'hidden', {
    get: () => false,
    configurable: true,
  });
}

// Polyfill Event first (required by CustomEvent)
if (typeof Event === 'undefined') {
  global.Event = class Event {
    constructor(type, eventInitDict = {}) {
      this.type = type;
      this.bubbles = eventInitDict.bubbles || false;
      this.cancelable = eventInitDict.cancelable || false;
      this.composed = eventInitDict.composed || false;
    }
  };
}

// Polyfill CustomEvent for wagmi/viem
if (typeof CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent extends Event {
    constructor(event, params) {
      super(event, params);
      this.detail = params?.detail;
    }
  };
}
