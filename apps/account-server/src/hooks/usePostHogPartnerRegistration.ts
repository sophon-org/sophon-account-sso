import { useEffect, useRef } from 'react';
import { registerPostHogPartnerId, trackPageReady } from '@/lib/analytics';

export const usePostHogPartnerRegistration = (partnerId?: string) => {
  const hasTrackedPageReadyRef = useRef(false);

  useEffect(() => {
    if (partnerId) {
      registerPostHogPartnerId(partnerId);
    }

    if (!hasTrackedPageReadyRef.current) {
      trackPageReady();
      hasTrackedPageReadyRef.current = true;
    }
  }, [partnerId]);
};

