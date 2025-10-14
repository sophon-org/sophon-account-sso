import type { DataScopes } from '@sophon-labs/account-core';
import type { Viewport } from 'next';
import DynamicEmbeddedRoot from '@/app/_components/embedded.client';

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
  const { partnerId } = await params;

  const requestedScopes: DataScopes[] = [];
  if (scopes?.length) {
    if (typeof scopes === 'string') {
      requestedScopes.push(scopes as DataScopes);
    } else {
      requestedScopes.push(...(scopes as DataScopes[]));
    }
  }

  return <DynamicEmbeddedRoot partnerId={partnerId} scopes={requestedScopes} />;
}
