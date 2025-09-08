import type { Communicator, Message } from 'zksync-sso/communicator';
import {
  registerUIEventHandler,
  type SophonUIActions,
  sendUIMessage,
} from '../messaging';

const MODAL_TIMEOUT = 5000;
const REQUEST_TIMEOUT = 5 * 60 * 1000;

export class WebViewCommunicator implements Communicator {
  private isReady = false;
  private readonly listeners = new Map<
    (payload: SophonUIActions['incomingRpc']) => void,
    { reject: (_: Error) => void; deregister: () => void }
  >();

  postMessage = (message: Message) => {
    console.log('🔥 WebViewCommunicator.postMessage called:', {
      messageId: message.id,
      messageMethod: 'method' in message ? (message as Message & { method: string }).method : undefined,
      timestamp: new Date().toISOString()
    });
    
    this.waitContextToBeReady().then(() => {
      sendUIMessage('outgoingRpc', message);
    });
  };
  postRequestAndWaitForResponse = async <M extends Message>(
    request: Message & { id: NonNullable<Message['id']> },
  ): Promise<M> => {
    const responsePromise = this.onMessage<M>(
      ({ requestId }) => requestId === request.id,
    );
    this.postMessage(request);
    return await responsePromise;
  };
  onMessage = async <M extends Message>(
    predicate: (_: Partial<M>) => boolean,
  ): Promise<M> => {
    return new Promise((resolve, reject) => {
      const listener = (payload: SophonUIActions['incomingRpc']) => {
        // only act if the message target hits the given predicate
        if (predicate(payload as Partial<M>)) {
          resolve(payload as M);
          deregister();
          this.listeners.delete(listener);
        }

        setTimeout(() => {
          deregister();
          this.listeners.delete(listener);
          reject(new Error('Request timeout'));
        }, REQUEST_TIMEOUT);
      };
      const deregister = registerUIEventHandler('incomingRpc', listener);
      this.listeners.set(listener, { reject, deregister });
    });
  };

  disconnect = () => {
    console.log('🔍 [LOGOUT] WebViewCommunicator.disconnect() called');
    
    // Clear all pending listeners
    this.listeners.forEach(({ reject, deregister }) => {
      deregister();
      reject(new Error('Request rejected'));
    });
    this.listeners.clear();
    
    // 🚨 IMPORTANT: Send logout to WebView so server can clear the session!
    // Without this, the session remains active on the server
    console.log('🔍 [LOGOUT] Sending logout to WebView to clear server session');
    sendUIMessage('outgoingRpc', {
      id: `logout-${Date.now()}`,
      action: 'logout',
      method: 'logout'
    });
    
    // Hide the modal after logout
    sendUIMessage('hideModal', {});
  };

  private isWaitingForModal = false; // 🚨 PREVENT SPAM
  
  private readonly waitContextToBeReady = async () => {
    console.log('🔥 waitContextToBeReady called - isReady:', this.isReady, 'isWaiting:', this.isWaitingForModal);
    
    // 🚨 PREVENT SPAM: Don't start multiple modal waits
    if (this.isWaitingForModal) {
      console.log('🚨 waitContextToBeReady - already waiting for modal, skipping');
      return;
    }
    
    if (this.isReady) {
      console.log('🔥 Context ready - showing modal');
      sendUIMessage('showModal', {});
      return;
    }

    this.isWaitingForModal = true;
    
    try {
      await new Promise((resolve, reject) => {
        const unregister = registerUIEventHandler('modalReady', () => {
          unregister();
          this.isWaitingForModal = false;
          resolve(true);
          this.isReady = true;
        });

        console.log('🔥 Context not ready - showing modal and waiting');
        sendUIMessage('showModal', {});

        setTimeout(() => {
          unregister();
          this.isWaitingForModal = false;
          reject(new Error('Modal timeout'));
        }, MODAL_TIMEOUT);
      });
    } catch (error) {
      this.isWaitingForModal = false;
      throw error;
    }
  };
  ready = async () => {};
}
