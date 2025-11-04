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
  Zap
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

// Skeleton card component for loading state
function ContentCardSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "grid") {
    return (
      <Card className="bg-white border-gray-100 shadow-sm animate-pulse">
        <CardContent className="p-0">
          <Skeleton className="aspect-video w-full rounded-t-lg bg-gray-200" />
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 bg-gray-200" />
              <Skeleton className="h-5 w-16 bg-gray-200" />
            </div>
            <Skeleton className="h-6 w-full bg-gray-200" />
            <Skeleton className="h-4 w-full bg-gray-200" />
            <Skeleton className="h-4 w-3/4 bg-gray-200" />
            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-3">
                <Skeleton className="h-4 w-16 bg-gray-200" />
                <Skeleton className="h-4 w-16 bg-gray-200" />
              </div>
              <Skeleton className="h-6 w-16 bg-gray-200" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-100 shadow-sm animate-pulse">
      <CardContent className="p-5 flex gap-4">
        <Skeleton className="w-36 h-28 rounded-lg flex-shrink-0 bg-gray-200" />
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 bg-gray-200" />
            <Skeleton className="h-5 w-16 bg-gray-200" />
          </div>
          <Skeleton className="h-6 w-3/4 bg-gray-200" />
          <Skeleton className="h-4 w-full bg-gray-200" />
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24 bg-gray-200" />
              <Skeleton className="h-4 w-16 bg-gray-200" />
              <Skeleton className="h-4 w-16 bg-gray-200" />
            </div>
            <Skeleton className="h-6 w-20 bg-gray-200" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Star rating component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={cn(
            "w-3.5 h-3.5",
            i < Math.floor(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          )}
        />
      ))}
      <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function MarketplaceClient({ initialContent }: MarketplaceClientProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [contentType, setContentType] = useState<string>("all");
  const [categoryTab, setCategoryTab] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [animateCards, setAnimateCards] = useState(false);

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

  // Category tabs
  const categoryTabs = [
    { id: "all", label: "All", icon: Package },
    { id: "ea", label: "Expert Advisors", icon: Zap },
    { id: "indicators", label: "Indicators", icon: TrendingUp },
    { id: "templates", label: "Templates", icon: Award },
    { id: "strategies", label: "Strategies", icon: ChevronRight }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="relative container max-w-7xl mx-auto px-4 py-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-white space-y-6">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Premium Trading Tools Marketplace</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  Discover Professional
                  <span className="block text-yellow-400">Trading Solutions</span>
                </h1>
                <p className="text-lg text-blue-100 leading-relaxed">
                  Browse our curated collection of Expert Advisors, Indicators, and Trading Resources. 
                  Built by traders, for traders.
                </p>
                <Link href="/publish-ea">
                  <Button 
                    size="lg" 
                    className="bg-white text-blue-700 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5"
                    data-testid="button-publish-ea-hero"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Publish Your EA
                  </Button>
                </Link>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center text-white">
                  <Package className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                  <div className="text-2xl font-bold">{stats.totalEAs}+</div>
                  <div className="text-sm text-blue-100">Total EAs</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center text-white">
                  <Download className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <div className="text-2xl font-bold">{stats.totalDownloads}</div>
                  <div className="text-sm text-blue-100">Downloads</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center text-white">
                  <Users className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                  <div className="text-2xl font-bold">{stats.activeSellers}</div>
                  <div className="text-sm text-blue-100">Active Sellers</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="container max-w-7xl mx-auto px-4 py-8">
          {/* Category Tabs */}
          <div className="mb-8 -mt-6 relative z-10">
            <div className="bg-white rounded-xl shadow-lg p-2 flex flex-wrap gap-2">
              {categoryTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={categoryTab === tab.id ? "default" : "ghost"}
                    onClick={() => setCategoryTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 transition-all duration-200",
                      categoryTab === tab.id 
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md" 
                        : "hover:bg-gray-100"
                    )}
                    data-testid={`tab-category-${tab.id}`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search EAs, indicators, strategies..."
                    className="pl-10 pr-4 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-marketplace-search"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger className="w-[180px] h-11 bg-gray-50 border-gray-200" data-testid="select-content-type">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="ea">Expert Advisors</SelectItem>
                    <SelectItem value="indicator">Indicators</SelectItem>
                    <SelectItem value="article">Articles</SelectItem>
                    <SelectItem value="source_code">Source Code</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] h-11 bg-gray-50 border-gray-200" data-testid="select-sort-by">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="sales">Top Selling</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-1 flex">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "h-9 px-3",
                        viewMode === "grid" ? "bg-blue-600 text-white" : ""
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
                        "h-9 px-3",
                        viewMode === "list" ? "bg-blue-600 text-white" : ""
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
                      className="h-11 border-gray-200"
                      data-testid="button-clear-filters"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Card className="p-12 bg-white shadow-sm border-gray-100">
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Unable to load marketplace</h3>
                  <p className="text-gray-600 max-w-md">
                    We're having trouble loading the marketplace content. Please check your connection and try again.
                  </p>
                </div>
                <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              : "space-y-4"
            }>
              {[...Array(6)].map((_, i) => (
                <ContentCardSkeleton key={i} viewMode={viewMode} />
              ))}
            </div>
          )}

          {/* Content Grid/List */}
          {!isLoading && !error && (
            <>
              {filteredAndSortedContent.length === 0 ? (
                <Card className="p-16 bg-white shadow-sm border-gray-100">
                  <div className="flex flex-col items-center justify-center gap-6 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <Search className="w-10 h-10 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-3 text-gray-900">No products found</h3>
                      <p className="text-gray-600 max-w-md">
                        We couldn't find any products matching your criteria. Try adjusting your filters or search terms.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                      <Link href="/publish-ea">
                        <Button>
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
                  : "space-y-4"
                }>
                  {filteredAndSortedContent.map((item, index) => (
                    <Link 
                      key={item.id} 
                      href={item.fullUrl || `/content/${item.slug}`} 
                      data-testid={`link-content-${item.id}`}
                      className={cn(
                        "block transition-all duration-500",
                        animateCards ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                      )}
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      <Card 
                        className="group h-full bg-white border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" 
                        data-testid={`card-content-${item.id}`}
                      >
                        <CardContent className="p-0">
                          {viewMode === "grid" ? (
                            <div className="h-full flex flex-col">
                              <div className="relative aspect-video overflow-hidden rounded-t-lg bg-gradient-to-br from-gray-100 to-gray-50">
                                <img 
                                  src={getImageUrl(item)} 
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                
                                {/* Price Badge */}
                                <Badge 
                                  className={cn(
                                    "absolute top-3 right-3 shadow-lg",
                                    item.isFree 
                                      ? "bg-green-500 text-white border-green-600" 
                                      : "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-600"
                                  )}
                                >
                                  {item.isFree ? (
                                    <span className="flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" />
                                      FREE
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <Coins className="w-3 h-3" />
                                      {item.priceCoins}
                                    </span>
                                  )}
                                </Badge>

                                {/* Category Badge */}
                                <Badge 
                                  variant="secondary"
                                  className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 border-0 shadow-md"
                                >
                                  {getTypeLabel(item.type)}
                                </Badge>
                              </div>
                              
                              <div className="p-5 flex-1 flex flex-col">
                                <div className="space-y-3 flex-1">
                                  <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors" data-testid={`text-content-title-${item.id}`}>
                                    {item.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {item.description}
                                  </p>
                                  
                                  {/* Rating */}
                                  <StarRating rating={getRating(item.likes)} />
                                </div>

                                <div className="flex items-center justify-between text-sm pt-4 mt-4 border-t border-gray-100">
                                  <div className="flex items-center gap-3 text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Download className="w-4 h-4" />
                                      <span>{item.downloads || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Eye className="w-4 h-4" />
                                      <span>{item.views || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Heart className="w-4 h-4" />
                                      <span>{item.likes || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-5 p-5">
                              <div className="flex-shrink-0 relative">
                                <img 
                                  src={getImageUrl(item)} 
                                  alt={item.title}
                                  className="w-36 h-28 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                                />
                                <Badge 
                                  variant="secondary"
                                  className="absolute -top-2 -left-2 bg-white shadow-md border-gray-200 text-gray-700"
                                >
                                  {getTypeLabel(item.type)}
                                </Badge>
                              </div>
                              
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-2 flex-1">
                                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                      {item.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                      {item.description}
                                    </p>
                                    <StarRating rating={getRating(item.likes)} />
                                  </div>
                                  <div className="text-right">
                                    {item.isFree ? (
                                      <Badge className="bg-green-500 text-white">
                                        FREE
                                      </Badge>
                                    ) : (
                                      <div className="flex items-center gap-1 text-yellow-600 font-semibold">
                                        <Coins className="w-4 h-4" />
                                        <span>{item.priceCoins}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-500 pt-2">
                                  <div className="flex items-center gap-1">
                                    <Download className="w-4 h-4" />
                                    <span>{item.downloads || 0} downloads</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    <span>{item.views || 0} views</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Updated recently</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
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