import { serverLog } from '@/lib/server-log';
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
  searchParams,
}: {
  params: Promise<{ partnerId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { scopes } = await searchParams;
  serverLog(`scopes ${scopes}`);
  const { partnerId } = await params;
  return <DesktopRoot partnerId={partnerId} />;
}
