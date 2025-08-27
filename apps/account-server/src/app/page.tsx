import DesktopRoot from './_components/desktop.root';

/**
 * This is the root page for the account server, this version
 * does not require to have a partnerId, and its meant to be used
 * by EIP-6963 applications.
 *
 * @returns The desktop version of the account server.
 */
export default function RootPage() {
  return <DesktopRoot />;
}
