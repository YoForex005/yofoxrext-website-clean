import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import type { ForumThread, ForumReply } from '@shared/schema';
import ThreadDetailClient from './ThreadDetailClient';
import { getThreadUrl } from '../../../lib/category-path';
import { getMetadataWithOverrides } from '../../lib/metadata-helper';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

async function fetchData(url: string) {
  try {
    const expressUrl = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
    const res = await fetch(`${expressUrl}${url}`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!res.ok) {
      console.error(`Failed to fetch ${url}:`, res.status, res.statusText);
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function createExcerpt(html: string, maxLength: number = 155): string {
  const text = stripHtml(html);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const slugPath = slug.join('/');
  const thread: ForumThread | null = await fetchData(`/api/threads/slug/${slugPath}`);

  if (!thread) {
    return {
      title: 'Thread Not Found - YoForex',
      description: 'The thread you are looking for does not exist.',
    };
  }

  const description = thread.metaDescription || createExcerpt(thread.body || '');
  const title = `${thread.title} - YoForex Forum`;
  
  // Default metadata
  const defaultMetadata: Metadata = {
    title,
    description,
    keywords: [
      thread.categorySlug || 'forum',
      'EA discussion',
      'forex forum',
      'expert advisor',
      'trading discussion',
      'MT4',
      'MT5',
    ],
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://yoforex.com/thread/${slugPath}`,
      siteName: 'YoForex',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };

  // Try to fetch SEO overrides for this thread
  const pathname = `/thread/${slugPath}`;
  return await getMetadataWithOverrides(pathname, defaultMetadata);
}

export default async function ThreadDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const slugPath = slug.join('/');
  
  // Fetch thread data from Express API
  const thread: ForumThread | null = await fetchData(`/api/threads/slug/${slugPath}`);
  
  // Return 404 if thread doesn't exist
  if (!thread) {
    notFound();
  }
  
  // Fetch replies for the thread
  const replies: ForumReply[] = await fetchData(`/api/threads/${thread.id}/replies`) || [];
  
  // Display the thread directly with correct prop names
  return <ThreadDetailClient initialThread={thread} initialReplies={replies} />;
}
