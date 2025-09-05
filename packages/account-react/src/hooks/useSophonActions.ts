import { isSSR } from '@sophon-labs/account-core';
import { useCallback } from 'react';
import { useSophonContext } from './useSophonContext';

export const useSophonActions = () => {
  const { authServerUrl } = useSophonContext();
  const openProfile = useCallback(() => {
    if (isSSR()) {
      return;
    }

    const url = authServerUrl;
    const width = 360;
    const height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      url,
      'SophonProfile',
      `width=${width}, height=${height}, left=${left}, top=${top}`,
    );
  }, [authServerUrl]);

  return {
    openProfile,
  };
};
