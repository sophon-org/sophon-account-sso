import type { UUID } from 'node:crypto';

export const getTimeoutRPC = (requestId?: UUID) => {
  return {
    id: crypto.randomUUID(),
    requestId,
    content: {
      result: null,
      error: {
        message: 'Connection timeout.',
        code: -32002,
      },
    },
  };
};

export const getOfflineRPC = (requestId?: UUID) => {
  return {
    id: crypto.randomUUID(),
    requestId,
    content: {
      result: null,
      error: {
        message: 'No internet available.',
        code: -32011,
      },
    },
  };
};
