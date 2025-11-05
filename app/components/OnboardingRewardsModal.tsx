"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Upload, MessageSquare, Star, Coins, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { withSweetsAccess } from "../../lib/sweetsAuth";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  reward: number;
  icon: React.ElementType;
  checkField: string;
  ctaText: string;
  ctaHref: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "photo",
    title: "Upload Profile Photo",
    description: "Add a profile picture to personalize your account",
    reward: 10,
    icon: Upload,
    checkField: "profileImageUrl",
    ctaText: "Upload Photo",
    ctaHref: "/settings",
  },
  {
    id: "thread",
    title: "Post First Thread",
    description: "Share your first discussion with the community",
    reward: 25,
    icon: MessageSquare,
    checkField: "hasFirstThread",
    ctaText: "Create Thread",
    ctaHref: "/discussions/new",
  },
  {
    id: "review",
    title: "Review a Broker",
    description: "Help others by reviewing a forex broker",
    reward: 50,
    icon: Star,
    checkField: "hasFirstReview",
    ctaText: "Write Review",
    ctaHref: "/brokers",
  },
];

export default function OnboardingRewardsModal() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Fetch onboarding progress
  const { data: progressData } = useQuery<{
    hasProfileImage: boolean;
    threadCount: number;
    reviewCount: number;
    totalStepsCompleted: number;
  }>({
    queryKey: ["/api/user/onboarding-progress", user?.id],
    enabled: !!user?.id && isAuthenticated && !user.isBot,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissed = localStorage.getItem("onboarding-rewards-dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
      return;
    }

    // Auto-show modal on first login if not all steps completed
    if (
      isAuthenticated &&
      progressData &&
      progressData.totalStepsCompleted < 3 &&
      !isDismissed
    ) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000); // Delay 1s after login
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, progressData, isDismissed]);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem("onboarding-rewards-dismissed", "true");
    setIsDismissed(true);
  };

  // Check if user has access to sweets system (blocks bots and suspended users)
  if (!withSweetsAccess(user)) return null;
  
  if (!progressData) return null;

  const completedSteps = progressData.totalStepsCompleted || 0;
  const progressPercentage = (completedSteps / 3) * 100;

  const isStepCompleted = (stepId: string) => {
    if (stepId === "photo") return progressData.hasProfileImage;
    if (stepId === "thread") return progressData.threadCount > 0;
    if (stepId === "review") return progressData.reviewCount > 0;
    return false;
  };

  const totalRewards = ONBOARDING_STEPS.reduce(
    (sum, step) => (isStepCompleted(step.id) ? sum + step.reward : sum),
    0
  );

  const potentialRewards = ONBOARDING_STEPS.reduce(
    (sum, step) => sum + step.reward,
    0
  );

  return (
    <>
      {/* Trigger button - always visible if not all steps completed */}
      {completedSteps < 3 && !isDismissed && (
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-40 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground"
          data-testid="button-open-onboarding"
        >
          <Coins className="h-4 w-4 mr-2" />
          Earn {potentialRewards - totalRewards} Coins
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="sm:max-w-[500px] dark:bg-gray-900 dark:border-gray-800"
          data-testid="modal-onboarding"
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl dark:text-white">
                Welcome Rewards!
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                data-testid="button-close-onboarding"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="dark:text-gray-400">
              Complete these steps to earn {potentialRewards} coins total!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm dark:text-gray-300">
                <span className="font-medium">
                  {completedSteps} of 3 steps completed
                </span>
                <Badge variant="secondary" className="dark:bg-gray-800 dark:text-gray-300">
                  <Coins className="h-3 w-3 mr-1" />
                  {totalRewards} / {potentialRewards} coins
                </Badge>
              </div>
              <Progress
                value={progressPercentage}
                className="h-2 dark:bg-gray-800"
                data-testid="progress-onboarding"
              />
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {ONBOARDING_STEPS.map((step) => {
                const completed = isStepCompleted(step.id);
                const Icon = step.icon;

                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors dark:border-gray-800 ${
                      completed
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                    }`}
                    data-testid={`step-${step.id}`}
                  >
                    <div className="flex-shrink-0">
                      {completed ? (
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <h4 className="font-semibold text-sm dark:text-white">
                          {step.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className="ml-auto bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700"
                        >
                          <Coins className="h-3 w-3 mr-1" />
                          +{step.reward}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {step.description}
                      </p>
                      {!completed && (
                        <Link href={step.ctaHref} onClick={() => setIsOpen(false)}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                            data-testid={`button-${step.id}`}
                          >
                            {step.ctaText}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {completedSteps === 3 && (
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-400">
                  🎉 All Steps Completed!
                </h4>
                <p className="text-sm text-green-700 mt-1 dark:text-green-500">
                  You've earned {potentialRewards} coins total!
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
