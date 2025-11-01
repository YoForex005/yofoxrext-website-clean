"use client";

import { Coins, Gift, TrendingUp, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Guest CTA Component for Sweets Economy
 * 
 * Displays an attractive call-to-action for non-authenticated users
 * to encourage sign-up and participation in the sweets economy system.
 */
export function GuestSweetsCTA() {
  return (
    <Card className="bg-gradient-to-br from-orange-500 to-pink-500 border-0 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 opacity-10">
        <Sparkles className="h-32 w-32" />
      </div>
      <CardHeader className="relative z-10">
        <CardTitle className="text-white flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Earn Sweets for Your Contributions!
        </CardTitle>
        <CardDescription className="text-white/90">
          Join YoForex to earn virtual currency and redeem exciting rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            <span>Earn coins by posting threads, reviews, and content</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Gift className="h-4 w-4" />
            <span>Redeem rewards like gift cards and premium features</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4" />
            <span>Level up and unlock exclusive perks</span>
          </div>
        </div>
        <Link href="/test-auth-modal" data-testid="link-signin-sweets">
          <Button 
            className="w-full bg-white text-orange-600 hover:bg-white/90 font-semibold"
            size="lg"
          >
            Sign In to Start Earning
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
