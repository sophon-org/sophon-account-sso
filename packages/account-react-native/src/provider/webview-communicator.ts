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

  postMessage = async (message: Message) => {
    await this.waitContextToBeReady();
    sendUIMessage('outgoingRpc', message);
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
    this.listeners.forEach(({ reject, deregister }) => {
      deregister();
      reject(new Error('Request rejected'));
    });
    this.listeners.clear();
    sendUIMessage('hideModal', {});
  };

  private readonly waitContextToBeReady = async () => {
    if (this.isReady) {
      sendUIMessage('showModal', {});
      return;
    }

    await new Promise((resolve, reject) => {
      const unregister = registerUIEventHandler('modalReady', () => {
        unregister();
        resolve(true);
        this.isReady = true;
      });

      sendUIMessage('showModal', {});

      setTimeout(() => {
        unregister();
        reject(new Error('Modal timeout'));
      }, MODAL_TIMEOUT);
    });
  };
  ready = async () => {
    await this.waitContextToBeReady();
  };
}
