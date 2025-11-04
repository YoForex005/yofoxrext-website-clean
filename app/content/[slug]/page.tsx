import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import ContentDetailClient from './ContentDetailClient';
import type { Content, User as UserType, ContentReview } from '@shared/schema';
import { getContentUrl } from '../../../lib/category-path';
import { getMetadataWithOverrides } from '../../lib/metadata-helper';
import { getInternalApiUrl } from '../../lib/api-config';

// Express API base URL
const EXPRESS_URL = getInternalApiUrl();

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    // Check if slug is UUID format
    const isUUID = slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const endpoint = isUUID 
      ? `${EXPRESS_URL}/api/content/${slug}`
      : `${EXPRESS_URL}/api/content/slug/${slug}`;

    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) {
      return {
        title: 'Content Not Found | YoForex Marketplace',
      };
    }

    const content: Content = await res.json();
    
    // Get cover image
    const images = content.images || [];
    const coverImage = images.find(img => img.isCover) || images[0];
    
    // Create description from content description (first 150 chars)
    const description = content.description 
      ? content.description.substring(0, 150) + (content.description.length > 150 ? '...' : '')
      : `Download ${content.title} - ${content.type} for MT4/MT5`;
    
    // Get tags as keywords
    const tags = content.tags || [];
    const keywords = tags.length > 0 ? tags.join(', ') : 'forex, EA, indicator, MT4, MT5';

    // Default metadata
    const defaultMetadata: Metadata = {
      title: `${content.title} | YoForex Marketplace`,
      description,
      keywords,
      openGraph: {
        title: content.title,
        description,
        images: coverImage?.url ? [{ url: coverImage.url }] : [],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: content.title,
        description,
        images: coverImage?.url ? [coverImage.url] : [],
      },
    };
    
    // Try to fetch SEO overrides for this content
    const pathname = `/content/${slug}`;
    return await getMetadataWithOverrides(pathname, defaultMetadata);
  } catch (error) {
    return {
      title: 'Content Not Found | YoForex Marketplace',
    };
  }
}

// Main page component (Server Component)
export default async function ContentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Check if slug is UUID format
  const isUUID = slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  const contentEndpoint = isUUID 
    ? `${EXPRESS_URL}/api/content/${slug}`
    : `${EXPRESS_URL}/api/content/slug/${slug}`;

  // Fetch content with error handling that doesn't trigger Next.js 404
  let content: Content | undefined = undefined;
  try {
    const contentRes = await fetch(contentEndpoint, { 
      cache: 'no-store',
      // Prevent Next.js from treating this as a 404 route
    });
    if (contentRes.ok) {
      content = await contentRes.json();
    }
  } catch (error) {
    // Swallow error - we'll show custom error card
    content = undefined;
  }

  // If content not found, return 404
  if (!content) {
    return (
      <ContentDetailClient
        slug={slug}
        initialContent={undefined}
        initialAuthor={undefined}
        initialReviews={[]}
        initialSimilarContent={[]}
        initialAuthorReleases={[]}
      />
    );
  }

  // Fetch all necessary data for the content detail page
  let author: UserType | undefined = undefined;
  let reviews: Array<ContentReview & { user: UserType }> = [];
  let similarContent: Content[] = [];
  let authorReleases: Content[] = [];

  // Fetch author info
  if (content.authorId) {
    try {
      const authorRes = await fetch(`${EXPRESS_URL}/api/users/${content.authorId}`, {
        cache: 'no-store',
      });
      if (authorRes.ok) {
        author = await authorRes.json();
      }
    } catch (error) {
      console.error('Failed to fetch author:', error);
      // Continue with undefined author
    }
  }

  // Fetch reviews for the content
  if (content.id) {
    try {
      const reviewsRes = await fetch(`${EXPRESS_URL}/api/content/${content.id}/reviews`, {
        cache: 'no-store',
      });
      if (reviewsRes.ok) {
        reviews = await reviewsRes.json();
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      // Continue with empty reviews array
    }
  }

  // Fetch similar content from the same category
  if (content.category) {
    try {
      const similarRes = await fetch(`${EXPRESS_URL}/api/content?category=${encodeURIComponent(content.category)}&limit=6`, {
        cache: 'no-store',
      });
      if (similarRes.ok) {
        const similarData = await similarRes.json();
        // Filter out the current content from similar results
        similarContent = (Array.isArray(similarData) ? similarData : similarData.items || [])
          .filter((item: Content) => item.id !== content.id)
          .slice(0, 5);
      }
    } catch (error) {
      console.error('Failed to fetch similar content:', error);
      // Continue with empty array
    }
  }

  // Fetch other releases by the same author
  if (content.authorId) {
    try {
      const authorReleasesRes = await fetch(`${EXPRESS_URL}/api/user/${content.authorId}/content`, {
        cache: 'no-store',
      });
      if (authorReleasesRes.ok) {
        const releasesData = await authorReleasesRes.json();
        // Filter out the current content from author releases
        authorReleases = (Array.isArray(releasesData) ? releasesData : releasesData.items || [])
          .filter((item: Content) => item.id !== content.id);
      }
    } catch (error) {
      console.error('Failed to fetch author releases:', error);
      // Continue with empty array
    }
  }

  // Pass all fetched data to the client component
  return (
    <ContentDetailClient
      slug={slug}
      initialContent={content}
      initialAuthor={author}
      initialReviews={reviews}
      initialSimilarContent={similarContent}
      initialAuthorReleases={authorReleases}
    />
  );
}

// Enable dynamic rendering with no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
