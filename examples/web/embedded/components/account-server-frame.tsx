import { useCallback, useMemo, useRef } from 'react';

export interface AccountServerFrameProps {
  src: string;
  className?: string;
  ref?: React.RefObject<HTMLIFrameElement | null>;
}

export const AccountServerFrame = ({
  src,
  className,
  ref,
}: AccountServerFrameProps) => {
  return (
    <iframe
      id="account-server-frame"
      title="Account Server Frame"
      src={src}
      height="100%"
      width="100%"
      className={className}
      sandbox="allow-same-origin allow-scripts allow-forms frame-ancestors"
      ref={ref}
    />
  );
};

export const useAccountServer = ({
  src,
  className,
}: AccountServerFrameProps) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const component = useMemo(() => {
    return (
      <AccountServerFrame src={src} className={className} ref={frameRef} />
    );
  }, [src, className]);
  const sendMessage = useCallback(
    (message: { action: string; payload: unknown }) => {
      frameRef.current?.contentWindow?.postMessage(
        { type: 'embedded', payload: JSON.stringify(message) },
        '*',
      );
    },
    [],
  );
  return { AccountServer: component, sendMessage };
};
