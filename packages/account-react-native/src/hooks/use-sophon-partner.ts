import type { PartnerConfigSchema } from '@sophon-labs/account-partner';
import { fetchPartnerConfig } from '@sophon-labs/account-partner';
import { useEffect, useState } from 'react';
import { useSophonContext } from './use-sophon-context';

export const useSophonPartner = () => {
  const { partnerId, chainId } = useSophonContext();
  const [partner, setPartner] = useState<PartnerConfigSchema | null>(null);

  useEffect(() => {
    (async () => {
      if (partnerId && chainId) {
        const config = await fetchPartnerConfig(chainId, partnerId);
        if (config) {
          setPartner(config as PartnerConfigSchema);
        }
      }
    })();
  }, [partnerId]);

  return {
    partner,
  };
};
