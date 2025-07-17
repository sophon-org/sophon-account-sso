import type { Communicator, Message } from 'zksync-sso/communicator';
import {
  registerUIEventHandler,
  type SophonUIActions,
  sendUIMessage,
} from '../messaging';

const MODAL_TIMEOUT = 500000;

export class WebViewCommunicator implements Communicator {
  private listeners = new Map<
    (payload: SophonUIActions['incomingRpc']) => void,
    { reject: (_: Error) => void; deregister: () => void }
  >();

  postMessage = async (message: Message) => {
    console.log('postMessage', message);
    await this.waitContextToBeReady();
    sendUIMessage('outgoingRpc', message);
  };
  postRequestAndWaitForResponse = async <M extends Message>(
    request: Message & { id: NonNullable<Message['id']> },
  ): Promise<M> => {
    console.log('$$$$$$$$$$$$$$$$ postRequestAndWaitForResponse', request);
    const responsePromise = this.onMessage<M>(
      ({ requestId }) => requestId === request.id,
    );
    this.postMessage(request);
    return await responsePromise;
  };
  onMessage = async <M extends Message>(
    predicate: (_: Partial<M>) => boolean,
  ): Promise<M> => {
    console.log('!!!!!!!!!!!! onMessage', predicate);
    return new Promise((resolve, reject) => {
      const listener = (payload: SophonUIActions['incomingRpc']) => {
        console.log('!!!!!!!!!!!! onMessage listener', payload);
        // only act if the message target hits the given predicate
        if (predicate(payload as Partial<M>)) {
          resolve(payload as M);
          deregister();
          this.listeners.delete(listener);
        }
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
    // window.close();
  };

  private waitContextToBeReady = async () => {
    console.log('!!!!!!!!!!!! waitContextToBeReady');

    await new Promise((resolve, reject) => {
      const unregister = registerUIEventHandler('modalReady', () => {
        unregister();
        resolve(true);
      });

      sendUIMessage('showModal', {});

      setTimeout(() => {
        reject(new Error('Modal timeout'));
        unregister();
      }, MODAL_TIMEOUT);
    });
  };
  ready = async () => {
    console.log('!!!!!!!!!!!! ready');
    await this.waitContextToBeReady();
  };
}
