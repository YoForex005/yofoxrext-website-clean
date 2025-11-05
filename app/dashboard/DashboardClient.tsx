"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  BarChart,
  Coins,
  Target,
  Bell,
  UserCog,
  Megaphone,
  TrendingUp,
  Lock,
  LogIn,
} from "lucide-react";

// Import all tab components
import { RetentionDashboard } from "./RetentionDashboard";
import { OverviewTab } from "./components/tabs/OverviewTab";
import { SalesTab } from "./components/tabs/SalesTab";
import { ReferralsTab } from "./components/tabs/ReferralsTab";
import { AnalyticsTab } from "./components/tabs/AnalyticsTab";
import { EarningsTab } from "./components/tabs/EarningsTab";
import { GoalsTab } from "./components/tabs/GoalsTab";
import { NotificationsTab } from "./components/tabs/NotificationsTab";
import { CRMTab } from "./components/tabs/CRMTab";
import { MarketingTab } from "./components/tabs/MarketingTab";

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState("journey");
  const { user, isLoading, isAuthenticated } = useAuth();
  const { requireAuth, AuthPrompt } = useAuthPrompt("access your dashboard");

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Loading dashboard...</div>
        </main>
      </div>
    );
  }

  // If not authenticated, show a prompt to login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-7xl mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="text-2xl">Login Required</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                You need to be logged in to access your dashboard. Please login to continue.
              </p>
              <Button 
                onClick={() => requireAuth(() => {})} 
                className="w-full"
                data-testid="button-dashboard-login"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Login to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <EnhancedFooter />
        <AuthPrompt />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Manage your business, track performance, and grow your revenue
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap gap-2 h-auto bg-muted/50 p-2" data-testid="tabs-dashboard-navigation">
            <TabsTrigger 
              value="journey" 
              className="flex items-center gap-2"
              data-testid="tab-journey"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Journey</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2"
              data-testid="tab-overview"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="sales" 
              className="flex items-center gap-2"
              data-testid="tab-sales"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Sales</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="referrals" 
              className="flex items-center gap-2"
              data-testid="tab-referrals"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Referrals</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2"
              data-testid="tab-analytics"
            >
              <BarChart className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="earnings" 
              className="flex items-center gap-2"
              data-testid="tab-earnings"
            >
              <Coins className="w-4 h-4" />
              <span className="hidden sm:inline">Earnings</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="goals" 
              className="flex items-center gap-2"
              data-testid="tab-goals"
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="notifications" 
              className="flex items-center gap-2"
              data-testid="tab-notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="crm" 
              className="flex items-center gap-2"
              data-testid="tab-crm"
            >
              <UserCog className="w-4 h-4" />
              <span className="hidden sm:inline">CRM</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="marketing" 
              className="flex items-center gap-2"
              data-testid="tab-marketing"
            >
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">Marketing</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="journey" data-testid="content-journey">
            <RetentionDashboard />
          </TabsContent>

          <TabsContent value="overview" data-testid="content-overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="sales" data-testid="content-sales">
            <SalesTab />
          </TabsContent>

          <TabsContent value="referrals" data-testid="content-referrals">
            <ReferralsTab />
          </TabsContent>

          <TabsContent value="analytics" data-testid="content-analytics">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="earnings" data-testid="content-earnings">
            <EarningsTab />
          </TabsContent>

          <TabsContent value="goals" data-testid="content-goals">
            <GoalsTab />
          </TabsContent>

          <TabsContent value="notifications" data-testid="content-notifications">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="crm" data-testid="content-crm">
            <CRMTab />
          </TabsContent>

          <TabsContent value="marketing" data-testid="content-marketing">
            <MarketingTab />
          </TabsContent>
        </Tabs>
      </main>

      <EnhancedFooter />
    </div>
  );
}
