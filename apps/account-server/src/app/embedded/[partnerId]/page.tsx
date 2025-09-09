import type { Viewport } from 'next';
import EmbeddedRoot from '../../_components/embedded.root';
import { serverLog } from '@/lib/server-log';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function EmbeddedPageRoot({
  params,
  searchParams,
}: {
  params: Promise<{ partnerId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { scopes } = await searchParams;
  serverLog(`scopes ${scopes}`);
  const { partnerId } = await params;
  return <EmbeddedRoot partnerId={partnerId} />;
}
