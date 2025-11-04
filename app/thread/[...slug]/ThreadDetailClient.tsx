"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import type { ForumThread, ForumReply } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ThumbsUp, 
  MessageSquare, 
  CheckCircle2, 
  Eye, 
  Tag, 
  ArrowLeft, 
  Bookmark, 
  Share2,
  Clock,
  Download,
  File,
  FileText,
  FileCode,
  FileArchive,
  FileImage,
  Coins
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import DOMPurify from 'isomorphic-dompurify';

interface ThreadDetailClientProps {
  initialThread: ForumThread | undefined;
  initialReplies: ForumReply[];
}

interface Attachment {
  id: string;
  filename: string;
  size: number;
  url: string;
  mimeType: string;
  price: number;
  downloads: number;
}

// Component for displaying and handling file attachments
function AttachmentsSection({ 
  threadId, 
  attachments, 
  isAuthor 
}: { 
  threadId: string;
  attachments: Attachment[];
  isAuthor: boolean;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { requireAuth, AuthPrompt } = useAuthPrompt("download attachments");

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return FileImage;
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return FileArchive;
    if (mimeType.includes('text') || mimeType.includes('code')) return FileCode;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const handleDownload = async (attachment: Attachment) => {
    requireAuth(async () => {
      try {
        const response = await apiRequest('POST', `/api/threads/${threadId}/attachments/${attachment.id}/download`);
        
        if (response.downloadUrl) {
          // Create a download link
          const link = document.createElement('a');
          link.href = response.downloadUrl;
          link.download = attachment.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({ 
            title: response.message || "Download started!",
            description: attachment.filename
          });
        }
      } catch (error: any) {
        toast({
          title: "Download failed",
          description: error.message || "Unable to download file",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="mt-8 p-6 bg-muted/30 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileArchive className="h-5 w-5" />
        Attachments ({attachments.length})
      </h3>
      
      <div className="space-y-3">
        {attachments.map((attachment) => {
          const Icon = getFileIcon(attachment.mimeType);
          const isFree = attachment.price === 0 || isAuthor;
          
          return (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-background rounded-lg border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{attachment.filename}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(attachment.size)} • {attachment.downloads} downloads
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {!isFree && (
                  <div className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Coins className="h-4 w-4" />
                    {attachment.price}
                  </div>
                )}
                
                <Button
                  size="sm"
                  variant={isFree ? "secondary" : "default"}
                  onClick={() => handleDownload(attachment)}
                  data-testid={`button-download-${attachment.id}`}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {isFree ? "Free" : "Download"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      
      {!user && (
        <AuthPrompt />
      )}
    </div>
  );
}

function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setProgress(Math.min(scrollPercent, 100));
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-muted z-50">
      <div 
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function FloatingActionBar({ 
  onBookmark, 
  onShare,
  isBookmarked 
}: { 
  onBookmark: () => void;
  onShare: () => void;
  isBookmarked?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <TooltipProvider>
      <div 
        className={`fixed left-8 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ${
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
        } hidden lg:block`}
      >
        <div className="flex flex-col gap-2 bg-card border rounded-lg p-2 shadow-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={onBookmark}
                className={`hover-elevate active-elevate-2 ${isBookmarked ? 'text-primary' : ''}`}
                data-testid="button-floating-bookmark"
              >
                <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{isBookmarked ? 'Remove bookmark' : 'Bookmark thread'}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={onShare}
                className="hover-elevate active-elevate-2"
                data-testid="button-floating-share"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Share thread</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function ThreadDetailClient({ initialThread, initialReplies }: ThreadDetailClientProps) {
  const params = useParams();
  const slug = params?.slug as string;
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { requireAuth, AuthPrompt } = useAuthPrompt("reply to this thread");
  const [replyBody, setReplyBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [threadTimeAgo, setThreadTimeAgo] = useState<string>("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const { data: thread, isLoading: threadLoading } = useQuery<ForumThread>({
    queryKey: ["/api/threads/slug", slug],
    enabled: !!slug,
    initialData: initialThread,
  });

  const { data: replies = [], isLoading: repliesLoading } = useQuery<ForumReply[]>({
    queryKey: ["/api/threads", thread?.id, "replies"],
    enabled: !!thread?.id,
    refetchInterval: 15000,
    initialData: initialReplies,
  });

  useEffect(() => {
    if (thread?.createdAt) {
      setThreadTimeAgo(formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true }));
    }
    // Set initial like count
    if (thread?.likeCount !== undefined) {
      setLikeCount(thread.likeCount);
    }
  }, [thread?.createdAt, thread?.likeCount]);

  // Fetch like status for the current user
  useEffect(() => {
    if (thread?.id && isAuthenticated) {
      apiRequest("GET", `/api/threads/${thread.id}/like`)
        .then(data => {
          setIsLiked(data.liked);
          setLikeCount(data.likeCount);
        })
        .catch(() => {
          // If not authenticated or error, just use thread data
          setLikeCount(thread.likeCount || 0);
        });
    }
  }, [thread?.id, isAuthenticated]);

  const createReplyMutation = useMutation({
    mutationFn: (data: { body: string; parentId?: string }) => {
      if (!user?.id) {
        return Promise.reject(new Error("You must be logged in to reply"));
      }
      return apiRequest("POST", `/api/threads/${thread!.id}/replies`, {
        ...data,
        userId: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/threads", thread!.id, "replies"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/threads/slug", slug],
      });
      setReplyBody("");
      setReplyingTo(null);
      toast({ title: "Reply posted successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post reply",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markHelpfulMutation = useMutation({
    mutationFn: (replyId: string) =>
      apiRequest("POST", `/api/replies/${replyId}/helpful`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/threads", thread!.id, "replies"],
      });
      toast({ title: "Marked as helpful!" });
    },
  });

  const markAcceptedMutation = useMutation({
    mutationFn: (replyId: string) =>
      apiRequest("POST", `/api/replies/${replyId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/threads", thread!.id, "replies"],
      });
      toast({ title: "Marked as accepted answer!" });
    },
  });

  const likeMutation = useMutation({
    mutationFn: () => {
      if (!thread?.id) {
        return Promise.reject(new Error("Thread not found"));
      }
      return apiRequest("POST", `/api/threads/${thread.id}/like`);
    },
    onSuccess: (data) => {
      setIsLiked(data.liked);
      setLikeCount(data.likeCount);
      if (data.liked) {
        toast({ 
          title: "Thread liked!",
          description: data.coinsAwarded > 0 ? `The author earned ${data.coinsAwarded} Sweets!` : undefined
        });
      } else {
        toast({ title: "Like removed" });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to like thread",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLikeThread = () => {
    likeMutation.mutate();
  };

  const handleBookmark = () => {
    requireAuth(() => {
      setIsBookmarked(!isBookmarked);
      toast({ title: isBookmarked ? "Bookmark removed" : "Thread bookmarked!" });
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: thread?.title,
          url: window.location.href,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(window.location.href);
          toast({ title: "Link copied to clipboard!" });
        }
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  if (threadLoading) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-[800px] mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-12 bg-muted rounded" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </div>
        </div>
        <EnhancedFooter />
      </div>
    );
  }

  if (!thread) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-[800px] mx-auto">
            <Card>
              <CardContent className="p-12 text-center">
                <h2 className="text-2xl font-bold mb-2">Thread not found</h2>
                <p className="text-muted-foreground mb-4">
                  The thread you're looking for doesn't exist.
                </p>
                <Button asChild>
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <EnhancedFooter />
      </div>
    );
  }

  const rootReplies = replies.filter((r) => !r.parentId);

  const handleSubmitReply = () => {
    if (!replyBody.trim()) {
      toast({
        title: "Reply cannot be empty",
        variant: "destructive",
      });
      return;
    }

    createReplyMutation.mutate({
      body: replyBody.trim(),
      ...(replyingTo && { parentId: replyingTo }),
    });
  };

  // Build breadcrumb schema
  const breadcrumbPath = [
    { name: 'Home', url: '/' },
    { name: thread.categorySlug || 'Discussion', url: `/category/${thread.categorySlug}` },
    { name: thread.title, url: (thread as any).fullUrl || `/thread/${thread.slug}` }
  ];

  return (
    <div>
      <BreadcrumbSchema path={breadcrumbPath} />
      <Header />
      <ReadingProgressBar />
      <FloatingActionBar
        onBookmark={handleBookmark}
        onShare={handleShare}
        isBookmarked={isBookmarked}
      />
      
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link
              href={`/category/${thread.categorySlug}`}
              className="hover:text-foreground transition-colors"
            >
              {thread.categorySlug}
            </Link>
            <span>/</span>
            <span className="text-foreground line-clamp-1">{thread.title}</span>
          </div>

          <article className="mb-12">
            <header className="mb-8">
              {thread.isPinned && (
                <Badge variant="secondary" className="mb-4" data-testid="badge-pinned">
                  📌 Pinned
                </Badge>
              )}
              
              <h1 
                className="text-4xl lg:text-5xl font-bold mb-6 leading-tight" 
                data-testid="text-thread-title"
              >
                {thread.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <Link
                  href={`/user/${(thread as any).authorUsername || 'unknown'}`}
                  className="flex items-center gap-2 group"
                  data-testid="link-author"
                >
                  <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary transition-all">
                    <AvatarFallback className="text-sm font-semibold">
                      {((thread as any).authorUsername?.[0]?.toUpperCase()) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold group-hover:text-primary transition-colors">
                      {(thread as any).authorUsername || "Unknown"}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{threadTimeAgo}</span>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-4 text-muted-foreground ml-auto">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span data-testid="text-views">{thread.views || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" />
                    <span data-testid="text-replies">{thread.replyCount || 0}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => requireAuth(handleLikeThread)}
                    disabled={likeMutation.isPending}
                    className={`hover-elevate active-elevate-2 ${isLiked ? 'text-primary' : ''}`}
                    data-testid="button-like-thread"
                  >
                    <ThumbsUp className={`h-4 w-4 mr-1.5 ${isLiked ? 'fill-current' : ''}`} />
                    <span data-testid="text-likes">{likeCount}</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Badge variant="outline" className="text-xs" data-testid={`badge-category-${thread.categorySlug}`}>
                  <Tag className="h-3 w-3 mr-1" />
                  {thread.categorySlug}
                </Badge>
              </div>
            </header>

            <Separator className="mb-8" />

            {/* Render rich HTML content if available, otherwise fallback to markdown */}
            <div 
              className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:tracking-tight
                prose-p:text-lg prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-lg prose-img:shadow-md prose-img:my-8
                prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-muted/50 prose-pre:p-4 prose-pre:rounded-lg prose-pre:my-6 prose-pre:overflow-x-auto
                prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r
                prose-li:marker:text-primary"
              data-testid="text-thread-body"
            >
              {(thread as any).contentHtml ? (
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize((thread as any).contentHtml, {
                      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre'],
                      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel'],
                    })
                  }} 
                />
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {thread.body || ""}
                </ReactMarkdown>
              )}
            </div>

            {/* File attachments section */}
            {(thread as any).attachments && (thread as any).attachments.length > 0 && (
              <AttachmentsSection 
                threadId={thread.id}
                attachments={(thread as any).attachments}
                isAuthor={user?.id === thread.authorId}
              />
            )}
          </article>

          <Separator className="my-12" />

          <section className="mb-12">
            <Card className="border-none shadow-none bg-transparent" data-testid="card-reply-form">
              <CardHeader className="px-0">
                <h2 className="text-2xl font-bold">
                  {replyingTo ? "Reply to comment" : "Join the discussion"}
                </h2>
                {replyingTo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                    data-testid="button-cancel-reply"
                    className="w-fit"
                  >
                    Cancel
                  </Button>
                )}
              </CardHeader>
              <CardContent className="px-0">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={4}
                  className="mb-4 resize-none text-base"
                  data-testid="input-reply-body"
                />
                <Button
                  onClick={() => requireAuth(handleSubmitReply)}
                  disabled={createReplyMutation.isPending || !replyBody.trim()}
                  data-testid="button-submit-reply"
                  size="lg"
                >
                  {createReplyMutation.isPending ? "Posting..." : "Post reply"}
                </Button>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold">
              {replies.length} {replies.length === 1 ? "Response" : "Responses"}
            </h2>

            {repliesLoading ? (
              <div className="animate-pulse space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted rounded-lg" />
                ))}
              </div>
            ) : rootReplies.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  No responses yet. Start the conversation!
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {rootReplies.map((reply) => (
                  <ReplyCard
                    key={reply.id}
                    reply={reply}
                    allReplies={replies}
                    onReply={(replyId: string) => requireAuth(() => setReplyingTo(replyId))}
                    onMarkHelpful={(replyId: string) => requireAuth(() => markHelpfulMutation.mutate(replyId))}
                    onMarkAccepted={(replyId: string) => requireAuth(() => markAcceptedMutation.mutate(replyId))}
                    isAuthor={thread.authorId === user?.id}
                    currentUserId={user?.id}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      <EnhancedFooter />
      <AuthPrompt />
    </div>
  );
}

function ReplyCard({
  reply,
  allReplies,
  onReply,
  onMarkHelpful,
  onMarkAccepted,
  isAuthor,
  currentUserId,
  depth = 0,
}: {
  reply: ForumReply;
  allReplies: ForumReply[];
  onReply: (replyId: string) => void;
  onMarkHelpful: (replyId: string) => void;
  onMarkAccepted: (replyId: string) => void;
  isAuthor: boolean;
  currentUserId?: string;
  depth?: number;
}) {
  const [replyTimeAgo, setReplyTimeAgo] = useState<string>("");
  const children = allReplies.filter((r) => r.parentId === reply.id);

  useEffect(() => {
    if (reply?.createdAt) {
      setReplyTimeAgo(formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true }));
    }
  }, [reply?.createdAt]);

  const { data: badges, isError } = useQuery<Array<{ id: string; name: string; description: string }>>({
    queryKey: ['/api/users', reply.userId, 'badges'],
    enabled: !!reply.userId,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const isOwnReply = reply.userId === currentUserId;

  return (
    <div className={depth > 0 ? "relative" : ""}>
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border -ml-6" />
      )}
      
      <div 
        className={`
          ${depth > 0 ? "ml-12" : ""}
          ${reply.isAccepted ? "ring-2 ring-green-500/20 rounded-lg" : ""}
          transition-all duration-200
        `}
        data-testid={`card-reply-${reply.id}`}
      >
        <div className={`py-6 ${depth === 0 ? "border-b" : ""}`}>
          <div className="flex items-start gap-4 mb-4">
            <Link href={`/user/${(reply as any).authorUsername || 'unknown'}`}>
              <Avatar className="h-10 w-10 hover:ring-2 hover:ring-primary transition-all">
                <AvatarFallback className="text-sm font-semibold">
                  {((reply as any).authorUsername?.[0]?.toUpperCase()) || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Link
                  href={`/user/${(reply as any).authorUsername || 'unknown'}`}
                  className="font-semibold hover:text-primary transition-colors"
                  data-testid={`link-reply-author-${reply.id}`}
                >
                  {(reply as any).authorUsername || "Unknown"}
                </Link>
                {badges && !isError && Array.isArray(badges) && badges.length > 0 && (
                  <BadgeDisplay badges={badges} size="sm" />
                )}
                {reply.isAccepted && (
                  <Badge variant="default" className="bg-green-600 text-xs" data-testid={`badge-accepted-${reply.id}`}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Accepted
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{replyTimeAgo}</span>
              </p>
            </div>
          </div>

          <div 
            className="prose dark:prose-invert max-w-none mb-4 ml-14
              prose-p:text-base prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded"
            data-testid={`text-reply-body-${reply.id}`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {reply.body || ""}
            </ReactMarkdown>
          </div>

          <div className="flex items-center gap-2 ml-14">
            <TooltipProvider>
              {!isOwnReply && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkHelpful(reply.id)}
                      className="hover-elevate active-elevate-2"
                      data-testid={`button-helpful-${reply.id}`}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1.5" />
                      <span className="text-xs">{reply.helpful || 0}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mark as helpful</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {isOwnReply && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm px-3">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-xs">{reply.helpful || 0}</span>
                </div>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReply(reply.id)}
                    className="hover-elevate active-elevate-2"
                    data-testid={`button-reply-${reply.id}`}
                  >
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    Reply
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reply to this comment</p>
                </TooltipContent>
              </Tooltip>

              {isAuthor && !reply.isAccepted && !isOwnReply && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkAccepted(reply.id)}
                      className="hover-elevate active-elevate-2"
                      data-testid={`button-accept-${reply.id}`}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Accept
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mark as accepted answer</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </div>

        {children.length > 0 && (
          <div className="space-y-0">
            {children.map((child) => (
              <ReplyCard
                key={child.id}
                reply={child}
                allReplies={allReplies}
                onReply={onReply}
                onMarkHelpful={onMarkHelpful}
                onMarkAccepted={onMarkAccepted}
                isAuthor={isAuthor}
                currentUserId={currentUserId}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
