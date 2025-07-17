import { EventEmitter } from "eventemitter3";
import { useEffect } from "react";
import { Address } from "viem";

const AuthServerEvents = new EventEmitter();

export type AuthServerActions = {
  logout: {
    address: Address;
  };
};

export type AuthServerActionsNames = keyof AuthServerActions;

export const registerAuthHandler = <T extends AuthServerActionsNames>(
  action: T,
  callback: (payload: AuthServerActions[T]) => void
) => {
  AuthServerEvents.on(action, callback);
  return () => AuthServerEvents.off(action, callback);
};

export const useAuthHandler = <T extends AuthServerActionsNames>(
  action: T,
  callback: (payload: AuthServerActions[T]) => void
) => {
  useEffect(() => {
    const deregister = registerAuthHandler(action, callback);
    return () => {
      deregister();
    };
  }, [action, callback]);
};

export const sendAuthMessage = <T extends AuthServerActionsNames>(
  action: T,
  payload: AuthServerActions[T]
) => {
  AuthServerEvents.emit(action, payload);
};
