import type { UUID } from 'node:crypto';

type MessageID = UUID;

export interface Message {
  id: MessageID;
  requestId?: MessageID;
  content?: unknown;
}

export interface Communicator {
  postMessage: (_: Message) => void;
  postRequestAndWaitForResponse: <M extends Message>(
    _: Message & { id: string },
  ) => Promise<M>;
  onMessage: <M extends Message>(_: (_: Partial<M>) => boolean) => Promise<M>;
  ready: () => Promise<void>;
}
