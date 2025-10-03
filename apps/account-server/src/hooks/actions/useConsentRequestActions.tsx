import { useState } from 'react';
import { Loader } from '@/components/loader';
import { Button } from '@/components/ui/button';
import { useConsentAuthorization } from '@/hooks/auth/useConsentAuthorization';

export const useConsentRequestActions = () => {
  const { onRefuseConsent, onAcceptConsent, isLoading, error } =
    useConsentAuthorization();
  const [consentAds, setConsentAds] = useState(false);
  const [consentData, setConsentData] = useState(false);

  const handleAccept = () => {
    onAcceptConsent({ consentAds, consentData });
  };

  // Disable confirm button if both switches are not activated
  const isConfirmDisabled = !consentAds || !consentData;

  const renderActions = () => (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-center gap-2 w-full">
        <Button
          variant="transparent"
          disabled={isLoading}
          onClick={onRefuseConsent}
          data-testid="consent-cancel-button"
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isConfirmDisabled}
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
    onRefuseConsent,
    onAcceptConsent,
    error,
    consentAds,
    consentData,
    setConsentAds,
    setConsentData,
  };
};
