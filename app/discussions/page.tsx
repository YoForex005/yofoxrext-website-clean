import type { Metadata } from 'next';
import { Suspense } from 'react';
import Header from '../components/Header';
import { Footer } from '../components/Footer';
import DiscussionsClient from './DiscussionsClient';
import { getMetadataWithOverrides } from '../lib/metadata-helper';
import { getInternalApiUrl } from '../lib/api-config';
import { Skeleton } from '../components/ui/skeleton';

// Enable ISR with 60-second revalidation
export const revalidate = 60;

// Generate SEO metadata with overrides
export async function generateMetadata(): Promise<Metadata> {
  return await getMetadataWithOverrides('/discussions', {
    title: 'Forum Discussions | YoForex - Expert Advisor Community',
    description: 'Join the YoForex community forum. Discuss trading strategies, expert advisors, and MT4/MT5 indicators with forex traders worldwide.',
    keywords: ['forex forum', 'EA discussion', 'MT4 forum', 'trading community', 'expert advisor forum'],
    openGraph: {
      title: 'Forum Discussions | YoForex - Expert Advisor Community',
      description: 'Join the YoForex community forum. Discuss trading strategies, expert advisors, and MT4/MT5 indicators with forex traders worldwide.',
      type: 'website',
      url: 'https://yoforex.net/discussions',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Forum Discussions | YoForex - Expert Advisor Community',
      description: 'Join the YoForex community forum. Discuss trading strategies, expert advisors, and MT4/MT5 indicators with forex traders worldwide.',
    },
  });
}

// Fetch from Express API
async function getThreads() {
  try {
    // Use internal API URL for server-side fetching
    const apiUrl = getInternalApiUrl();
    const res = await fetch(`${apiUrl}/api/threads?sortBy=newest&limit=50`, {
      next: { revalidate: 60 },
      credentials: 'include',
    });

    if (!res.ok) {
      console.error('[Discussions Page] Failed to fetch threads:', res.status);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error('[Discussions Page] Error fetching threads:', error);
    return [];
  }
}

// Loading fallback component for Suspense
function DiscussionsLoadingFallback() {
  return (
    <main className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="mb-4">
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </main>
  );
}

// Server Component
export default async function DiscussionsPage() {
  const initialThreads = await getThreads();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={<DiscussionsLoadingFallback />}>
        <DiscussionsClient initialThreads={initialThreads} />
      </Suspense>
      <Footer />
    </div>
  );
}
