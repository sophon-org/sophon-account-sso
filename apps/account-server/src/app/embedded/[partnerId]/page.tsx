import type { Viewport } from 'next';
import EmbeddedRoot from '../../_components/embedded.root';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function EmbeddedPageRoot({
  params,
}: {
  params: Promise<{ partnerId: string }>;
}) {
  const { partnerId } = await params;
  return <EmbeddedRoot partnerId={partnerId} />;
}
