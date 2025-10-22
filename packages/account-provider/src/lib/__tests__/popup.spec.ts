import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  awaitForPopupUnload,
  DEFAULT_UNLOAD_DELAY,
  DEFAULT_UNLOAD_TIMEOUT,
} from '../popup';

describe('Provider > Lib > popup', () => {
  let windowAddEventListenerSpy: ReturnType<typeof vi.fn>;
  let windowRemoveEventListenerSpy: ReturnType<typeof vi.fn>;
  let messageListeners: Array<(event: MessageEvent) => void>;

  beforeEach(() => {
    // Reset message listeners
    messageListeners = [];

    // Create spies for window methods
    windowAddEventListenerSpy = vi.fn((event: string, listener: (event: MessageEvent) => void) => {
      if (event === 'message') {
        messageListeners.push(listener);
      }
    });

    windowRemoveEventListenerSpy = vi.fn((event: string, listener: (event: MessageEvent) => void) => {
      if (event === 'message') {
        const index = messageListeners.indexOf(listener);
        if (index > -1) {
          messageListeners.splice(index, 1);
        }
      }
    });

    // Mock window
    Object.defineProperty(global, 'window', {
      value: {
        addEventListener: windowAddEventListenerSpy,
        removeEventListener: windowRemoveEventListenerSpy,
      },
      writable: true,
      configurable: true,
    });

    // Use fake timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('server-side rendering', () => {
    it('should resolve immediately when window is undefined', async () => {
      // given
      delete (global as { window?: unknown }).window;
      const authServerUrl = 'https://example.com';

      // when
      const resultPromise = awaitForPopupUnload(authServerUrl);
      const result = await resultPromise;

      // then
      expect(result).toBe(true);
    });

    it('should resolve immediately when window.addEventListener is not available', async () => {
      // given
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
        configurable: true,
      });
      const authServerUrl = 'https://example.com';

      // when
      const resultPromise = awaitForPopupUnload(authServerUrl);
      const result = await resultPromise;

      // then
      expect(result).toBe(true);
    });
  });

  describe('PopupUnload event handling', () => {
    it('should add message event listener', () => {
      // given
      const authServerUrl = 'https://example.com';

      // when
      awaitForPopupUnload(authServerUrl);

      // then
      expect(windowAddEventListenerSpy).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
      expect(messageListeners).toHaveLength(1);
    });

    it('should resolve after receiving PopupUnload event with correct origin', async () => {
      // given
      const authServerUrl = 'https://example.com';
      const resultPromise = awaitForPopupUnload(authServerUrl);

      // when
      // Simulate PopupUnload event
      const event = new MessageEvent('message', {
        data: { event: 'PopupUnload' },
        origin: 'https://example.com',
      });
      messageListeners.forEach((listener) => listener(event));

      // Advance timers past the delay
      vi.advanceTimersByTime(DEFAULT_UNLOAD_DELAY);

      const result = await resultPromise;

      // then
      expect(result).toBe(true);
    });

    it('should resolve after delay when PopupUnload event is received', async () => {
      // given
      const authServerUrl = 'https://example.com';
      const resultPromise = awaitForPopupUnload(authServerUrl);

      // Simulate PopupUnload event
      const event = new MessageEvent('message', {
        data: { event: 'PopupUnload' },
        origin: 'https://example.com',
      });
      messageListeners.forEach((listener) => listener(event));

      // when - advance time by less than delay
      vi.advanceTimersByTime(DEFAULT_UNLOAD_DELAY - 100);
      
      // Promise should not resolve yet
      let resolved = false;
      resultPromise.then(() => {
        resolved = true;
      });
      await Promise.resolve();

      // then
      expect(resolved).toBe(false);

      // when - advance remaining time
      vi.advanceTimersByTime(100);
      await resultPromise;

      // then
      expect(resolved).toBe(true);
    });

    it('should remove event listener after receiving PopupUnload event', async () => {
      // given
      const authServerUrl = 'https://example.com';
      const resultPromise = awaitForPopupUnload(authServerUrl);

      // when
      const event = new MessageEvent('message', {
        data: { event: 'PopupUnload' },
        origin: 'https://example.com',
      });
      messageListeners.forEach((listener) => listener(event));
      vi.advanceTimersByTime(DEFAULT_UNLOAD_DELAY);
      await resultPromise;

      // then
      expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
      expect(messageListeners).toHaveLength(0);
    });
  });

  describe('origin validation', () => {
    it('should ignore events from different origins', async () => {
      // given
      const authServerUrl = 'https://example.com';
      const resultPromise = awaitForPopupUnload(authServerUrl);

      // when - send event from wrong origin
      const wrongEvent = new MessageEvent('message', {
        data: { event: 'PopupUnload' },
        origin: 'https://evil.com',
      });
      messageListeners.forEach((listener) => listener(wrongEvent));
      vi.advanceTimersByTime(DEFAULT_UNLOAD_DELAY);

      // then - should not resolve yet
      let resolved = false;
      resultPromise.then(() => {
        resolved = true;
      });
      await Promise.resolve();
      expect(resolved).toBe(false);

      // when - send event from correct origin
      const correctEvent = new MessageEvent('message', {
        data: { event: 'PopupUnload' },
        origin: 'https://example.com',
      });
      messageListeners.forEach((listener) => listener(correctEvent));
      vi.advanceTimersByTime(DEFAULT_UNLOAD_DELAY);
      await resultPromise;

      // then
      expect(resolved).toBe(true);
    });

    it('should accept events from origins that match authServerUrl prefix', async () => {
      // given
      const authServerUrl = 'https://example.com';
      const resultPromise = awaitForPopupUnload(authServerUrl);

      // when
      const event = new MessageEvent('message', {
        data: { event: 'PopupUnload' },
        origin: 'https://example.com',
      });
      messageListeners.forEach((listener) => listener(event));
      vi.advanceTimersByTime(DEFAULT_UNLOAD_DELAY);
      const result = await resultPromise;

      // then
      expect(result).toBe(true);
    });

    it('should reject events when origin does not start with authServerUrl', async () => {
      // given
      const authServerUrl = 'https://example.com';
      const resultPromise = awaitForPopupUnload(authServerUrl);

      // when - send event with origin that doesn't start with authServerUrl
      const event = new MessageEvent('message', {
        data: { event: 'PopupUnload' },
        origin: 'https://other-example.com', // Doesn't start with authServerUrl
      });
      messageListeners.forEach((listener) => listener(event));
      vi.advanceTimersByTime(DEFAULT_UNLOAD_DELAY);

      // then - should not resolve from this event
      let resolved = false;
      resultPromise.then(() => {
        resolved = true;
      });
      await Promise.resolve();
      expect(resolved).toBe(false);
    });
  });

  describe('timeout mechanism', () => {
    it('should resolve after DEFAULT_UNLOAD_TIMEOUT if no event is received', async () => {
      // given
      const authServerUrl = 'https://example.com';
      const resultPromise = awaitForPopupUnload(authServerUrl);

      // when - advance time to timeout
      vi.advanceTimersByTime(DEFAULT_UNLOAD_TIMEOUT);
      const result = await resultPromise;

      // then
      expect(result).toBe(true);
    });

    it('should not resolve before timeout if no event is received', async () => {
      // given
      const authServerUrl = 'https://example.com';
      const resultPromise = awaitForPopupUnload(authServerUrl);

      // when - advance time by less than timeout
      vi.advanceTimersByTime(DEFAULT_UNLOAD_TIMEOUT - 100);

      let resolved = false;
      resultPromise.then(() => {
        resolved = true;
      });
      await Promise.resolve();

      // then
      expect(resolved).toBe(false);

      // when - advance remaining time
      vi.advanceTimersByTime(100);
      await resultPromise;

      // then
      expect(resolved).toBe(true);
    });

    it('should clear timeout when PopupUnload event is received', async () => {
      // given
      const authServerUrl = 'https://example.com';
      const resultPromise = awaitForPopupUnload(authServerUrl);
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      // when
      const event = new MessageEvent('message', {
        data: { event: 'PopupUnload' },
        origin: 'https://example.com',
      });
      messageListeners.forEach((listener) => listener(event));
      vi.advanceTimersByTime(DEFAULT_UNLOAD_DELAY);
      await resultPromise;

      // then
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('event data validation', () => {
    it('should ignore events without PopupUnload event type', async () => {
      // given
      const authServerUrl = 'https://example.com';
      const resultPromise = awaitForPopupUnload(authServerUrl);

      // when - send event with different event type
      const wrongEvent = new MessageEvent('message', {
        data: { event: 'OtherEvent' },
        origin: 'https://example.com',
      });
      messageListeners.forEach((listener) => listener(wrongEvent));
      vi.advanceTimersByTime(DEFAULT_UNLOAD_DELAY);

      // then - should not resolve yet
      let resolved = false;
      resultPromise.then(() => {
        resolved = true;
      });
      await Promise.resolve();
      expect(resolved).toBe(false);

      // cleanup - advance to timeout
      vi.advanceTimersByTime(DEFAULT_UNLOAD_TIMEOUT);
      await resultPromise;
    });

    it('should handle multiple events and only respond to PopupUnload', async () => {
      // given
      const authServerUrl = 'https://example.com';
      const resultPromise = awaitForPopupUnload(authServerUrl);

      // when - send various events
      const events = [
        new MessageEvent('message', {
          data: { event: 'PopupLoaded' },
          origin: 'https://example.com',
        }),
        new MessageEvent('message', {
          data: { event: 'SomeOtherEvent' },
          origin: 'https://example.com',
        }),
        new MessageEvent('message', {
          data: { event: 'PopupUnload' },
          origin: 'https://example.com',
        }),
      ];

      for (const event of events) {
        messageListeners.forEach((listener) => listener(event));
      }

      vi.advanceTimersByTime(DEFAULT_UNLOAD_DELAY);
      const result = await resultPromise;

      // then
      expect(result).toBe(true);
    });
  });

  describe('constants', () => {
    it('should export DEFAULT_UNLOAD_TIMEOUT', () => {
      // then
      expect(DEFAULT_UNLOAD_TIMEOUT).toBe(1000);
      expect(typeof DEFAULT_UNLOAD_TIMEOUT).toBe('number');
    });

    it('should export DEFAULT_UNLOAD_DELAY', () => {
      // then
      expect(DEFAULT_UNLOAD_DELAY).toBe(500);
      expect(typeof DEFAULT_UNLOAD_DELAY).toBe('number');
    });
  });

  describe('edge cases', () => {
    it('should handle authServerUrl with path', async () => {
      // given
      const authServerUrl = 'https://example.com/auth';
      const resultPromise = awaitForPopupUnload(authServerUrl);

      // when
      const event = new MessageEvent('message', {
        data: { event: 'PopupUnload' },
        origin: 'https://example.com',
      });
      messageListeners.forEach((listener) => listener(event));
      vi.advanceTimersByTime(DEFAULT_UNLOAD_DELAY);
      const result = await resultPromise;

      // then
      expect(result).toBe(true);
    });

    it('should handle authServerUrl with port', async () => {
      // given
      const authServerUrl = 'https://example.com:8080';
      const resultPromise = awaitForPopupUnload(authServerUrl);

      // when
      const event = new MessageEvent('message', {
        data: { event: 'PopupUnload' },
        origin: 'https://example.com:8080',
      });
      messageListeners.forEach((listener) => listener(event));
      vi.advanceTimersByTime(DEFAULT_UNLOAD_DELAY);
      const result = await resultPromise;

      // then
      expect(result).toBe(true);
    });
  });
});

