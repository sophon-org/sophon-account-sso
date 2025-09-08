import {
  getSVGAvatarFromString,
  shortenAddress,
} from '@sophon-labs/account-core';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Drawer as VaulDrawer } from 'vaul';
import { isAddress } from 'viem';
import { trackDialogInteraction } from '@/lib/analytics';
import { IconBack } from '../icons/icon-back';
import { IconSettings } from '../icons/icon-settings';
import { IconSophon } from '../icons/icon-sophon';
import { LegalNotice } from '../legal';

interface DrawerProps {
  children?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnimationEnd?: (open: boolean) => void;
  onBack?: () => void;
  onSettings?: () => void;
  showLegalNotice?: boolean;
  showHeader?: boolean;
  showLogo?: boolean;
  showProfileImage?: boolean;
  title?: string;
  actions?: React.ReactNode;
  drawerType?: string;
}

interface DrawerHeaderProps {
  title?: string;
  showProfileImage?: boolean;
  onBack?: () => void;
  onSettings?: () => void;
  drawerType?: string;
  isScrolling?: boolean;
}

const DrawerHeader = ({
  title,
  showProfileImage,
  onBack,
  onSettings,
  drawerType = 'drawer',
  isScrolling,
}: DrawerHeaderProps) => {
  const titleIsAddress = isAddress(title || '');

  const avatarUrl = titleIsAddress && getSVGAvatarFromString(title || '');
  console.log(avatarUrl);

  const titleDisplay = titleIsAddress
    ? shortenAddress(title as `0x${string}`)
    : title;
  return (
    <div
      className={`relative flex justify-between items-center p-6 gap-2 w-full bg-transparent ${isScrolling ? 'z-50 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]' : ''}`}
    >
      <div className="flex items-center gap-2 z-10">
        {showProfileImage && avatarUrl && (
          <div className="w-6 h-6 rounded-full overflow-hidden">
            <Image src={avatarUrl} alt="Sophon" width={28} height={28} />
          </div>
        )}
        {onBack && (
          <button
            type="button"
            onClick={() => {
              trackDialogInteraction(drawerType, 'back');
              onBack();
            }}
          >
            <IconBack className="w-5 h-5" />
          </button>
        )}
      </div>
      <h5 className="text-2xl font-bold w-full text-center flex-grow mr-8">
        {titleDisplay}
      </h5>
      <div className="flex justify-end z-10">
        {onSettings && (
          <button type="button" onClick={onSettings}>
            <IconSettings className="w-7 h-7" />
          </button>
        )}
      </div>
    </div>
  );
};

interface DrawerFooterProps {
  showLegalNotice?: boolean;
  showLogo?: boolean;
  actions?: React.ReactNode;
}

const DrawerFooter = ({
  showLegalNotice,
  showLogo,
  actions,
}: DrawerFooterProps) => {
  if (!showLegalNotice && !showLogo && !actions) return null;

  return (
    <div className="mt-auto flex flex-col gap-2 p-4">
      <div className="flex flex-col items-center justify-center w-full">
        {actions}
        {showLegalNotice && <LegalNotice />}
        {showLogo && (
          <div className="flex items-center justify-center gap-2 text-md mt-2">
            Powered by <IconSophon className="w-12 h-12" />
          </div>
        )}
      </div>
    </div>
  );
};

export const Drawer = ({
  children,
  open,
  onOpenChange,
  onBack,
  onSettings,
  onAnimationEnd,
  showLegalNotice = true,
  showHeader = true,
  showLogo = true,
  showProfileImage = false,
  title,
  actions,
  drawerType = 'drawer',
}: DrawerProps) => {
  const [isScrollable, setIsScrollable] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkScrollable = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      setIsScrollable(scrollHeight > clientHeight);
    }
  }, []);

  // Track drawer opened/closed
  useEffect(() => {
    if (open) {
      // add small timeout to make sure ref is set
      setTimeout(() => {
        checkScrollable();
      }, 10);

      trackDialogInteraction(drawerType, 'opened');
    } else {
      trackDialogInteraction(drawerType, 'closed');
    }
  }, [open, drawerType, checkScrollable]);

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

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      trackDialogInteraction(drawerType, 'closed');
    }
    onOpenChange(isOpen);
  };

  return (
    <VaulDrawer.Root
      open={open}
      onOpenChange={handleOpenChange}
      onAnimationEnd={onAnimationEnd}
    >
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 bg-black/40" />
        <VaulDrawer.Content className="bg-gray-100 fixed h-fit bottom-0 left-0 right-0 outline-none rounded-t-3xl pb-2">
          <VaulDrawer.Title hidden={true}>
            Sophon Authentication Modal
          </VaulDrawer.Title>
          <VaulDrawer.Handle className="mt-4 w-[67px] bg-red-500" />

          {showHeader && (
            <DrawerHeader
              title={title}
              showProfileImage={showProfileImage}
              onBack={onBack}
              onSettings={onSettings}
              drawerType={drawerType}
              isScrolling={isScrolling}
            />
          )}
          <div
            ref={scrollContainerRef}
            className={`overflow-y-auto max-h-[60vh] px-4 pb-4`}
          >
            {children}
          </div>
          <DrawerFooter
            showLegalNotice={showLegalNotice}
            showLogo={showLogo}
            actions={actions}
          />
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
};
