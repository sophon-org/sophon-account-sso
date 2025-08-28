import { useEffect, useRef, useState } from 'react';
import { sendMessage } from '@/events';
import { usePasskeyRegistration } from '@/hooks/usePasskeyRegistration';
import { trackDialogInteraction } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { IconBack } from '../icons/icon-back';
import { IconClose } from '../icons/icon-close';
import { IconSettings } from '../icons/icon-settings';
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
}: {
  title?: string;
  onBack?: () => void;
  onClose?: () => void;
  showSettings?: boolean;
  dialogType?: string;
  isFixed?: boolean;
}) => {
  const { addPasskey } = usePasskeyRegistration();
  const handleAddPasskey = async () => {
    addPasskey();
  };

  const handleDisconnect = () => {
    sendMessage('smart-contract.logout', null);
  };
  return (
    <div
      className={cn(
        'flex justify-between items-center py-2 min-h-16 px-6',
        isFixed
          ? 'sticky top-0 left-0 right-0 backdrop-blur-sm z-50 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]'
          : '',
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
        <h2 className="text-xl font-bold flex-grow text-center">{title}</h2>
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
              <IconSettings className="m-w-6 m-h-6" />
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
              <DropdownMenuItem onClick={handleAddPasskey}>
                Add passkey
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
  isFixed,
}: {
  showLegalNotice: boolean;
  actions: React.ReactNode;
  isFixed: boolean;
}) => {
  return (
    <div
      className={cn(
        'mt-6 max-w-[400px]',
        isFixed
          ? 'fixed bottom-0 left-0 right-0 bg-white z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] mx-auto'
          : '',
      )}
    >
      <div className="flex flex-col items-center justify-center w-full px-6 py-4">
        {showLegalNotice && <LegalNotice />}
        {actions}
        <div className="flex items-center justify-center gap-2 text-sm mt-3 -my-2">
          Powered by <IconSophon className="w-8 h-8" />
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
        background:
          'linear-gradient(180deg, rgba(255, 255, 255, 0.00) 0%, #FFF 75%), url(/images/skybg.webp) lightgray -46.312px 0px / 395.062% 100% no-repeat',
      }}
    >
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
          isFixed={isScrollable}
        />
      </div>
    </div>
  );
}
