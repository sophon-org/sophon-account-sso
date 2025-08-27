import DesktopRoot from '../_components/desktop.root';

/**
 * This is the root page for the account server, this version
 * requires to have a partnerId, and its meant to be used
 * our own native SDK.
 *
 * @returns The desktop version of the account server.
 */
export default async function RootPage({
  params,
}: {
  params: Promise<{ partnerId: string }>;
}) {
  const { partnerId } = await params;
  return <DesktopRoot partnerId={partnerId} />;
}
