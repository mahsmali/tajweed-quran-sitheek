import type { Metadata } from 'next';
import { OfflineScreen } from '@/components/OfflineScreen';

export const metadata: Metadata = {
  title: 'Offline — Tajweed Engine',
  description: 'This screen has not been saved to the device yet.',
  // Nothing here is worth finding in a search result; it exists only as the
  // service worker's last resort.
  robots: { index: false, follow: false },
};

/**
 * The page `public/sw.js` serves when a navigation fails and there is no
 * cached copy of the route that was asked for.
 *
 * It must render with no network, no data and no client state, which is why it
 * is a plain static route rather than anything that reaches for a store: the
 * service worker precaches this HTML at install time and replays it verbatim.
 */
export default function OfflinePage() {
  return <OfflineScreen />;
}
