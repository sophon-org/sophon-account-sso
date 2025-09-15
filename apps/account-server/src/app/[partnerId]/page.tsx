import type { DataScopes } from '@sophon-labs/account-core';
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
  const { partnerId } = await params;

  const requestedScopes: DataScopes[] = [];
  if (scopes?.length) {
    if (typeof scopes === 'string') {
      requestedScopes.push(scopes as DataScopes);
    } else {
      requestedScopes.push(...(scopes as DataScopes[]));
    }
  }

  return <DesktopRoot partnerId={partnerId} scopes={requestedScopes} />;
}
