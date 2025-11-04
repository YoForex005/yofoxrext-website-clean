import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SubmitBrokerReviewClient from "./SubmitBrokerReviewClient";
import { getInternalApiUrl } from "../../lib/api-config";
import { ComingSoon } from '@/components/ComingSoon';

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
    const apiUrl = getInternalApiUrl();
    const response = await fetch(`${apiUrl}/api/feature-flags?slug=${slug}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch feature flag:', error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  // Check feature flag
  const flag = await getFeatureFlag('broker-submit-review');
  
  // If coming soon, use flag's custom SEO
  if (flag && flag.status === 'coming_soon') {
    const title = flag.seoTitle || "Submit Broker Review Coming Soon | YoForex";
    const description = flag.seoDescription || "Submit broker reviews and earn rewards - coming soon!";
    
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

  return {
    title: "Submit Broker Review | YoForex",
    description: "Share your experience with forex brokers. Help the community make informed decisions and earn coins.",
    keywords: "broker review, submit review, broker feedback, forex broker rating",
    openGraph: {
      title: "Submit Broker Review | YoForex",
      description: "Share your experience with forex brokers. Help the community make informed decisions and earn coins.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Submit Broker Review | YoForex",
      description: "Share your experience with forex brokers. Help the community make informed decisions and earn coins.",
    },
  };
}

async function checkAuth() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
  
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("connect.sid");
    
    if (!sessionCookie) {
      return null;
    }

    const apiUrl = getInternalApiUrl();
    console.log(`[SSR Fetch] Fetching: ${apiUrl}/api/me`);
    const response = await fetch(`${apiUrl}/api/me`, {
      signal: controller.signal,
      headers: { Cookie: `connect.sid=${sessionCookie.value}` },
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[SSR Fetch] Failed /api/me: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeout);
    
    // Handle abort errors gracefully
    if (error.name === 'AbortError') {
      console.log("[SSR Fetch] Request timed out for auth check");
      return null;
    }
    
    console.error("[SSR Fetch] Error checking auth:", error.message);
    return null;
  }
}

async function getBrokers() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
  
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("connect.sid");
    
    const apiUrl = getInternalApiUrl();
    console.log(`[SSR Fetch] Fetching: ${apiUrl}/api/brokers`);
    const response = await fetch(`${apiUrl}/api/brokers`, {
      signal: controller.signal,
      headers: sessionCookie ? { Cookie: `connect.sid=${sessionCookie.value}` } : {},
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[SSR Fetch] Failed /api/brokers: ${response.status}`);
      return [];
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeout);
    
    // Handle abort errors gracefully
    if (error.name === 'AbortError') {
      console.log("[SSR Fetch] Request timed out for brokers");
      return [];
    }
    
    console.error("[SSR Fetch] Error fetching brokers:", error.message);
    return [];
  }
}

export default async function SubmitBrokerReviewPage() {
  // Check feature flag
  const flag = await getFeatureFlag('broker-submit-review');
  
  // If coming soon, show ComingSoon component
  if (flag && flag.status === 'coming_soon') {
    return (
      <ComingSoon
        title={flag.seoTitle || 'Submit Broker Review Coming Soon'}
        description={flag.seoDescription || 'Submit broker reviews and earn rewards - coming soon! Join the waitlist to be notified when this feature launches.'}
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
          Submit broker review is currently unavailable. Please check back later.
        </p>
      </div>
    );
  }

  // Check authentication - this is an authenticated page
  const user = await checkAuth();
  if (!user) {
    redirect("/");
  }

  // Fetch broker list for selection dropdown
  const brokers = await getBrokers();

  return <SubmitBrokerReviewClient initialBrokers={brokers} />;
}
