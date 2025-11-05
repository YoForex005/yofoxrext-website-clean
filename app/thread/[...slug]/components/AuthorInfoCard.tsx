"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  MessageSquare, 
  Trophy, 
  Eye, 
  Calendar,
  UserPlus,
  Award
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { User as UserType } from "@shared/schema";

interface AuthorInfoCardProps {
  author: {
    id: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    bio?: string | null;
    createdAt: Date;
  };
  threadCount?: number;
  totalViews?: number;
}

export default function AuthorInfoCard({ author, threadCount = 0, totalViews = 0 }: AuthorInfoCardProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch author's full profile
  const { data: authorProfile } = useQuery<UserType>({
    queryKey: ["/api/users", author.id],
    queryFn: async () => {
      const res = await fetch(`/api/users/${author.id}`);
      if (!res.ok) throw new Error("Failed to fetch user profile");
      return res.json();
    },
  });

  // Check if current user is following the author
  useQuery({
    queryKey: ["/api/users", author.id, "following"],
    enabled: isAuthenticated && user?.id !== author.id,
    queryFn: async () => {
      const res = await fetch(`/api/users/${author.id}/following`);
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
      }
      return null;
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const endpoint = isFollowing 
        ? `/api/users/${author.id}/unfollow`
        : `/api/users/${author.id}/follow`;
      return apiRequest("POST", endpoint);
    },
    onSuccess: () => {
      setIsFollowing(!isFollowing);
      queryClient.invalidateQueries({ queryKey: ["/api/users", author.id] });
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing 
          ? `You unfollowed ${author.firstName || author.username}`
          : `You are now following ${author.firstName || author.username}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  const displayName = author.firstName 
    ? `${author.firstName}${author.lastName ? ` ${author.lastName}` : ''}`
    : author.username;

  const memberSince = author.createdAt 
    ? formatDistanceToNow(new Date(author.createdAt), { addSuffix: true })
    : "Recently";

  return (
    <Card className="shadow-sm" data-testid="author-info-card">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-muted">
            <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary/10 to-primary/20">
              {displayName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground dark:text-foreground">{displayName}</h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">@{author.username}</p>
            {authorProfile?.role === "admin" && (
              <Badge variant="secondary" className="mt-1 gap-1">
                <Award className="h-3 w-3" />
                Admin
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {author.bio && (
          <>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground line-clamp-3">
              {author.bio}
            </p>
            <Separator />
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>Threads</span>
            </div>
            <p className="text-xl font-bold text-foreground dark:text-foreground">{threadCount}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>Total Views</span>
            </div>
            <p className="text-xl font-bold text-foreground dark:text-foreground">
              {totalViews > 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span>Reputation</span>
            </div>
            <p className="text-xl font-bold text-foreground dark:text-foreground">
              {authorProfile?.reputation || 0}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Member</span>
            </div>
            <p className="text-sm font-medium text-foreground dark:text-foreground">{memberSince}</p>
          </div>
        </div>

        {isAuthenticated && user?.id !== author.id && (
          <>
            <Separator />
            <Button 
              onClick={() => followMutation.mutate()}
              disabled={followMutation.isPending}
              variant={isFollowing ? "secondary" : "default"}
              className="w-full"
              data-testid="button-follow-author"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}