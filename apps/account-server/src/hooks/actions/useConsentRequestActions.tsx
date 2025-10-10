import { WarningCircleIcon } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { Loader } from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useConsentAuthorization } from '@/hooks/useConsentAuthorization';

type DrawerContentType = 'error' | null;

interface UseConsentRequestActionsProps {
  openDrawer?: (type: DrawerContentType, data?: string | object) => void;
}

export const useConsentRequestActions = (
  props: UseConsentRequestActionsProps = {},
) => {
  const { openDrawer } = props;
  const { onRefuseConsent, onAcceptConsent, isLoading, error } =
    useConsentAuthorization();
  const [consentAds, setConsentAds] = useState(false);
  const [consentData, setConsentData] = useState(false);
  // Ref to track the last opened error
  const lastOpenedErrorRef = useRef<string | null>(null);

  // Automatically open drawer when error appears
  useEffect(() => {
    if (error && openDrawer) {
      // Only open drawer if we haven't already opened it for this specific error
      if (lastOpenedErrorRef.current !== error) {
        openDrawer('error', error);
        lastOpenedErrorRef.current = error;
      }
    } else {
      // Reset the ref when there's no error
      lastOpenedErrorRef.current = null;
    }
  }, [error, openDrawer]);

  const handleAccept = () => {
    onAcceptConsent({ consentAds, consentData });
  };

  const handleRefuse = () => {
    onRefuseConsent({ consentAds, consentData });
  };

  // Disable confirm button if both switches are not activated
  const isConfirmDisabled = !consentAds || !consentData;

  const renderActions = () => (
    <div className="flex flex-col gap-4 w-full">
      {error && (
        <Card
          small
          elevated
          className="py-4 px-5 rounded-3xl cursor-pointer flex items-center gap-2"
          onClick={() => openDrawer?.('error', error)}
        >
          <WarningCircleIcon weight="fill" className="w-5 h-5 text-red-500" />
          <p className="text-xs flex-1">
            Consent request failed. Click to see error.
          </p>
        </Card>
      )}

      <div className="flex items-center justify-center gap-2 w-full">
        <Button
          variant="transparent"
          disabled={isLoading}
          onClick={handleRefuse}
          data-testid="consent-cancel-button"
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isConfirmDisabled || isLoading}
          onClick={handleAccept}
          data-testid="consent-confirm-button"
        >
          {isLoading ? (
            <Loader className="w-4 h-4 border-white border-r-transparent" />
          ) : (
            'Confirm'
          )}
        </Button>
      </div>
    </div>
  );

  return {
    renderActions,
    isLoading,
    onRefuseConsent: handleRefuse,
    onAcceptConsent,
    error,
    consentAds,
    consentData,
    setConsentAds,
    setConsentData,
  };
};
