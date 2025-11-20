import type { UUID } from 'node:crypto';
import type { Communicator, Message } from '@sophon-labs/account-communicator';
import {
  registerUIEventHandler,
  type SophonUIActions,
  sendUIMessage,
} from '../messaging';

export class MobileCommunicator implements Communicator {
  private readonly listeners = new Map<
    (payload: SophonUIActions['incomingRpc']) => void,
    { reject: (_: Error) => void; deregister: () => void }
  >();

  postMessage = (message: Message) => {
    this.waitContextToBeReady(message.id).then(() => {
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

  private readonly waitContextToBeReady = async (requestId: UUID) => {
    // given that the context is ours, nothing much to be done here
    // TODO: verify  embedded wallet provider context here
    //sendUIMessage('refreshMainView', {});
    sendUIMessage('showModal', { requestId });
  };

  ready = async () => {
    // await this.waitContextToBeReady();
  };
}
