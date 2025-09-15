import { useMemo } from 'react';

export interface UrlInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const useUrlInsets = (): UrlInsets => {
  const insets = useMemo(() => {
    if (typeof window === 'undefined') {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }

    const urlParams = new URLSearchParams(window.location.search);

    return {
      top: Number(urlParams.get('it')) || 0,
      bottom: Number(urlParams.get('ib')) || 0,
      left: Number(urlParams.get('il')) || 0,
      right: Number(urlParams.get('ir')) || 0,
    };
  }, []);

  return insets;
};
