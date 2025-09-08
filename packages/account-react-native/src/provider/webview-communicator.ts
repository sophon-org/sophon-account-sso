import type { UUID } from 'node:crypto';
import type { Communicator, Message } from 'zksync-sso/communicator';
import {
  registerUIEventHandler,
  type SophonUIActions,
  sendUIMessage,
} from '../messaging';

const HEALTH_CHECK_TIMEOUT = 1000;
// const MODAL_TIMEOUT = 5000;
// const REQUEST_TIMEOUT = 5 * 1000;

const getTimeoutRPC = (requestId?: UUID) => {
  return {
    id: crypto.randomUUID(),
    requestId,
    content: {
      result: null,
      error: {
        message: 'Request timeout.',
        code: -32002,
      },
    },
  };
};

export class WebViewCommunicator implements Communicator {
  // private initialized = false;
  private readonly listeners = new Map<
    (payload: SophonUIActions['incomingRpc']) => void,
    { reject: (_: Error) => void; deregister: () => void }
  >();

  postMessage = (message: Message) => {
    console.log(message.id, ' - postMessage', JSON.stringify(message));
    this.waitContextToBeReady(message.id).then(() => {
      sendUIMessage('outgoingRpc', message);
    });
  };
  postRequestAndWaitForResponse = async <M extends Message>(
    request: Message & { id: NonNullable<Message['id']> },
  ): Promise<M> => {
    console.log(
      request.id,
      ' - postRequestAndWaitForResponse',
      JSON.stringify(request),
    );
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
          console.log(payload.requestId, ' - resolved request');
          resolve(payload as M);
          deregister();
          this.listeners.delete(listener);
        } else {
          console.log(
            payload.requestId,
            ' -  message not matched ',
            JSON.stringify(payload),
          );
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
          clearTimeout(healthCheckTimeout);
          unregister();
          resolve(payload);
        },
      );
    });

    sendUIMessage('sdkStatusRequest', {});
    const payload = await callbackPromise;
    return payload;
  };

  private currentRequestId?: UUID;
  private currentCheckId?: NodeJS.Timeout;

  private readonly waitContextToBeReady = async (requestId?: UUID) => {
    console.log(`${requestId} - waitContextToBeReady to send request`);

    if (this.currentRequestId === requestId) {
      return;
    }

    // if there is another request in progress, cancel it
    if (this.currentCheckId) {
      console.log(
        requestId,
        ' - cancel previous request',
        this.currentRequestId,
      );
      clearInterval(this.currentCheckId);
      sendUIMessage('outgoingRpc', getTimeoutRPC(this.currentRequestId));
      this.currentCheckId = undefined;
      this.currentRequestId = undefined;
    }

    this.currentRequestId = requestId;
    let maxRetries = 3;
    console.log(
      requestId,
      ' - set interval to check if the webview is ready for request',
      new Date().toISOString(),
    );

    const checkIfReady = async () => {
      console.log(
        requestId,
        ' - check if the webview is ready for request',
        maxRetries,
        new Date().toISOString(),
      );
      const payload = await this.waitWebViewToBeReady();

      // got active connection, show the modal
      if (payload) {
        console.log(
          requestId,
          ' - got active connection, show the modal',
          payload,
        );

        clearInterval(this.currentCheckId);
        this.currentCheckId = undefined;
        this.currentRequestId = undefined;
        sendUIMessage('showModal', {});
        return true;
      }

      if (maxRetries-- <= 0) {
        console.log(requestId, ' - max retries reached, send timeout rpc');
        clearInterval(this.currentCheckId);
        this.currentCheckId = undefined;
        this.currentRequestId = undefined;
        sendUIMessage('outgoingRpc', getTimeoutRPC(requestId));
      }
      return false;
    };

    const isReady = await checkIfReady();
    if (!isReady) {
      this.currentCheckId = setInterval(checkIfReady, HEALTH_CHECK_TIMEOUT);
    }
  };
  ready = async () => {
    await this.waitWebViewToBeReady();
  };
}
