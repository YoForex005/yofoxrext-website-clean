import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Suspense } from "react";
import MessagesClient from "./MessagesClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Messages | YoForex",
  description: "View and manage your private messages with other YoForex community members.",
  keywords: "messages, private messages, inbox, conversations, chat",
  openGraph: {
    title: "Messages | YoForex",
    description: "View and manage your private messages with other YoForex community members.",
    type: "website",
    siteName: "YoForex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Messages | YoForex",
    description: "View and manage your private messages with other YoForex community members.",
  },
};

// Enable ISR with 10-second revalidation for better performance
export const revalidate = 10;

async function getUser() {
  const EXPRESS_URL = process.env.EXPRESS_URL || 'http://127.0.0.1:3001';
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');

  try {
    const res = await fetch(`${EXPRESS_URL}/api/me`, {
      headers: {
        Cookie: cookieHeader,
      },
      credentials: 'include',
      next: { revalidate: 10 },
    });

    if (res.status === 401) {
      return null;
    }

    if (!res.ok) {
      // Return null for any error status - redirect will handle it
      return null;
    }

    return await res.json();
  } catch (error) {
    // Silently return null - redirect logic handles unauthenticated users
    return null;
  }
}

async function getConversations(cookieHeader: string) {
  const EXPRESS_URL = process.env.EXPRESS_URL || 'http://127.0.0.1:3001';
  
  try {
    const res = await fetch(`${EXPRESS_URL}/api/conversations`, {
      headers: {
        Cookie: cookieHeader,
      },
      credentials: 'include',
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      console.error('Failed to fetch conversations:', res.status);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

// Loading fallback component for Suspense boundary
function MessagesLoadingFallback() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        {/* Left Column: Conversation List Skeleton */}
        <div className="md:col-span-1 space-y-3">
          <Card>
            <CardHeader>
              <Skeleton className="h-10 w-full" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: Chat Window Skeleton */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader className="border-b">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <Skeleton className="h-16 w-3/5 rounded-lg" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default async function MessagesPage() {
  // Don't do server-side authentication check - let the client handle it
  // This prevents redirect loops and allows for better UX with login prompts
  return (
    <Suspense fallback={<MessagesLoadingFallback />}>
      <MessagesClient initialConversations={[]} />
    </Suspense>
  );
}
