'use client';
import { useContext } from 'react';
import { SophonContext } from '../context/sophon-context';

/**
 * Expose Sophon Account context for react components in the form of webhook
 * @returns
 */
export const useSophonContext = () => {
  const context = useContext(SophonContext);
  if (!context) {
    throw new Error(
      "Sophon's useSophonContext must be used within a SophonContextProvider",
    );
  }
  return context;
};
