import type { Viewport } from 'next';
import EmbeddedPage from './page.client';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function EmbeddedPageRoot() {
  return <EmbeddedPage />;
}
