import { Metadata } from 'next';
import BrokerDirectoryClient from './BrokerDirectoryClient';
import { getMetadataWithOverrides } from '../lib/metadata-helper';
import { ComingSoon } from '@/components/ComingSoon';

// Broker type matching the React component
type Broker = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  overallRating: number | null;
  reviewCount: number;
  scamReportCount: number;
  isVerified: boolean;
  regulationSummary: string | null;
};

// Feature Flag type
type FeatureFlag = {
  slug: string;
  status: 'enabled' | 'disabled' | 'coming_soon';
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
};

// Express API base URL
const EXPRESS_API_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';

// Fetch feature flag from server
async function getFeatureFlag(slug: string): Promise<FeatureFlag | null> {
  try {
    const response = await fetch(`${EXPRESS_API_URL}/api/feature-flags?slug=${slug}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch feature flag:', error);
    return null;
  }
}

// Generate SEO metadata with overrides and feature flag support
export async function generateMetadata(): Promise<Metadata> {
  // Check feature flag
  const flag = await getFeatureFlag('brokers-directory');
  
  // If coming soon, use flag's custom SEO
  if (flag && flag.status === 'coming_soon') {
    const title = flag.seoTitle || "Brokers Directory Coming Soon | YoForex";
    const description = flag.seoDescription || "We are building a comprehensive directory of forex brokers. Stay tuned for detailed reviews, ratings, and comparisons.";
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: flag.ogImage ? [{ url: flag.ogImage }] : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: flag.ogImage ? [flag.ogImage] : [],
      },
    };
  }
  
  return await getMetadataWithOverrides('/brokers', {
    title: "Broker Directory | YoForex",
    description: "Find trusted forex brokers for MT4/MT5 trading. Compare regulations, spreads, reviews, and community ratings.",
    keywords: "forex brokers, MT4 brokers, MT5 brokers, broker reviews, regulated brokers",
    openGraph: {
      title: "Broker Directory | YoForex",
      description: "Find trusted forex brokers for MT4/MT5 trading. Compare regulations, spreads, reviews, and community ratings.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Broker Directory | YoForex",
      description: "Find trusted forex brokers for MT4/MT5 trading. Compare regulations, spreads, reviews, and community ratings.",
    },
  });
}

export const revalidate = 0; // Disable caching for fresh data

export default async function BrokerDirectoryPage() {
  // Check feature flag
  const flag = await getFeatureFlag('brokers-directory');
  
  // If coming soon, show ComingSoon component
  if (flag && flag.status === 'coming_soon') {
    return (
      <ComingSoon
        title={flag.seoTitle || 'Brokers Directory Coming Soon'}
        description={flag.seoDescription || 'We are building a comprehensive directory of forex brokers. Stay tuned for detailed reviews, ratings, and comparisons.'}
        image={flag.ogImage || undefined}
        showEmailCapture={true}
        showSocialLinks={true}
      />
    );
  }
  
  // If disabled, show message
  if (flag && flag.status === 'disabled') {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold">Feature Unavailable</h1>
        <p className="text-muted-foreground mt-4">
          The brokers directory is currently unavailable. Please check back later.
        </p>
      </div>
    );
  }
  
  // Normal flow - feature is enabled or no flag exists
  let brokers: Broker[] = [];
  
  try {
    const response = await fetch(`${EXPRESS_API_URL}/api/brokers`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      brokers = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch brokers:', error);
    // Continue with empty array, client will show empty state
  }

  return <BrokerDirectoryClient initialBrokers={brokers} />;
}
