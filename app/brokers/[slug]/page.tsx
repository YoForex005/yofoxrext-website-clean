import { Metadata } from 'next';
import BrokerProfileClient from './BrokerProfileClient';
import { ComingSoon } from '@/components/ComingSoon';

// Express API base URL
const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';

// Type definitions
type Broker = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  overallRating: number;
  reviewCount: number;
  scamReportCount: number;
  isVerified: boolean;
  regulationSummary: string | null;
  yearFounded: number | null;
  status: string;
};

type BrokerReview = {
  id: string;
  userName: string;
  userReputation: number;
  rating: number;
  reviewTitle: string;
  reviewBody: string;
  isScamReport: boolean;
  datePosted: Date;
  helpfulCount: number;
};

// Feature Flag type
type FeatureFlag = {
  slug: string;
  status: 'enabled' | 'disabled' | 'coming_soon';
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
};

// Fetch feature flag from server
async function getFeatureFlag(slug: string): Promise<FeatureFlag | null> {
  try {
    const response = await fetch(`${EXPRESS_URL}/api/feature-flags?slug=${slug}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch feature flag:', error);
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  // Check feature flag
  const flag = await getFeatureFlag('broker-profile');
  
  // If coming soon, use flag's custom SEO
  if (flag && flag.status === 'coming_soon') {
    const title = flag.seoTitle || "Broker Profiles Coming Soon | YoForex";
    const description = flag.seoDescription || "Detailed broker profiles with reviews, ratings, and regulations coming soon. Stay tuned!";
    
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
  
  try {
    const res = await fetch(`${EXPRESS_URL}/api/brokers/slug/${slug}`, { cache: 'no-store' });
    if (!res.ok) {
      return {
        title: 'Broker Not Found | YoForex',
      };
    }

    const broker: Broker = await res.json();
    
    const title = `${broker.name} - Broker Review & Profile | YoForex`;
    const description = `Read reviews, ratings, and detailed information about ${broker.name}. Check regulation, spreads, and community feedback. ${broker.reviewCount} verified reviews.`;
    const keywords = `${broker.name}, forex broker, MT4, MT5, broker review, regulation, ${broker.regulationSummary || ''}`;

    return {
      title,
      description,
      keywords,
      openGraph: {
        title: `${broker.name} - Broker Review & Profile`,
        description,
        images: broker.logoUrl ? [{ url: broker.logoUrl }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${broker.name} Review`,
        description,
        images: broker.logoUrl ? [broker.logoUrl] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Broker Not Found | YoForex',
    };
  }
}

// Main page component (Server Component)
export default async function BrokerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Check feature flag
  const flag = await getFeatureFlag('broker-profile');
  
  // If coming soon, show ComingSoon component
  if (flag && flag.status === 'coming_soon') {
    return (
      <ComingSoon
        title={flag.seoTitle || 'Broker Profiles Coming Soon'}
        description={flag.seoDescription || 'Detailed broker profiles with reviews, ratings, and regulations coming soon. Stay tuned!'}
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
          Broker profiles are currently unavailable. Please check back later.
        </p>
      </div>
    );
  }
  
  // Fetch broker with error handling that doesn't trigger Next.js 404
  let broker: Broker | null = null;
  try {
    const brokerRes = await fetch(`${EXPRESS_URL}/api/brokers/slug/${slug}`, { 
      cache: 'no-store',
    });
    if (brokerRes.ok) {
      broker = await brokerRes.json();
    }
  } catch (error) {
    // Swallow error - we'll show custom error card
    broker = null;
  }

  // If broker not found, return Client Component with undefined broker to show custom error card
  if (!broker) {
    return (
      <BrokerProfileClient
        slug={slug}
        initialBroker={undefined}
        initialReviews={[]}
      />
    );
  }

  // Fetch broker reviews (using broker ID, not slug)
  let reviews: BrokerReview[] = [];
  try {
    const reviewsRes = await fetch(`${EXPRESS_URL}/api/brokers/${broker.id}/reviews`, { 
      cache: 'no-store',
    });
    if (reviewsRes.ok) {
      reviews = await reviewsRes.json();
    }
  } catch (error) {
    // If reviews fail, just use empty array
    reviews = [];
  }

  // Pass all data to Client Component
  return (
    <BrokerProfileClient
      slug={slug}
      initialBroker={broker}
      initialReviews={reviews}
    />
  );
}

// Enable dynamic rendering with no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
