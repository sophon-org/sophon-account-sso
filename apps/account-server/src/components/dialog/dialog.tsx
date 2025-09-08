import { NutIcon } from '@phosphor-icons/react';
import { getSVGAvatarFromString } from '@sophon-labs/account-core';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { isAddress } from 'viem';
import { sophonTestnet } from 'viem/chains';
import { sendMessage } from '@/events';
import { useAddressWithSns } from '@/hooks/useAddressWithSns';
import { trackDialogInteraction } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { SOPHON_VIEM_CHAIN } from '@/lib/constants';
import { IconBack } from '../icons/icon-back';
import { IconClose } from '../icons/icon-close';
import { IconSophon } from '../icons/icon-sophon';
import { LegalNotice } from '../legal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export const DialogHeader = ({
  title,
  onBack,
  onClose,
  showSettings,
  dialogType = 'dialog',
  isFixed = false,
  showTestnetBanner = false,
}: {
  title?: string;
  onBack?: () => void;
  onClose?: () => void;
  showSettings?: boolean;
  dialogType?: string;
  isFixed?: boolean;
  showTestnetBanner?: boolean;
}) => {
  const handleDisconnect = () => {
    sendMessage('smart-contract.logout', null);
  };

  const titleIsAddress = isAddress(title || '');

  const avatarUrl = titleIsAddress && getSVGAvatarFromString(title || '');

  const { addressOrName } = useAddressWithSns(
    title as `0x${string}` | undefined,
    true,
  );

  const titleDisplay = titleIsAddress ? addressOrName : title;

  return (
    <div
      className={cn(
        'flex justify-between items-center pb-2 min-h-16 px-6',
        isFixed
          ? 'sticky top-0 left-0 right-0 backdrop-blur-sm z-50 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]'
          : '',
        showTestnetBanner ? 'pt-6' : 'pt-2',
      )}
    >
      <div
        className={cn(
          'flex justify-between items-center w-full',
          isFixed ? 'mx-auto max-w-[400px]' : '',
        )}
      >
        {!!onBack && (
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
            onClick={() => {
              trackDialogInteraction(dialogType, 'back');
              onBack();
            }}
          >
            <IconBack className="m-w-6 m-h-6" />
          </button>
        )}
        {!onBack && avatarUrl && (
          <div className="w-6 h-6 rounded-full overflow-hidden">
            <Image src={avatarUrl} alt="Sophon" width={24} height={24} />
          </div>
        )}
        <h2 className="text-xl font-bold flex-grow text-center">
          {titleDisplay}
        </h2>
        {!!onClose && (
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
            onClick={() => {
              trackDialogInteraction(dialogType, 'closed');
              onClose();
            }}
          >
            <IconClose className="m-w-6 m-h-6" />
          </button>
        )}
        {!!showSettings && (
          <DropdownMenu>
            <DropdownMenuTrigger className=" cursor-pointer">
              <NutIcon weight="fill" size={24} className="m-w-6 m-h-6" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mr-5">
              <DropdownMenuItem
                onClick={() => {
                  window.parent.open('https://app.sophon.xyz/', '_blank');
                }}
              >
                Manage account at Sophon home
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDisconnect}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export const DialogFooter = ({
  showLegalNotice,
  actions,
  addBackground,
}: {
  showLegalNotice: boolean;
  actions: React.ReactNode;
  addBackground: boolean;
}) => {
  return (
    <div
      className={cn(
        'mt-6 max-w-[400px] fixed bottom-0 left-0 right-0 mx-auto',
        addBackground
          ? ' bg-white z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]'
          : '',
      )}
    >
      <div className="flex flex-col items-center justify-center w-full px-6 py-4">
        {showLegalNotice && <LegalNotice />}
        {actions}
        <div className="flex items-center justify-center gap-2 text-sm mt-3 -my-2">
          <a
            className="flex items-center gap-2"
            href="https://sophon.xyz"
            target="_blank"
            rel="noreferrer"
          >
            Powered by <IconSophon className="w-8 h-8" />
          </a>
        </div>
      </div>
    </div>
  );
};

export interface DialogProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  onBack?: () => void;
  onClose?: () => void;
  showLegalNotice?: boolean;
  actions?: React.ReactNode;
  showSettings?: boolean;
  dialogType?: string;
}

export function Dialog({
  title,
  children,
  className,
  onBack,
  onClose,
  showLegalNotice = true,
  actions,
  showSettings = false,
  dialogType = 'dialog',
}: DialogProps) {
  const [isScrollable, setIsScrollable] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const showTestnetBanner = SOPHON_VIEM_CHAIN.id === sophonTestnet.id;

  useEffect(() => {
    trackDialogInteraction(dialogType, 'opened');
  }, [dialogType]);

  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const { scrollHeight, clientHeight } = scrollContainerRef.current;
        setIsScrollable(scrollHeight > clientHeight);
      }
    };

    checkScrollable();

    // Listen for content changes and window resize
    const observer = new ResizeObserver(checkScrollable);
    if (scrollContainerRef.current) {
      observer.observe(scrollContainerRef.current);
    }

    window.addEventListener('resize', checkScrollable);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkScrollable);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollTop } = scrollContainerRef.current;
        setIsScrolling(scrollTop > 0);
      }
    };

    // Only set up scroll listener when content is scrollable
    if (isScrollable) {
      const container = scrollContainerRef.current;

      if (container) {
        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
          container.removeEventListener('scroll', handleScroll);
        };
      }
    }
  }, [isScrollable]);
  return (
    <div
      ref={scrollContainerRef}
      className={cn('bg-white h-full w-full overflow-auto', className)}
      style={{
        background: 'linear-gradient(180deg, #DDEFFF 0%, #FFF 60%)',
      }}
    >
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-20"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src="/videos/clouds.webm" type="video/webm" />
      </video>
      {showTestnetBanner && (
        <div className="fixed bg-yellow-500 px-4 top-0 z-60 text-center text-white justify-self-center items-center rounded-b-lg">
          <strong className="text-xs">TESTNET</strong>
        </div>
      )}
      <div
        className={cn('mx-auto h-full relative max-w-[400px] flex flex-col')}
      >
        <DialogHeader
          title={title}
          onBack={onBack}
          onClose={onClose}
          showSettings={showSettings}
          dialogType={dialogType}
          isFixed={isScrollable && isScrolling}
          showTestnetBanner={showTestnetBanner}
        />
        <div
          className={cn(
            'flex-1 px-6',
            // Add bottom padding when footer is fixed to ensure content is visible
            isScrollable ? 'pb-40' : '',
          )}
        >
          {children}
        </div>
        <DialogFooter
          showLegalNotice={showLegalNotice}
          actions={actions}
          addBackground={isScrollable}
        />
      </div>
    </div>
  );
}
