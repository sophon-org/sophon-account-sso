// import type WebView from 'react-native-webview';
import type { Communicator, Message } from 'zksync-sso/communicator';
import type { FlowController } from './flow-controller';

export class WebViewCommunicator implements Communicator {
  private readonly flow: typeof FlowController;
  // private listeners = new Map<
  //   (_: MessageEvent) => void,
  //   { reject: (_: Error) => void }
  // >();

  constructor(flow: typeof FlowController) {
    this.flow = flow;
  }

  postMessage = async (message: Message) => {
    console.log('postMessage', message);
    // const popup = await this.waitForPopupLoaded();
    console.log('postMessage', this.flow.webView);
    // this.webViewRef.current?.postMessage(JSON.stringify(message));
    // popup.postMessage(message, this.url.origin);
  };
  postRequestAndWaitForResponse = async <M extends Message>(
    request: Message & { id: NonNullable<Message['id']> }
  ): Promise<M> => {
    console.log('postRequestAndWaitForResponse', request);
    const responsePromise = this.onMessage<M>(
      ({ requestId }) => requestId === request.id
    );
    this.postMessage(request);
    return await responsePromise;
  };
  onMessage = async <M extends Message>(
    predicate: (_: Partial<M>) => boolean
  ): Promise<M> => {
    console.log('onMessage', predicate);
    return new Promise((resolve, _reject) => {
      resolve({} as M);
      //   const listener = (event: MessageEvent<M>) => {
      //     if (event.origin !== this.url.origin) return; // origin validation
      //     const message = event.data;
      //     if (predicate(message)) {
      //       resolve(message);
      //       //   window.removeEventListener('message', listener);
      //       this.listeners.delete(listener);
      //     }
      //   };
      //   window.addEventListener('message', listener);
      //   this.listeners.set(listener, { reject });
    });
  };
  private waitContextToBeReady = async () => {
    console.log('waitContextToBeReady');
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  };
  ready = async () => {
    console.log('ready');
    await this.waitContextToBeReady();
  };
}
