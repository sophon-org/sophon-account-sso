import { useEffect, useState } from 'react';

export const IsBrowser = ({ children }) => {
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  if (isBrowser) {
    return <>{children}</>;
  }

  // biome-ignore lint/complexity/noUselessFragments: required to avoid hidratation errors
  return <></>;
};
