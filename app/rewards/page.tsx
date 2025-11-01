"use client";

import { useState } from "react";
import { Gift, Coins, Filter, SortAsc, ShoppingCart, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RedemptionModal from "@/components/RedemptionModal";
import type { RedemptionOption } from "../../shared/schema";

export default function RewardsCatalogPage() {
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedItem, setSelectedItem] = useState<RedemptionOption | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: balanceData } = useQuery<{ balance: number }>({
    queryKey: ["/api/sweets/balance/me"],
    enabled: !!user && isAuthenticated,
  });

  const { data: items, isLoading } = useQuery<RedemptionOption[]>({
    queryKey: ["/api/sweets/redemptions/options", selectedCategory, sortBy],
    enabled: !!user && isAuthenticated,
  });

  const currentBalance = balanceData?.balance ?? 0;

  const handleRedeemClick = (item: RedemptionOption) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "gift_card":
        return <Gift className="h-4 w-4" />;
      case "premium_feature":
        return <Star className="h-4 w-4" />;
      case "merchandise":
        return <ShoppingCart className="h-4 w-4" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "gift_card":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "premium_feature":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "merchandise":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "donation":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Sign in to view rewards</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be signed in to browse and redeem rewards.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl" data-testid="page-rewards-catalog">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Rewards Catalog</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Redeem your coins for awesome rewards
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Badge className="bg-yellow-500 text-yellow-900 dark:bg-yellow-600 dark:text-yellow-100">
            <Coins className="h-3 w-3 mr-1" />
            {currentBalance.toLocaleString()} coins available
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2 flex-1">
          <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px] dark:bg-gray-900 dark:border-gray-800 dark:text-white">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800">
              <SelectItem value="all" className="dark:text-gray-200 dark:focus:bg-gray-800">All Categories</SelectItem>
              <SelectItem value="gift_card" className="dark:text-gray-200 dark:focus:bg-gray-800">Gift Cards</SelectItem>
              <SelectItem value="premium_feature" className="dark:text-gray-200 dark:focus:bg-gray-800">Premium Features</SelectItem>
              <SelectItem value="merchandise" className="dark:text-gray-200 dark:focus:bg-gray-800">Merchandise</SelectItem>
              <SelectItem value="donation" className="dark:text-gray-200 dark:focus:bg-gray-800">Donations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <SortAsc className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[200px] dark:bg-gray-900 dark:border-gray-800 dark:text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800">
              <SelectItem value="newest" className="dark:text-gray-200 dark:focus:bg-gray-800">Newest</SelectItem>
              <SelectItem value="cost_low" className="dark:text-gray-200 dark:focus:bg-gray-800">Cost: Low to High</SelectItem>
              <SelectItem value="cost_high" className="dark:text-gray-200 dark:focus:bg-gray-800">Cost: High to Low</SelectItem>
              <SelectItem value="popular" className="dark:text-gray-200 dark:focus:bg-gray-800">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rewards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2 dark:bg-gray-800" />
                <Skeleton className="h-4 w-full dark:bg-gray-800" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full dark:bg-gray-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const canAfford = currentBalance >= item.coinCost;
            const outOfStock = item.stock !== null && item.stock <= 0;
            const canRedeem = canAfford && !outOfStock && item.isActive;

            return (
              <Card
                key={item.id}
                className="hover:shadow-lg transition-shadow dark:bg-gray-900 dark:border-gray-800"
                data-testid={`card-reward-${item.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getCategoryIcon(item.category) && getCategoryColor(item.category)}>
                      {getCategoryIcon(item.category)}
                      <span className="ml-1 capitalize">{item.category.replace("_", " ")}</span>
                    </Badge>
                    {item.stock !== null && (
                      <Badge variant="outline" className="dark:border-gray-700 dark:text-gray-300">
                        {item.stock > 0 ? `${item.stock} left` : "Out of stock"}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg dark:text-white">{item.name}</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-yellow-500" />
                      <span className="text-2xl font-bold dark:text-white">
                        {item.coinCost.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleRedeemClick(item)}
                    disabled={!canRedeem}
                    className="w-full"
                    variant={canAfford ? "default" : "outline"}
                    data-testid={`button-redeem-${item.id}`}
                  >
                    {outOfStock
                      ? "Out of Stock"
                      : !canAfford
                      ? `Need ${(item.coinCost - currentBalance).toLocaleString()} more`
                      : "Redeem Now"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Gift className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2 dark:text-white">No rewards available</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedCategory !== "all"
              ? "Try selecting a different category"
              : "Check back later for new rewards"}
          </p>
        </div>
      )}

      {/* Redemption Modal */}
      <RedemptionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={selectedItem}
        currentBalance={currentBalance}
      />
    </div>
  );
}
