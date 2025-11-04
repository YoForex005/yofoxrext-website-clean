"use client";

import { Suspense } from "react";
import ThreadCreationWizard from "@/components/ThreadCreationWizard";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import LeftEngagementSidebar from "@/discussions/new/LeftEngagementSidebar";
import RightEngagementSidebar from "@/discussions/new/RightEngagementSidebar";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

function CreateThreadContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category") || "general";

  // Check if user is authenticated
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["/api/me"],
    retry: false
  });

  // Loading state
  if (userLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background">
          <div className="container max-w-7xl mx-auto px-4 py-6">
            {/* 3-column responsive grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
              {/* Left Sidebar */}
              <div className="hidden lg:block">
                <div className="sticky top-[88px]">
                  <LeftEngagementSidebar />
                </div>
              </div>

              {/* Main Content - Loading State */}
              <div className="min-w-0">
                <Card className="w-full">
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-1/3" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-96 w-full" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar */}
              <div className="hidden lg:block">
                <div className="sticky top-[88px]">
                  <RightEngagementSidebar />
                </div>
              </div>
            </div>
          </div>
        </div>
        <EnhancedFooter />
      </>
    );
  }

  // Authentication check
  if (userError || !user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background">
          <div className="container max-w-7xl mx-auto px-4 py-6">
            {/* 3-column responsive grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
              {/* Left Sidebar */}
              <div className="hidden lg:block">
                <div className="sticky top-[88px]">
                  <LeftEngagementSidebar />
                </div>
              </div>

              {/* Main Content - Authentication Error */}
              <div className="min-w-0">
                <Card className="w-full">
                  <CardContent className="p-8">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You need to be logged in to create a thread. Please log in to continue.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar */}
              <div className="hidden lg:block">
                <div className="sticky top-[88px]">
                  <RightEngagementSidebar />
                </div>
              </div>
            </div>
          </div>
        </div>
        <EnhancedFooter />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          {/* 3-column responsive grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
            {/* Left Sidebar - Hidden on mobile, visible on lg+ */}
            <div className="hidden lg:block">
              <div className="sticky top-[88px]">
                <LeftEngagementSidebar />
              </div>
            </div>

            {/* Main Content - Thread Creation Wizard */}
            <div className="min-w-0">
              <ThreadCreationWizard categorySlug={categorySlug} />
            </div>

            {/* Right Sidebar - Hidden on mobile, visible on lg+ */}
            <div className="hidden lg:block">
              <div className="sticky top-[88px]">
                <RightEngagementSidebar />
              </div>
            </div>
          </div>
        </div>
      </div>
      <EnhancedFooter />
    </>
  );
}

export default function CreateThreadPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="min-h-screen bg-background">
          <div className="container max-w-7xl mx-auto px-4 py-6">
            {/* 3-column responsive grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
              {/* Left Sidebar */}
              <div className="hidden lg:block">
                <div className="sticky top-[88px]">
                  <LeftEngagementSidebar />
                </div>
              </div>

              {/* Main Content - Loading Fallback */}
              <div className="min-w-0">
                <Card className="w-full">
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-1/3" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-96 w-full" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar */}
              <div className="hidden lg:block">
                <div className="sticky top-[88px]">
                  <RightEngagementSidebar />
                </div>
              </div>
            </div>
          </div>
        </div>
        <EnhancedFooter />
      </>
    }>
      <CreateThreadContent />
    </Suspense>
  );
}