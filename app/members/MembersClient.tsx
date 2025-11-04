"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { 
  Trophy, 
  Coins,
  TrendingUp,
  Upload,
  Users,
  Search,
  Filter,
  Calendar,
  Activity,
  MessageSquare,
  Target,
  Clock,
  Eye,
  Sparkles,
  Shield,
  ShieldCheck,
  UserCheck,
  Store,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MemberUser extends User {
  contributionCount?: number;
  uploadCount?: number;
  followersCount?: number;
  isOnline?: boolean;
}

interface MembersResponse {
  users: MemberUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface MembersClientProps {
  initialData: {
    topByCoins: MemberUser[];
    topByContributions: MemberUser[];
    topByUploads: MemberUser[];
  };
}

export default function MembersClient({ initialData }: MembersClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("coins");
  
  // Role filters
  const [selectedRole, setSelectedRole] = useState("all");
  
  // Activity filter
  const [selectedActivity, setSelectedActivity] = useState("all");
  
  // Coins range filter
  const [coinsRange, setCoinsRange] = useState([0, 100000]);
  
  // Join date filter
  const [joinDateFilter, setJoinDateFilter] = useState("all");
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build query parameters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (selectedRole && selectedRole !== 'all') params.append('role', selectedRole);
    if (selectedActivity && selectedActivity !== 'all') params.append('activity', selectedActivity);
    if (coinsRange[0] > 0) params.append('coinsMin', coinsRange[0].toString());
    if (coinsRange[1] < 100000) params.append('coinsMax', coinsRange[1].toString());
    if (joinDateFilter !== 'all') params.append('joinDate', joinDateFilter);
    params.append('page', currentPage.toString());
    params.append('limit', '20');
    params.append('sort', sortBy);
    
    return params.toString();
  };

  // Main members query
  const { data: membersData, isLoading } = useQuery<MembersResponse>({
    queryKey: ['/api/members', buildQueryParams()],
    queryFn: async () => {
      const res = await fetch(`/api/members?${buildQueryParams()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch members');
      return res.json();
    },
    refetchInterval: 30000,
  });

  // Get trending members for sidebar (top 10 by coins this week)
  const { data: trendingMembers } = useQuery<MemberUser[]>({
    queryKey: ['/api/members', 'trending'],
    queryFn: async () => {
      const res = await fetch('/api/members?joinDate=week&sort=coins&limit=10', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch trending');
      const data = await res.json();
      return data.users;
    },
    refetchInterval: 60000,
  });

  // Member stats
  const { data: memberStats } = useQuery<{
    totalMembers: number;
    onlineNow: number;
    newThisWeek: number;
    totalCoinsEarned: number;
  }>({
    queryKey: ['/api/members/stats'],
    queryFn: async () => {
      const res = await fetch('/api/members/stats', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    refetchInterval: 30000,
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRole("all");
    setSelectedActivity("all");
    setCoinsRange([0, 100000]);
    setJoinDateFilter("all");
    setSortBy("coins");
    setCurrentPage(1);
  };

  const renderMemberCard = (user: MemberUser) => {
    const joinedAgo = user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : 'Unknown';
    
    // Role badge colors
    const getRoleBadge = () => {
      switch (user.role) {
        case 'premium':
          return <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0"><Sparkles className="w-3 h-3 mr-1" /> Premium</Badge>;
        case 'seller':
          return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"><Store className="w-3 h-3 mr-1" /> Seller</Badge>;
        case 'verified':
          return <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0"><ShieldCheck className="w-3 h-3 mr-1" /> Verified</Badge>;
        case 'moderator':
          return <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"><Shield className="w-3 h-3 mr-1" /> Moderator</Badge>;
        case 'admin':
          return <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0"><Shield className="w-3 h-3 mr-1" /> Admin</Badge>;
        default:
          return null;
      }
    };

    return (
      <Card key={user.id} className="group hover:border-primary/30 hover:shadow-lg transition-all duration-200 overflow-hidden" data-testid={`card-member-${user.id}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-16 h-16 border-2 border-border group-hover:border-primary/30 transition-colors">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {(user.username?.substring(0, 2)?.toUpperCase() ?? 'XX')}
                  </AvatarFallback>
                </Avatar>
                {user.isOnline && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-950" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors" data-testid={`text-username-${user.id}`}>
                  {user.username}
                </h3>
                {getRoleBadge()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Coins className="w-4 h-4 text-yellow-600" />
              <span data-testid={`text-coins-${user.id}`}>
                <span className="font-semibold">{(user.totalCoins || 0).toLocaleString()}</span> coins
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span data-testid={`text-posts-${user.id}`}>
                <span className="font-semibold">{(user.contributionCount || 0).toLocaleString()}</span> posts
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Upload className="w-4 h-4 text-green-600" />
              <span data-testid={`text-uploads-${user.id}`}>
                <span className="font-semibold">{(user.uploadCount || 0).toLocaleString()}</span> publishers
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span suppressHydrationWarning className="text-xs">{joinedAgo}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/user/${user.username}`} className="flex-1">
              <Button variant="default" className="w-full" size="sm" data-testid={`button-view-profile-${user.id}`}>
                <Eye className="w-4 h-4 mr-1" />
                View Profile
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="px-3" data-testid={`button-follow-${user.id}`}>
              <UserCheck className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="border-b bg-gradient-to-br from-primary/5 to-background">
        <div className="max-w-[1600px] mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" data-testid="heading-members">
                <Users className="w-8 h-8 text-primary" />
                Community Members
              </h1>
              <p className="text-muted-foreground">
                Connect with traders, developers, and experts in the YoForex community
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{memberStats?.totalMembers || 0}</div>
                    <div className="text-xs text-muted-foreground">Total Members</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-8 h-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">{memberStats?.onlineNow || 0}</div>
                    <div className="text-xs text-muted-foreground">Online Now</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">{memberStats?.newThisWeek || 0}</div>
                    <div className="text-xs text-muted-foreground">New This Week</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Coins className="w-8 h-8 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold">{(memberStats?.totalCoinsEarned || 0).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total Coins Earned</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT SIDEBAR - Filters */}
          <aside className="lg:col-span-3 space-y-6">
            
            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Search by username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                  data-testid="input-search"
                />
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="absolute right-4 top-4"
                  data-testid="button-clear-filters"
                >
                  Clear All
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Sort By */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger data-testid="select-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coins">Most Coins</SelectItem>
                      <SelectItem value="contributions">Most Active</SelectItem>
                      <SelectItem value="uploads">Most Publishers</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Role Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Member Role</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger data-testid="select-role">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="seller">Sellers</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="moderator">Moderators</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Activity Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Activity Status</label>
                  <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                    <SelectTrigger data-testid="select-activity">
                      <SelectValue placeholder="All Activity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Activity</SelectItem>
                      <SelectItem value="onlineNow">Online Now</SelectItem>
                      <SelectItem value="activeToday">Active Today</SelectItem>
                      <SelectItem value="activeWeek">Active This Week</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Coins Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Coins Range: {coinsRange[0].toLocaleString()} - {coinsRange[1] === 100000 ? '∞' : coinsRange[1].toLocaleString()}
                  </label>
                  <div className="space-y-3">
                    <Slider
                      value={coinsRange}
                      onValueChange={setCoinsRange}
                      min={0}
                      max={100000}
                      step={1000}
                      className="w-full"
                      data-testid="slider-coins"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={coinsRange[0]}
                        onChange={(e) => setCoinsRange([Number(e.target.value), coinsRange[1]])}
                        className="w-full"
                        placeholder="Min"
                        data-testid="input-coins-min"
                      />
                      <Input
                        type="number"
                        value={coinsRange[1]}
                        onChange={(e) => setCoinsRange([coinsRange[0], Number(e.target.value)])}
                        className="w-full"
                        placeholder="Max"
                        data-testid="input-coins-max"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Join Date Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Joined</label>
                  <Select value={joinDateFilter} onValueChange={setJoinDateFilter}>
                    <SelectTrigger data-testid="select-join-date">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Trending This Week */}
            {trendingMembers && trendingMembers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Trending This Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trendingMembers.slice(0, 5).map((user, index) => (
                      <Link key={user.id} href={`/user/${user.username}`}>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="text-sm font-bold text-muted-foreground w-6">#{index + 1}</div>
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {user.username?.substring(0, 2)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{user.username}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Coins className="w-3 h-3" />
                              {(user.totalCoins || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>

          {/* MAIN CONTENT - Members Grid */}
          <div className="lg:col-span-9">
            
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {membersData ? `${membersData.total} Members Found` : 'Loading...'}
              </h2>
            </div>

            {/* Members Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-16 w-16 rounded-full mb-4" />
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24 mb-4" />
                      <div className="grid grid-cols-2 gap-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                      <Skeleton className="h-8 w-full mt-4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : membersData?.users.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Members Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search term
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {membersData?.users.map(renderMemberCard)}
                </div>

                {/* Pagination */}
                {membersData && membersData.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-2 px-4">
                      <span className="text-sm">
                        Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{membersData.totalPages}</span>
                      </span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(membersData.totalPages, currentPage + 1))}
                      disabled={currentPage === membersData.totalPages}
                      data-testid="button-next-page"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <EnhancedFooter />
    </div>
  );
}