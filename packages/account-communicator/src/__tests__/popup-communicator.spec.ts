import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PopupCommunicator } from '../popup-communicator';
import type { Message } from '../types';

describe('PopupCommunicator', () => {
  let mockPopup: Partial<Window>;
  let mockWindow: {
    open: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    postMessage: ReturnType<typeof vi.fn>;
    innerWidth: number;
    innerHeight: number;
    screenX: number;
    screenY: number;
  };
  let messageListeners: Array<(event: MessageEvent) => void>;

  beforeEach(() => {
    // Reset message listeners
    messageListeners = [];

    // Mock popup window
    mockPopup = {
      postMessage: vi.fn(),
      focus: vi.fn(),
      close: vi.fn(),
      closed: false,
    };

    // Mock global window
    mockWindow = {
      open: vi.fn(() => mockPopup as Window),
      addEventListener: vi.fn(
        (event: string, listener: (event: MessageEvent) => void) => {
          if (event === 'message') {
            messageListeners.push(listener);
          }
        },
      ),
      removeEventListener: vi.fn(
        (event: string, listener: (event: MessageEvent) => void) => {
          if (event === 'message') {
            const index = messageListeners.indexOf(listener);
            if (index > -1) {
              messageListeners.splice(index, 1);
            }
          }
        },
      ),
      postMessage: vi.fn(),
      innerWidth: 1920,
      innerHeight: 1080,
      screenX: 0,
      screenY: 0,
    };

    // Override global window methods
    global.window = mockWindow as unknown as Window & typeof globalThis;
    vi.stubGlobal('window', mockWindow);

    // Mock window.location
    Object.defineProperty(global.window, 'location', {
      value: {
        origin: 'https://test.example.com',
        href: 'https://test.example.com',
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('openPopup', () => {
    it('should open popup with correct dimensions and position', () => {
      // given
      const communicator = new PopupCommunicator('https://example.com/popup');

      // when
      communicator.openPopup();

      // then
      expect(mockWindow.open).toHaveBeenCalledWith(
        expect.any(URL),
        'ZKsync SSO',
        expect.stringContaining('width=420'),
      );
      expect(mockWindow.open).toHaveBeenCalledWith(
        expect.any(URL),
        'ZKsync SSO',
        expect.stringContaining('height=600'),
      );
      expect(mockPopup.focus).toHaveBeenCalled();
    });

    it('should add origin parameter to URL', () => {
      // given
      const communicator = new PopupCommunicator('https://example.com/popup');

      // when
      communicator.openPopup();

      // then
      const callArgs = mockWindow.open.mock.calls[0];
      const url = callArgs[0] as URL;
      expect(url.searchParams.get('origin')).toBeDefined();
    });

    it('should use custom position calculator when provided', () => {
      // given
      const calculatePosition = vi.fn(() => ({ left: 100, top: 200 }));
      const communicator = new PopupCommunicator('https://example.com/popup', {
        calculatePosition,
      });

      // when
      communicator.openPopup();

      // then
      expect(calculatePosition).toHaveBeenCalledWith(420, 600);
      expect(mockWindow.open).toHaveBeenCalledWith(
        expect.any(URL),
        'ZKsync SSO',
        expect.stringContaining('left=100'),
      );
      expect(mockWindow.open).toHaveBeenCalledWith(
        expect.any(URL),
        'ZKsync SSO',
        expect.stringContaining('top=200'),
      );
    });

    it('should calculate centered position by default', () => {
      // given
      const communicator = new PopupCommunicator('https://example.com/popup');

      // when
      communicator.openPopup();

      // then
      const expectedLeft = (1920 - 420) / 2 + 0; // (innerWidth - width) / 2 + screenX
      const expectedTop = (1080 - 600) / 2 + 0; // (innerHeight - height) / 2 + screenY
      expect(mockWindow.open).toHaveBeenCalledWith(
        expect.any(URL),
        'ZKsync SSO',
        expect.stringContaining(`left=${expectedLeft}`),
      );
      expect(mockWindow.open).toHaveBeenCalledWith(
        expect.any(URL),
        'ZKsync SSO',
        expect.stringContaining(`top=${expectedTop}`),
      );
    });

    it('should throw error when popup fails to open', () => {
      // given
      mockWindow.open = vi.fn(() => null);
      const communicator = new PopupCommunicator('https://example.com/popup');

      // when/then
      expect(() => communicator.openPopup()).toThrow(
        'Pop up window failed to open',
      );
    });
  });

  describe('postMessage', () => {
    it('should post message to popup after it loads', async () => {
      // given
      const communicator = new PopupCommunicator('https://example.com/popup');
      const messageId = crypto.randomUUID();
      const message: Message = { id: messageId, content: { test: 'data' } };

      // Simulate popup loading
      const postPromise = communicator.postMessage(message);

      // Simulate PopupLoaded event
      setTimeout(() => {
        const event = new MessageEvent('message', {
          data: { event: 'PopupLoaded' },
          origin: 'https://example.com',
        });
        messageListeners.forEach((listener) => listener(event));
      }, 10);

      // when
      await postPromise;

      // then
      expect(mockPopup.postMessage).toHaveBeenCalledWith(
        message,
        'https://example.com',
      );
    });
  });

  describe('onMessage', () => {
    it('should resolve when matching message is received', async () => {
      // given
      const communicator = new PopupCommunicator('https://example.com/popup');
      const testId = crypto.randomUUID();
      const expectedMessage: Message = {
        id: testId,
        content: { result: 'success' },
      };

      // when
      const messagePromise = communicator.onMessage<Message>(
        (msg) => msg.id === testId,
      );

      // Simulate message event
      setTimeout(() => {
        const event = new MessageEvent('message', {
          data: expectedMessage,
          origin: 'https://example.com',
        });
        messageListeners.forEach((listener) => listener(event));
      }, 10);

      const result = await messagePromise;

      // then
      expect(result).toEqual(expectedMessage);
    });

    it('should ignore messages from wrong origin', async () => {
      // given
      const communicator = new PopupCommunicator('https://example.com/popup');
      const testId = crypto.randomUUID();
      let resolved = false;

      // when
      const messagePromise = communicator.onMessage<Message>(
        (msg) => msg.id === testId,
      );
      messagePromise.then(() => {
        resolved = true;
      });

      // Simulate message from wrong origin
      const event = new MessageEvent('message', {
        data: { id: testId, content: 'data' },
        origin: 'https://evil.com',
      });
      messageListeners.forEach((listener) => listener(event));

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      // then
      expect(resolved).toBe(false);
    });

    it('should remove listener after receiving message', async () => {
      // given
      const communicator = new PopupCommunicator('https://example.com/popup');
      const testId = crypto.randomUUID();

      // when
      const messagePromise = communicator.onMessage<Message>(
        (msg) => msg.id === testId,
      );

      const initialListenerCount = messageListeners.length;

      // Simulate message event
      setTimeout(() => {
        const event = new MessageEvent('message', {
          data: { id: testId },
          origin: 'https://example.com',
        });
        messageListeners.forEach((listener) => listener(event));
      }, 10);

      await messagePromise;

      // then
      expect(mockWindow.removeEventListener).toHaveBeenCalled();
      expect(messageListeners.length).toBeLessThan(initialListenerCount);
    });
  });

  describe('postRequestAndWaitForResponse', () => {
    it('should send request and wait for response with matching requestId', async () => {
      // given
      const communicator = new PopupCommunicator('https://example.com/popup');
      const requestId = crypto.randomUUID();
      const request: Message & { id: string } = {
        id: requestId,
        content: { action: 'getData' },
      };

      // Simulate popup loading and response
      setTimeout(() => {
        // PopupLoaded event
        const loadedEvent = new MessageEvent('message', {
          data: { event: 'PopupLoaded' },
          origin: 'https://example.com',
        });
        messageListeners.forEach((listener) => listener(loadedEvent));
      }, 10);

      setTimeout(() => {
        // Response with matching requestId
        const responseEvent = new MessageEvent('message', {
          data: { requestId, content: { result: 'data' } },
          origin: 'https://example.com',
        });
        messageListeners.forEach((listener) => listener(responseEvent));
      }, 50);

      // when
      const response =
        await communicator.postRequestAndWaitForResponse<Message>(request);

      // then
      expect(response.requestId).toBe(requestId);
      expect(mockPopup.postMessage).toHaveBeenCalledWith(
        request,
        'https://example.com',
      );
    });
  });

  describe('waitForPopupLoaded', () => {
    it('should open popup and wait for PopupLoaded event', async () => {
      // given
      const communicator = new PopupCommunicator('https://example.com/popup');

      // Simulate PopupLoaded event
      setTimeout(() => {
        const event = new MessageEvent('message', {
          data: { event: 'PopupLoaded' },
          origin: 'https://example.com',
        });
        messageListeners.forEach((listener) => listener(event));
      }, 10);

      // when
      const popup = await communicator.waitForPopupLoaded();

      // then
      expect(popup).toBe(mockPopup);
      expect(mockWindow.open).toHaveBeenCalled();
    });

    it('should focus existing popup if already open', async () => {
      // given
      const communicator = new PopupCommunicator('https://example.com/popup');

      // First open
      setTimeout(() => {
        const event = new MessageEvent('message', {
          data: { event: 'PopupLoaded' },
          origin: 'https://example.com',
        });
        messageListeners.forEach((listener) => listener(event));
      }, 10);

      await communicator.waitForPopupLoaded();
      const firstCallCount = mockWindow.open.mock.calls.length;

      // when - try to open again
      const popup = await communicator.waitForPopupLoaded();

      // then - should not open new popup
      expect(mockWindow.open).toHaveBeenCalledTimes(firstCallCount);
      expect(mockPopup.focus).toHaveBeenCalled();
      expect(popup).toBe(mockPopup);
    });

    it('should reopen popup if previous one was closed', async () => {
      // given
      const communicator = new PopupCommunicator('https://example.com/popup');

      // First open
      setTimeout(() => {
        const event = new MessageEvent('message', {
          data: { event: 'PopupLoaded' },
          origin: 'https://example.com',
        });
        messageListeners.forEach((listener) => listener(event));
      }, 10);

      await communicator.waitForPopupLoaded();

      // Close the popup
      Object.defineProperty(mockPopup, 'closed', {
        value: true,
        writable: true,
      });

      // Simulate second PopupLoaded event
      setTimeout(() => {
        const event = new MessageEvent('message', {
          data: { event: 'PopupLoaded' },
          origin: 'https://example.com',
        });
        messageListeners.forEach((listener) => listener(event));
      }, 10);

      // when - try to open again
      await communicator.waitForPopupLoaded();

      // then - should open new popup
      expect(mockWindow.open).toHaveBeenCalledTimes(2);
    });

    it('should listen for PopupUnload event', async () => {
      // given
      const communicator = new PopupCommunicator('https://example.com/popup');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const disconnectSpy = vi.spyOn(communicator as any, 'disconnect');

      // Simulate PopupLoaded event
      setTimeout(() => {
        const loadedEvent = new MessageEvent('message', {
          data: { event: 'PopupLoaded' },
          origin: 'https://example.com',
        });
        messageListeners.forEach((listener) => listener(loadedEvent));
      }, 10);

      await communicator.waitForPopupLoaded();

      // when - simulate PopupUnload event
      const unloadEvent = new MessageEvent('message', {
        data: { event: 'PopupUnload' },
        origin: 'https://example.com',
      });
      messageListeners.forEach((listener) => listener(unloadEvent));

      // Wait for disconnect to be called
      await new Promise((resolve) => setTimeout(resolve, 50));

      // then
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe('ready', () => {
    it('should wait for popup to be loaded', async () => {
      // given
      const communicator = new PopupCommunicator('https://example.com/popup');

      // Simulate PopupLoaded event
      setTimeout(() => {
        const event = new MessageEvent('message', {
          data: { event: 'PopupLoaded' },
          origin: 'https://example.com',
        });
        messageListeners.forEach((listener) => listener(event));
      }, 10);

      // when
      await communicator.ready();

      // then
      expect(mockWindow.open).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should close popup and clear listeners', async () => {
      // given
      const communicator = new PopupCommunicator('https://example.com/popup');

      // Open popup first
      setTimeout(() => {
        const event = new MessageEvent('message', {
          data: { event: 'PopupLoaded' },
          origin: 'https://example.com',
        });
        messageListeners.forEach((listener) => listener(event));
      }, 10);

      await communicator.waitForPopupLoaded();

      // Add a pending message listener
      const neverId = crypto.randomUUID();
      const pendingPromise = communicator.onMessage<Message>(
        (msg) => msg.id === neverId,
      );
      let rejected = false;
      pendingPromise.catch(() => {
        rejected = true;
      });

      // when
      communicator.disconnect();

      // Wait a bit for async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      // then
      expect(mockPopup.close).toHaveBeenCalled();
      expect(rejected).toBe(true);
    });
  });
});
