import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { getInternalApiUrl } from './lib/api-config';

// Enable ISR with 60-second revalidation
export const revalidate = 60;

// Homepage metadata
export const metadata: Metadata = {
  title: 'YoForex - Expert Advisor Forum & EA Marketplace',
  description: 'Join 10,000+ forex traders. Download free EAs, share strategies, and earn coins. #1 MT4/MT5 EA community with verified backtests and live results.',
  keywords: ['forex forum', 'EA marketplace', 'Expert Advisor', 'MT4', 'MT5', 'forex trading', 'algorithmic trading', 'free EAs', 'trading robots'],
};

async function fetchData(url: string) {
  const apiUrl = getInternalApiUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
  
  try {
    console.log(`[SSR Fetch] Fetching: ${apiUrl}${url}`);
    const res = await fetch(`${apiUrl}${url}`, {
      signal: controller.signal,
      next: { revalidate: 60 },
      headers: {
        'Accept': 'application/json',
      },
    });
    
    clearTimeout(timeout);
    
    if (!res.ok) {
      console.error(`[SSR Fetch] Failed ${url}: ${res.status}`);
      return null;
    }
    
    return await res.json();
  } catch (error: any) {
    clearTimeout(timeout);
    
    // Handle abort errors gracefully - these are expected when the request times out
    if (error.name === 'AbortError') {
      console.log(`[SSR Fetch] Request timed out for ${url}`);
      return null;
    }
    
    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log(`[SSR Fetch] Network error for ${url}: Service unavailable`);
      return null;
    }
    
    // Log other unexpected errors
    console.error(`[SSR Fetch] Unexpected error for ${url}:`, error.message);
    return null;
  }
}

export default async function HomePage() {
  // Parallel data fetching from Express API
  const [stats, topCategories, threads] = await Promise.all([
    fetchData('/api/stats'),
    fetchData('/api/categories/tree/top?limit=6'),  // Fetch top 6 categories for homepage
    fetchData('/api/threads'),
  ]);

  return (
    <HomeClient 
      initialStats={stats}
      initialCategories={topCategories}
      initialThreads={threads}
    />
  );
}
