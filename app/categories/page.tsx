import type { Metadata } from 'next';
import CategoriesClient from './CategoriesClient';
import type { ForumCategory } from '@shared/schema';

// Express API base URL - Use internal URL for server-side fetching
const EXPRESS_URL = process.env.EXPRESS_URL || 'http://127.0.0.1:3001';

// Enable ISR with 60-second revalidation
export const revalidate = 60;

// SEO Metadata as specified in requirements
export const metadata: Metadata = {
  title: 'Forum Categories | YoForex',
  description: 'Browse all forum categories on YoForex. Find discussions about expert advisors, indicators, brokers, trading strategies, and more.',
  keywords: 'forum categories, EA categories, trading topics, forex discussion categories',
  openGraph: {
    title: 'Forum Categories | YoForex',
    description: 'Browse all forum categories on YoForex. Find discussions about expert advisors, indicators, brokers, trading strategies, and more.',
    type: 'website',
    url: 'https://yoforex.net/categories',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forum Categories | YoForex',
    description: 'Browse all forum categories on YoForex. Find discussions about expert advisors, indicators, brokers, trading strategies, and more.',
  },
};

// Server Component
export default async function CategoriesPage() {
  // Fetch categories from Express API
  let initialCategories: ForumCategory[] = [];
  
  try {
    const res = await fetch(`${EXPRESS_URL}/api/categories`, {
      next: { revalidate: 60 },
    });

    if (res.ok) {
      initialCategories = await res.json();
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    initialCategories = [];
  }

  // Pass data to Client Component
  return <CategoriesClient initialCategories={initialCategories} />;
}
