'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ForumReply } from '../../../shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { ThumbsUp, CheckCircle2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useAuthPrompt } from '@/hooks/useAuthPrompt';

// FIXED: Use relative URLs for client-side API calls (works with Next.js rewrites)
// No hardcoded localhost URLs in client components!

// Reply validation schema matching backend
const replySchema = z.object({
  body: z.string().min(10, "Reply must be at least 10 characters").max(10000, "Reply is too long"),
});

type ReplyFormValues = z.infer<typeof replySchema>;

interface ReplySectionProps {
  threadId: string;
  threadSlug: string;
  replies: any[];
  isLocked: boolean;
  threadAuthorId: string;
}

export function ReplySection({
  threadId,
  threadSlug,
  replies: initialReplies,
  isLocked,
  threadAuthorId,
}: ReplySectionProps) {
  const [replies, setReplies] = useState(initialReplies);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { requireAuth, AuthPrompt } = useAuthPrompt("participate in discussions");

  // Main reply form
  const mainForm = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      body: '',
    },
  });

  // Nested reply form
  const nestedForm = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      body: '',
    },
  });

  // Fetch current user on mount
  useState(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  });

  const handleSubmitReply = async (data: ReplyFormValues, isNested = false) => {
    if (!user) {
      requireAuth(async () => {
        // User is now authenticated, reload to get updated user state
        window.location.reload();
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/threads/${threadId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          body: data.body,
          userId: user.id,
          ...(replyingTo && { parentId: replyingTo }),
        }),
      });

      if (response.ok) {
        // Refresh the page to show new reply
        window.location.reload();
      } else {
        alert('Failed to post reply');
      }
    } catch (error) {
      alert('An error occurred while posting your reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkHelpful = async (replyId: string) => {
    if (!user) {
      requireAuth(async () => {
        // User is now authenticated, reload to get updated user state
        window.location.reload();
      });
      return;
    }

    try {
      const response = await fetch(`/api/replies/${replyId}/helpful`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to mark as helpful:', error);
    }
  };

  const handleMarkAccepted = async (replyId: string) => {
    if (!user) {
      requireAuth(async () => {
        // User is now authenticated, reload to get updated user state
        window.location.reload();
      });
      return;
    }

    try {
      const response = await fetch(`/api/replies/${replyId}/accept`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to mark as accepted:', error);
    }
  };

  const rootReplies = replies.filter((r) => !r.parentId);

  const getReplies = (parentId: string) => {
    return replies.filter((r) => r.parentId === parentId);
  };

  const renderReply = (reply: any, depth: number = 0) => {
    const childReplies = getReplies(reply.id);

    return (
      <div key={reply.id} className={depth > 0 ? 'ml-8 mt-4' : ''}>
        <Card className={reply.isAcceptedAnswer ? 'border-green-500 border-2' : ''}>
          <CardContent className="p-4">
            {/* Reply Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {reply.author?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link
                    href={`/user/${reply.author?.username || 'unknown'}`}
                    className="font-medium hover:underline"
                  >
                    {reply.author?.username || 'Unknown'}
                  </Link>
                  <div suppressHydrationWarning className="text-xs text-muted-foreground">
                    {reply.createdAt && formatDistanceToNow(new Date(reply.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
              {reply.isAcceptedAnswer && (
                <Badge className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Accepted Answer
                </Badge>
              )}
            </div>

            {/* Reply Content */}
            <div
              className="prose prose-sm dark:prose-invert max-w-none mb-3"
              dangerouslySetInnerHTML={{ __html: reply.body || '' }}
            />

            {/* Reply Actions */}
            <div className="flex items-center gap-4 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMarkHelpful(reply.id)}
                className="text-xs"
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                Helpful ({reply.helpfulCount || 0})
              </Button>

              {user && user.id === threadAuthorId && !reply.isAcceptedAnswer && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkAccepted(reply.id)}
                  className="text-xs"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Mark as Answer
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(reply.id)}
                className="text-xs"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Reply
              </Button>
            </div>

            {/* Nested Reply Form */}
            {replyingTo === reply.id && (
              <div className="mt-4 pt-4 border-t">
                <Form {...nestedForm}>
                  <form onSubmit={nestedForm.handleSubmit((data) => handleSubmitReply(data, true))} className="space-y-2">
                    <FormField
                      control={nestedForm.control}
                      name="body"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Write your reply..."
                              rows={3}
                              data-testid="textarea-nested-reply"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isSubmitting} size="sm" data-testid="button-submit-nested-reply">
                        {isSubmitting ? 'Posting...' : 'Post Reply'}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setReplyingTo(null);
                          nestedForm.reset();
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Render child replies */}
        {childReplies.map((childReply) => renderReply(childReply, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Reply Form */}
      {!isLocked && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Write a Reply</h3>
            <Form {...mainForm}>
              <form onSubmit={mainForm.handleSubmit((data) => handleSubmitReply(data, false))} className="space-y-3">
                <FormField
                  control={mainForm.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder={
                            user
                              ? 'Share your thoughts or solution...'
                              : 'Please log in to reply'
                          }
                          disabled={!user || replyingTo !== null}
                          rows={5}
                          data-testid="textarea-main-reply"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={!user || isSubmitting || replyingTo !== null}
                  data-testid="button-submit-main-reply"
                >
                  {isSubmitting ? 'Posting...' : 'Post Reply'}
                </Button>
                {!user && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <button
                      type="button"
                      onClick={() => requireAuth(() => window.location.reload())}
                      className="text-primary hover:underline"
                    >
                      Log in
                    </button>{' '}
                    to participate in the discussion
                  </p>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {isLocked && (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground">
              This thread is locked. No new replies can be added.
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Render all replies */}
      <div className="space-y-4">
        {rootReplies.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No replies yet. Be the first to respond!
            </CardContent>
          </Card>
        ) : (
          rootReplies.map((reply) => renderReply(reply))
        )}
      </div>
      <AuthPrompt />
    </div>
  );
}
