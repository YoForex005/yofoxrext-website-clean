"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  FileArchive,
  FileCode,
  File,
  Download,
  Coins,
  Lock,
  CheckCircle,
  Loader2,
  AlertCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import type { FileAsset } from "@shared/schema";

interface FileDownloadProps {
  asset: FileAsset & { hasPurchased?: boolean };
  contentId?: string;
  threadId?: string;
  onPurchase?: () => void;
}

// File type to icon mapping
const getFileIcon = (fileType: string) => {
  const type = fileType.toLowerCase();
  
  if (['ex4', 'ex5', 'mq4', 'mq5'].includes(type)) {
    return <FileCode className="h-5 w-5 text-purple-500" />;
  } else if (['pdf'].includes(type)) {
    return <FileText className="h-5 w-5 text-red-500" />;
  } else if (['zip', 'rar', '7z'].includes(type)) {
    return <FileArchive className="h-5 w-5 text-blue-500" />;
  } else {
    return <File className="h-5 w-5 text-gray-500" />;
  }
};

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export default function FileDownload({ asset, contentId, threadId, onPurchase }: FileDownloadProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { requireAuth, AuthPrompt } = useAuthPrompt("purchase this file");
  const [isDownloading, setIsDownloading] = useState(false);

  // Check if user has purchased this file
  const { data: purchaseStatus, isLoading: checkingPurchase } = useQuery<{ 
    hasPurchased: boolean; 
    purchaseId?: string;
  }>({
    queryKey: [`/api/file-assets/${asset.id}/purchase-status`, user?.id],
    queryFn: async () => {
      if (!user?.id) return { hasPurchased: false };
      
      // Check if already purchased
      const response = await fetch(`/api/file-assets/${asset.id}/purchase-status`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        return { hasPurchased: false };
      }
      
      return response.json();
    },
    enabled: !!user?.id && !!asset.id,
    initialData: asset.hasPurchased ? { hasPurchased: true } : undefined,
  });

  // Get user's current coin balance
  const { data: userCoins } = useQuery<{ totalCoins: number }>({
    queryKey: ["/api/user", user?.id, "coins"],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const res = await fetch(`/api/user/${user.id}/coins`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch coins');
      return res.json();
    },
    enabled: !!user?.id,
    retry: false,
  });

  // Purchase file mutation
  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/file-assets/${asset.id}/purchase`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Purchase failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to update UI
      queryClient.invalidateQueries({ queryKey: [`/api/file-assets/${asset.id}/purchase-status`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user", user?.id, "coins"] });
      
      toast({
        title: "Purchase Successful!",
        description: `You have successfully purchased ${asset.filename}. You can now download it anytime.`,
      });

      // Trigger download immediately after purchase
      handleDownload(data.purchaseId);

      // Callback
      onPurchase?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle download
  const handleDownload = async (purchaseId?: string) => {
    if (!purchaseStatus?.hasPurchased && !purchaseId) return;
    
    setIsDownloading(true);
    
    try {
      const pid = purchaseId || purchaseStatus?.purchaseId;
      if (!pid) {
        throw new Error("Purchase ID not found");
      }

      const response = await fetch(`/api/downloads/${pid}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }

      const data = await response.json();
      
      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: `${asset.filename} is being downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle purchase button click
  const handlePurchase = () => {
    if (!isAuthenticated) {
      requireAuth();
      return;
    }

    // Check if user has enough coins
    const balance = userCoins?.totalCoins || 0;
    if (balance < asset.price) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${asset.price} coins to purchase this file. You currently have ${balance} coins.`,
        variant: "destructive",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/recharge'}
            data-testid="button-recharge"
          >
            Get Coins
          </Button>
        ),
      });
      return;
    }

    // Proceed with purchase
    purchaseMutation.mutate();
  };

  const hasPurchased = purchaseStatus?.hasPurchased || asset.hasPurchased;
  const isProcessing = purchaseMutation.isPending || isDownloading;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-file-${asset.id}`}>
        <CardContent className="p-4">
          {/* File Info Row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1">
              {/* File Icon */}
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {getFileIcon(asset.fileType)}
              </div>

              {/* File Details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate" data-testid={`text-filename-${asset.id}`}>
                  {asset.filename}
                </h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Badge variant="outline" className="text-xs">
                    {asset.fileType.toUpperCase()}
                  </Badge>
                  <span>{formatFileSize(asset.fileSize)}</span>
                  {asset.downloads > 0 && (
                    <div className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      <span>{asset.downloads}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Price Badge */}
            {!hasPurchased && (
              <Badge variant="secondary" className="ml-2">
                <Coins className="h-3 w-3 mr-1" />
                {asset.price}
              </Badge>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-3">
            {checkingPurchase ? (
              <Skeleton className="h-9 w-full" />
            ) : hasPurchased ? (
              <Button
                className="w-full"
                size="sm"
                variant="default"
                onClick={() => handleDownload()}
                disabled={isDownloading}
                data-testid={`button-download-${asset.id}`}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="w-full"
                size="sm"
                variant="default"
                onClick={handlePurchase}
                disabled={isProcessing}
                data-testid={`button-purchase-${asset.id}`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Coins className="mr-2 h-4 w-4" />
                    Purchase for {asset.price} coins
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Purchase Benefits */}
          {!hasPurchased && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Instant download</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-blue-500" />
                  <span>Secure transaction</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-purple-500" />
                  <span>Lifetime access</span>
                </div>
              </div>
            </div>
          )}

          {/* Already Purchased Badge */}
          {hasPurchased && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-center text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="h-3 w-3 mr-1" />
                <span>You own this file</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auth Prompt Modal */}
      <AuthPrompt />
    </>
  );
}