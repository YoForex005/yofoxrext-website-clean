"use client";

import { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Grid3x3,
  List,
  Search,
  Star,
  Download,
  Eye,
  Coins,
  AlertCircle,
  Plus,
  TrendingUp,
  Package,
  Users,
  Filter,
  X,
  ShoppingCart,
  Heart,
  Sparkles,
  Award,
  Clock,
  ChevronRight,
  Zap,
  BarChart3,
  Brain,
  LineChart,
  Settings2,
  BookOpen,
  Code2,
  Rocket,
  ArrowRight,
  Info
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Content {
  id: string;
  slug: string;
  fullUrl?: string;
  title: string;
  description: string;
  type: string;
  category: string;
  priceCoins: number;
  isFree: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  postLogoUrl?: string;
  likes?: number;
  downloads?: number;
  views?: number;
  createdAt: string;
}

interface MarketplaceClientProps {
  initialContent: Content[];
}

// Enhanced Skeleton card component with shimmer effect
function ContentCardSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "grid") {
    return (
      <Card className="bg-white border-gray-200 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-video w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-wave" />
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-shimmer" />
              <div className="h-6 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-shimmer" />
            </div>
            <div className="h-7 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer" />
            <div className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer" />
            <div className="h-4 w-3/4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer" />
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <div className="flex gap-3">
                <div className="h-5 w-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer" />
                <div className="h-5 w-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer" />
              </div>
              <div className="h-8 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-shimmer" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200 shadow-lg overflow-hidden">
      <CardContent className="p-6 flex gap-5">
        <div className="w-40 h-32 rounded-xl flex-shrink-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer" />
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-shimmer" />
            <div className="h-6 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-shimmer" />
          </div>
          <div className="h-7 w-3/4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer" />
          <div className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer" />
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="h-5 w-28 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer" />
              <div className="h-5 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer" />
              <div className="h-5 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer" />
            </div>
            <div className="h-8 w-28 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-shimmer" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Star rating component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={cn(
            "w-4 h-4 transition-all",
            i < Math.floor(rating)
              ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
              : "fill-gray-200 text-gray-200"
          )}
        />
      ))}
      <span className="ml-1.5 text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
    </div>
  );
}

// Category configuration with colors and icons
const categoryConfig = {
  ea: { 
    icon: Zap, 
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-gradient-to-r from-purple-500 to-purple-600",
    lightColor: "bg-purple-50 text-purple-700 border-purple-200" 
  },
  indicator: { 
    icon: BarChart3, 
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-gradient-to-r from-blue-500 to-blue-600",
    lightColor: "bg-blue-50 text-blue-700 border-blue-200" 
  },
  article: { 
    icon: BookOpen, 
    color: "from-green-500 to-green-600",
    bgColor: "bg-gradient-to-r from-green-500 to-green-600",
    lightColor: "bg-green-50 text-green-700 border-green-200" 
  },
  source_code: { 
    icon: Code2, 
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-gradient-to-r from-orange-500 to-orange-600",
    lightColor: "bg-orange-50 text-orange-700 border-orange-200" 
  },
  template: { 
    icon: Award, 
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-gradient-to-r from-pink-500 to-pink-600",
    lightColor: "bg-pink-50 text-pink-700 border-pink-200" 
  },
  strategy: { 
    icon: Brain, 
    color: "from-indigo-500 to-indigo-600",
    bgColor: "bg-gradient-to-r from-indigo-500 to-indigo-600",
    lightColor: "bg-indigo-50 text-indigo-700 border-indigo-200" 
  }
};

export default function MarketplaceClient({ initialContent }: MarketplaceClientProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [contentType, setContentType] = useState<string>("all");
  const [categoryTab, setCategoryTab] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [animateCards, setAnimateCards] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Use initial content directly (page uses ISR for data freshness)
  const contentData = initialContent;
  const isLoading = false;
  const error = null;

  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateCards(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    if (!contentData) return { totalEAs: 0, totalDownloads: 0, activeSellers: 0 };
    
    const eaCount = contentData.filter(item => item.type === "ea").length;
    const totalDownloads = contentData.reduce((sum, item) => sum + (item.downloads || 0), 0);
    const uniqueSellers = new Set(contentData.map(item => item.id)).size; // Simplified for demo
    
    return {
      totalEAs: eaCount,
      totalDownloads: totalDownloads,
      activeSellers: Math.floor(uniqueSellers * 0.8)
    };
  }, [contentData]);

  // Client-side filtering and sorting
  const filteredAndSortedContent = useMemo(() => {
    if (!contentData) return [];

    let filtered = [...contentData];

    // Filter by category tab
    if (categoryTab !== "all") {
      switch (categoryTab) {
        case "ea":
          filtered = filtered.filter((item) => item.type === "ea");
          break;
        case "indicators":
          filtered = filtered.filter((item) => item.type === "indicator");
          break;
        case "templates":
          filtered = filtered.filter((item) => item.category?.toLowerCase().includes("template"));
          break;
        case "strategies":
          filtered = filtered.filter((item) => 
            item.category?.toLowerCase().includes("strategy") || 
            item.description?.toLowerCase().includes("strategy")
          );
          break;
      }
    }

    // Filter by content type dropdown
    if (contentType !== "all") {
      filtered = filtered.filter((item) => item.type === contentType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    // Sort by selected option
    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "rating":
        filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case "price-low":
        filtered.sort((a, b) => a.priceCoins - b.priceCoins);
        break;
      case "price-high":
        filtered.sort((a, b) => b.priceCoins - a.priceCoins);
        break;
      case "sales":
        filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [contentData, contentType, categoryTab, searchQuery, sortBy]);

  // Helper function to get image URL
  const getImageUrl = (item: Content): string => {
    if (item.postLogoUrl) return item.postLogoUrl;
    if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls[0];
    if (item.imageUrl) return item.imageUrl;
    return "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop";
  };

  // Helper function to get content type label
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case "ea":
        return "Expert Advisor";
      case "indicator":
        return "Indicator";
      case "article":
        return "Article";
      case "source_code":
        return "Source Code";
      default:
        return type;
    }
  };

  // Helper function to get category config
  const getCategoryConfig = (type: string) => {
    return categoryConfig[type as keyof typeof categoryConfig] || categoryConfig.ea;
  };

  // Helper function to get rating from likes
  const getRating = (likes: number = 0): number => {
    if (likes === 0) return 4.0;
    if (likes < 10) return 4.2;
    if (likes < 50) return 4.5;
    if (likes < 100) return 4.7;
    return 4.9;
  };

  // Clear all filters
  const clearFilters = () => {
    setContentType("all");
    setCategoryTab("all");
    setSortBy("popular");
    setSearchQuery("");
  };

  const hasActiveFilters = contentType !== "all" || categoryTab !== "all" || searchQuery || sortBy !== "popular";

  // Category tabs with enhanced styling
  const categoryTabs = [
    { id: "all", label: "All Products", icon: Package, color: "from-gray-500 to-gray-600" },
    { id: "ea", label: "Expert Advisors", icon: Zap, color: "from-purple-500 to-purple-600" },
    { id: "indicators", label: "Indicators", icon: BarChart3, color: "from-blue-500 to-blue-600" },
    { id: "templates", label: "Templates", icon: Award, color: "from-pink-500 to-pink-600" },
    { id: "strategies", label: "Strategies", icon: Brain, color: "from-indigo-500 to-indigo-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        @keyframes shimmer-wave {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 2s ease-in-out infinite;
        }
        .animate-shimmer-wave {
          animation: shimmer-wave 2s ease-in-out infinite;
        }
      `}</style>
      
      <Header />
      
      <main>
        {/* Hero Section with Enhanced Gradient */}
        <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="relative container max-w-7xl mx-auto px-4 py-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-white space-y-6">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-5 py-2 text-sm font-medium animate-pulse">
                  <Sparkles className="w-4 h-4" />
                  <span>🔥 Premium Trading Tools Marketplace</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  Discover Professional
                  <span className="block bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                    Trading Solutions
                  </span>
                </h1>
                <p className="text-lg text-white/90 leading-relaxed max-w-lg">
                  Browse our curated collection of Expert Advisors, Indicators, and Trading Resources. 
                  Built by expert traders, tested by the community.
                </p>
                <div className="flex gap-4">
                  <Link href="/publish-ea/new">
                    <Button 
                      size="lg" 
                      className="bg-white text-purple-700 hover:bg-gray-100 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 font-semibold"
                      data-testid="button-publish-ea-hero"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Publish Your EA
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
                  >
                    <Info className="h-5 w-5 mr-2" />
                    Learn More
                  </Button>
                </div>
              </div>

              {/* Enhanced Stats Cards with Glassmorphism */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 text-center text-white border border-white/20 transform hover:scale-105 transition-all duration-300">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold">{stats.totalEAs}+</div>
                  <div className="text-sm text-white/80 mt-1">Expert Advisors</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 text-center text-white border border-white/20 transform hover:scale-105 transition-all duration-300">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold">{stats.totalDownloads}</div>
                  <div className="text-sm text-white/80 mt-1">Total Downloads</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 text-center text-white border border-white/20 transform hover:scale-105 transition-all duration-300">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold">{stats.activeSellers}</div>
                  <div className="text-sm text-white/80 mt-1">Active Sellers</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="container max-w-7xl mx-auto px-4 py-8">
          {/* Enhanced Category Tabs */}
          <div className="mb-10 -mt-8 relative z-10">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3">
              <div className="flex flex-wrap gap-2">
                {categoryTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = categoryTab === tab.id;
                  return (
                    <Button
                      key={tab.id}
                      variant={isActive ? "default" : "ghost"}
                      onClick={() => setCategoryTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium transition-all duration-300",
                        isActive 
                          ? `bg-gradient-to-r ${tab.color} text-white shadow-lg hover:shadow-xl transform hover:scale-105` 
                          : "hover:bg-gray-100 text-gray-700"
                      )}
                      data-testid={`tab-category-${tab.id}`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {isActive && (
                        <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                          Active
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Enhanced Search and Filter Bar */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-10">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl opacity-0 group-focus-within:opacity-10 transition-opacity duration-300" />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                  <Input
                    placeholder="Search EAs, indicators, strategies..."
                    className="pl-12 pr-4 h-12 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-300"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-marketplace-search"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger className="w-[180px] h-12 bg-white border-gray-200 rounded-xl hover:border-purple-400 transition-colors" data-testid="select-content-type">
                    <Filter className="w-4 h-4 mr-2 text-purple-600" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="ea">Expert Advisors</SelectItem>
                    <SelectItem value="indicator">Indicators</SelectItem>
                    <SelectItem value="article">Articles</SelectItem>
                    <SelectItem value="source_code">Source Code</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] h-12 bg-white border-gray-200 rounded-xl hover:border-purple-400 transition-colors" data-testid="select-sort-by">
                    <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="sales">Top Selling</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-3">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-1.5 flex">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "h-9 px-4 rounded-lg transition-all duration-300",
                        viewMode === "grid" 
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md" 
                          : "text-gray-600 hover:text-purple-600"
                      )}
                      data-testid="button-view-grid"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "h-9 px-4 rounded-lg transition-all duration-300",
                        viewMode === "list" 
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md" 
                          : "text-gray-600 hover:text-purple-600"
                      )}
                      data-testid="button-view-list"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>

                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="h-12 px-5 border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300"
                      data-testid="button-clear-filters"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Card className="p-16 bg-white shadow-xl border-0 rounded-2xl">
              <div className="flex flex-col items-center justify-center gap-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Unable to load marketplace</h3>
                  <p className="text-gray-600 max-w-md">
                    We're having trouble loading the marketplace content. Please check your connection and try again.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-2 rounded-xl" 
                  onClick={() => window.location.reload()}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              : "space-y-6"
            }>
              {[...Array(6)].map((_, i) => (
                <ContentCardSkeleton key={i} viewMode={viewMode} />
              ))}
            </div>
          )}

          {/* Enhanced Content Grid/List */}
          {!isLoading && !error && (
            <>
              {filteredAndSortedContent.length === 0 ? (
                <Card className="p-20 bg-white shadow-xl border-0 rounded-2xl">
                  <div className="flex flex-col items-center justify-center gap-6 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center">
                      <Search className="w-12 h-12 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold mb-3 text-gray-900">No products found</h3>
                      <p className="text-gray-600 max-w-md text-lg">
                        We couldn't find any products matching your criteria. Try adjusting your filters or search terms.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <Button 
                        variant="outline" 
                        onClick={clearFilters}
                        className="rounded-xl px-6"
                      >
                        Clear Filters
                      </Button>
                      <Link href="/publish-ea/new">
                        <Button className="rounded-xl px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Product
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  : "space-y-6"
                }>
                  {filteredAndSortedContent.map((item, index) => {
                    const config = getCategoryConfig(item.type);
                    const Icon = config.icon;
                    
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "relative transition-all duration-700",
                          animateCards ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                        )}
                        style={{ transitionDelay: `${index * 50}ms` }}
                        onMouseEnter={() => setHoveredCard(item.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        <Card 
                          className="group h-full bg-white border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden rounded-2xl" 
                          data-testid={`card-content-${item.id}`}
                        >
                          <CardContent className="p-0 h-full">
                            {viewMode === "grid" ? (
                              <div className="h-full flex flex-col">
                                {/* Image Container with Overlay Effects */}
                                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                                  <img 
                                    src={getImageUrl(item)} 
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                  />
                                  
                                  {/* Gradient Overlay on Hover */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                  
                                  {/* Quick Action Buttons (appear on hover) */}
                                  <div className={cn(
                                    "absolute bottom-4 left-4 right-4 flex gap-2 transition-all duration-500",
                                    hoveredCard === item.id 
                                      ? "opacity-100 translate-y-0" 
                                      : "opacity-0 translate-y-4"
                                  )}>
                                    <Button 
                                      size="sm" 
                                      className="flex-1 bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white shadow-lg rounded-xl"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        console.log("Quick view", item.id);
                                      }}
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      Quick View
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      className="bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white shadow-lg rounded-xl px-3"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        console.log("Add to wishlist", item.id);
                                      }}
                                    >
                                      <Heart className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  
                                  {/* Price Badge with Enhanced Styling */}
                                  <div className="absolute top-4 right-4">
                                    {item.isFree ? (
                                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-4 py-1.5 text-sm font-semibold shadow-lg">
                                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                        FREE
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-4 py-1.5 text-sm font-semibold shadow-lg">
                                        <Coins className="w-3.5 h-3.5 mr-1.5" />
                                        {item.priceCoins}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Category Badge with Icon */}
                                  <div className="absolute top-4 left-4">
                                    <Badge 
                                      variant="secondary"
                                      className={cn(
                                        "backdrop-blur-sm border shadow-lg px-3 py-1.5 font-medium",
                                        config.lightColor
                                      )}
                                    >
                                      <Icon className="w-3.5 h-3.5 mr-1.5" />
                                      {getTypeLabel(item.type)}
                                    </Badge>
                                  </div>
                                </div>
                                
                                {/* Content Section */}
                                <div className="p-6 flex-1 flex flex-col">
                                  <div className="space-y-3 flex-1">
                                    <h3 className="font-bold text-lg text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors duration-300" data-testid={`text-content-title-${item.id}`}>
                                      {item.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                      {item.description}
                                    </p>
                                    
                                    {/* Enhanced Rating */}
                                    <StarRating rating={getRating(item.likes)} />
                                  </div>

                                  {/* Stats Section with Better Styling */}
                                  <div className="flex items-center justify-between text-sm pt-4 mt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-4 text-gray-600">
                                      <div className="flex items-center gap-1.5 hover:text-purple-600 transition-colors">
                                        <Download className="w-4 h-4" />
                                        <span className="font-medium">{item.downloads || 0}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 hover:text-purple-600 transition-colors">
                                        <Eye className="w-4 h-4" />
                                        <span className="font-medium">{item.views || 0}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 hover:text-purple-600 transition-colors">
                                        <Heart className="w-4 h-4" />
                                        <span className="font-medium">{item.likes || 0}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* View Details Button */}
                                  <Link href={item.fullUrl || `/content/${item.slug}`} className="mt-4">
                                    <Button 
                                      variant="outline" 
                                      className="w-full rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300"
                                    >
                                      View Details
                                      <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            ) : (
                              /* List View */
                              <div className="flex gap-6 p-6">
                                <div className="flex-shrink-0 relative">
                                  <img 
                                    src={getImageUrl(item)} 
                                    alt={item.title}
                                    className="w-44 h-32 object-cover rounded-xl group-hover:scale-105 transition-transform duration-500 shadow-lg"
                                  />
                                  <Badge 
                                    variant="secondary"
                                    className={cn(
                                      "absolute -top-2 -left-2 shadow-lg border",
                                      config.lightColor
                                    )}
                                  >
                                    <Icon className="w-3.5 h-3.5 mr-1.5" />
                                    {getTypeLabel(item.type)}
                                  </Badge>
                                </div>
                                
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-2 flex-1">
                                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-600 transition-colors">
                                        {item.title}
                                      </h3>
                                      <p className="text-sm text-gray-600 line-clamp-2">
                                        {item.description}
                                      </p>
                                      <StarRating rating={getRating(item.likes)} />
                                    </div>
                                    <div className="text-right">
                                      {item.isFree ? (
                                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 text-lg font-bold shadow-lg">
                                          FREE
                                        </Badge>
                                      ) : (
                                        <div className="flex items-center gap-2 text-orange-600">
                                          <Coins className="w-5 h-5" />
                                          <span className="text-2xl font-bold">{item.priceCoins}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-5 text-sm text-gray-600">
                                      <div className="flex items-center gap-1.5">
                                        <Download className="w-4 h-4 text-purple-500" />
                                        <span className="font-medium">{item.downloads || 0} downloads</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Eye className="w-4 h-4 text-blue-500" />
                                        <span className="font-medium">{item.views || 0} views</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-green-500" />
                                        <span className="font-medium">Updated recently</span>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Link href={item.fullUrl || `/content/${item.slug}`}>
                                        <Button 
                                          size="sm"
                                          className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                        >
                                          View Details
                                          <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                      </Link>
                                      <Button 
                                        size="sm"
                                        variant="outline"
                                        className="rounded-xl border-gray-200 hover:border-purple-300"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          console.log("Add to wishlist", item.id);
                                        }}
                                      >
                                        <Heart className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <EnhancedFooter />
    </div>
  );
}