import type { UUID } from 'node:crypto';
import type { Communicator, Message } from '@sophon-labs/account-communicator';
import {
  registerUIEventHandler,
  type SophonUIActions,
  sendUIMessage,
} from '../messaging';
import { getTimeoutRPC } from '../messaging/utils';

const HEALTH_CHECK_TIMEOUT = 1000;

export class WebViewCommunicator implements Communicator {
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

  private readonly waitWebViewToBeReady = async () => {
    const callbackPromise = new Promise((resolve) => {
      const healthCheckTimeout = setTimeout(() => {
        resolve(undefined);
      }, HEALTH_CHECK_TIMEOUT);

      const unregister = registerUIEventHandler(
        'sdkStatusResponse',
        (payload) => {
          if (payload?.isReady) {
            clearTimeout(healthCheckTimeout);
            unregister();
            resolve(payload);
          }
        },
      );
    });

    sendUIMessage('sdkStatusRequest', {});
    const payload = await callbackPromise;
    return payload;
  };

  private currentRequestId?: UUID;

  private readonly waitContextToBeReady = async (requestId?: UUID) => {
    if (this.currentRequestId === requestId) {
      return;
    }

    this.currentRequestId = requestId;

    const checkIfReady = async () => {
      const payload = await this.waitWebViewToBeReady();

      // got active connection, show the modal
      if (payload) {
        this.currentRequestId = undefined;
        sendUIMessage('showModal', {});
        return true;
      }

      return false;
    };

    let retries = 3;
    let isReady = false;
    do {
      isReady = await checkIfReady();
    } while (!isReady && retries-- > 0);

    // before giving up, try to refresh the main view and try again to get the response
    if (!isReady) {
      console.log('refreshing main view');
      // try to refresh the main view in case of retry, just to make sure that the page is loaded
      // and sort out user connection issues, but only do that after the first try, the happy path is
      // that the user is connected and the response is received immediately
      sendUIMessage('refreshMainView', {});
      await new Promise((resolve) => setTimeout(resolve, 500));
      isReady = await checkIfReady();
    }

    // just give up and ask the user to try again
    if (!isReady) {
      sendUIMessage('incomingRpc', getTimeoutRPC(requestId));
    }

    this.currentRequestId = undefined;
  };
  ready = async () => {
    await this.waitWebViewToBeReady();
  };
}
