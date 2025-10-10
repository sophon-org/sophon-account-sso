import { CaretRightIcon, DnaIcon } from '@phosphor-icons/react';
import { useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import VerificationImage from '@/components/ui/verification-image';
import { useConsentRequestActions } from '@/hooks/actions/useConsentRequestActions';
import {
  trackConsentOptionSelected,
  trackConsentScreenViewed,
} from '@/lib/analytics';
import { windowService } from '@/service/window.service';

export default function ConsentRequestView({
  consentAds,
  consentData,
  setConsentAds,
  setConsentData,
}: {
  consentAds: boolean;
  consentData: boolean;
  setConsentAds: (consentAds: boolean) => void;
  setConsentData: (consentData: boolean) => void;
}) {
  const isMobile = windowService.isMobile();

  // Track when consent screen is viewed
  useEffect(() => {
    trackConsentScreenViewed('first_data_source_connect', 'modal');
  }, []);

  // Handle consent ads toggle with tracking
  const handleConsentAdsChange = (checked: boolean) => {
    setConsentAds(checked);
    trackConsentOptionSelected('ads', checked ? 'accept' : 'reject');
  };

  // Handle consent data toggle with tracking
  const handleConsentDataChange = (checked: boolean) => {
    setConsentData(checked);
    trackConsentOptionSelected(
      'personalization',
      checked ? 'accept' : 'reject',
    );
  };
  return (
    <div className="text-center flex flex-col items-center justify-center gap-8 mt-3 h-[calc(100vh-220px)]">
      {!isMobile && (
        <VerificationImage
          icon={<DnaIcon className="w-10 h-10 text-white" />}
        />
      )}
      <div className="flex flex-col items-center justify-center">
        <h5 className="text-2xl font-bold">Data permissions</h5>
        <p>
          We would like your permission to use your data for the following
          purposes.
        </p>
      </div>
      <div className="flex flex-col gap-4 w-full h-full justify-between relative">
        <div className="h-full">
          <Accordion type="single" collapsible>
            <div className="w-full bg-white rounded-lg mb-3 p-4">
              <AccordionItem value="item-1">
                <AccordionTrigger className="group flex w-full items-center justify-between p-0">
                  <div className="flex items-center">
                    <CaretRightIcon
                      weight="bold"
                      className="w-4 h-4 text-[#A3A2A0] transition-transform duration-200 group-data-[state=open]:-rotate-90"
                    />
                    <p className="text-sm font-bold ml-2">
                      Personalization & Ads:
                    </p>
                  </div>

                  <Switch
                    checked={consentAds}
                    onCheckedChange={handleConsentAdsChange}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer"
                  />
                </AccordionTrigger>

                <AccordionContent className="text-left px-3 text-xs text-[#757575] mt-2">
                  Use the data you provide and import to build a profile linked
                  to your Sophon Account, customize your experience, provide
                  relevant ads and provide potential rewards without sharing
                  your data with third parties.
                </AccordionContent>
              </AccordionItem>
            </div>
            <div className="w-full bg-white rounded-lg p-4">
              <AccordionItem value="item-2">
                <AccordionTrigger className="group flex w-full items-center justify-between p-0">
                  <div className="flex items-center">
                    <CaretRightIcon
                      weight="bold"
                      className="w-4 h-4 text-[#A3A2A0] transition-transform duration-200 group-data-[state=open]:-rotate-90"
                    />
                    <p className="text-sm font-bold ml-2">Sharing your data:</p>
                  </div>

                  <Switch
                    checked={consentData}
                    onCheckedChange={handleConsentDataChange}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer"
                  />
                </AccordionTrigger>

                <AccordionContent className="text-left px-3 text-xs text-[#757575] mt-2">
                  Sharing your data or zkTLS proofs related to such data with
                  our data partners so they can deliver personalized ads,
                  experiences and recommendations.
                </AccordionContent>
              </AccordionItem>
            </div>
          </Accordion>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <p className="text-xs text-[#757575]">
            You can withdraw your consent at any time by sending us an email at{' '}
            <a href="mailto:data@sophon.xyz" target="_blank" rel="noreferrer">
              data@sophon.xyz
            </a>
            . Withdrawal will stop any future use of your data for these
            purposes, but it will not affect processing already carried out
            while your consent was active. Please refer to our{' '}
            <a
              href="https://sophon.xyz/privacypolicy"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              Privacy Policy
            </a>{' '}
            to find out how we process and protect your data and how you can
            exercise your rights.
          </p>
        </div>
      </div>
    </div>
  );
}

ConsentRequestView.useActions = useConsentRequestActions;
