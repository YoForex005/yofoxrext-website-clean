"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin,
  Bookmark,
  Printer,
  Tag,
  Link2,
  CheckCircle
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import TableOfContents from "./TableOfContents";
import AuthorInfoCard from "./AuthorInfoCard";
import type { ForumThread } from "@shared/schema";

interface LeftSidebarProps {
  thread: ForumThread;
  content: string;
  isBookmarked: boolean;
  onBookmark: () => void;
}

export default function LeftSidebar({ thread, content, isBookmarked, onBookmark }: LeftSidebarProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = thread.title;
  
  const handleShare = (platform: string) => {
    let url = "";
    
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, "_blank", "width=600,height=400");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Thread link has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Extract tags from thread (assuming they're stored as an array or can be parsed)
  const tags = thread.tags || ["Trading Strategy", "Forex", "Technical Analysis", "MT4"];

  return (
    <aside className="space-y-4" data-testid="left-sidebar">
      {/* Table of Contents */}
      <TableOfContents content={content} />

      {/* Author Info */}
      <AuthorInfoCard 
        author={thread.author}
        threadCount={thread.authorThreadCount || 0}
        totalViews={thread.authorTotalViews || 0}
      />

      {/* Share & Actions */}
      <Card className="shadow-sm" data-testid="card-share-actions">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            Share & Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleShare("twitter")}
              className="hover-elevate active-elevate-2"
              data-testid="button-share-twitter"
            >
              <Twitter className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleShare("facebook")}
              className="hover-elevate active-elevate-2"
              data-testid="button-share-facebook"
            >
              <Facebook className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleShare("linkedin")}
              className="hover-elevate active-elevate-2"
              data-testid="button-share-linkedin"
            >
              <Linkedin className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              className="flex-1 hover-elevate active-elevate-2"
              data-testid="button-copy-link"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant={isBookmarked ? "secondary" : "outline"}
              onClick={onBookmark}
              className="hover-elevate active-elevate-2"
              data-testid="button-bookmark"
            >
              <Bookmark className={`h-4 w-4 mr-1 ${isBookmarked ? "fill-current" : ""}`} />
              {isBookmarked ? "Saved" : "Save"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="hover-elevate active-elevate-2"
              data-testid="button-print"
            >
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tags/Categories */}
      <Card className="shadow-sm" data-testid="card-tags">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            Related Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge 
                key={index}
                variant="secondary"
                className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                data-testid={`tag-${index}`}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}