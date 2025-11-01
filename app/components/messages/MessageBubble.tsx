'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Check,
  CheckCheck,
  MoreVertical,
  Smile,
  Download,
  File,
  Image as ImageIcon,
  FileText,
  Copy,
  Trash,
} from 'lucide-react';
import type { MessageWithDetails } from '@/types/messaging';
import type { User } from '@shared/schema';

interface MessageBubbleProps {
  message: MessageWithDetails;
  currentUser: User;
  highlighted?: boolean;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function MessageBubble({
  message,
  currentUser,
  highlighted = false,
  onAddReaction,
  onRemoveReaction,
  onDelete,
}: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const isSentByMe = message.senderId === currentUser?.id;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.body);
  };

  const handleDownloadAttachment = async (attachmentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download attachment');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Group reactions by emoji
  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        count: 0,
        users: [],
        hasReacted: false,
      };
    }
    acc[reaction.emoji].count++;
    if (reaction.user) {
      acc[reaction.emoji].users.push(reaction.user);
    }
    if (reaction.userId === currentUser?.id) {
      acc[reaction.emoji].hasReacted = true;
    }
    return acc;
  }, {} as Record<string, { count: number; users: User[]; hasReacted: boolean }>);

  return (
    <div
      className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'} group`}
      data-testid={`message-${message.id}`}
    >
      <div className={`flex gap-2 max-w-[70%] ${isSentByMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback>
            {isSentByMe ? currentUser?.username?.[0] : message.sender?.username?.[0]}
          </AvatarFallback>
        </Avatar>

        {/* Message Content */}
        <div className="flex flex-col gap-1">
          {/* Sender name (only for received messages) */}
          {!isSentByMe && (
            <span className="text-xs text-muted-foreground px-3">
              {message.sender?.username || 'Unknown'}
            </span>
          )}

          {/* Message Bubble */}
          <div className="relative group/message">
            <div
              className={`rounded-lg p-3 transition-colors ${
                highlighted
                  ? 'bg-yellow-200 dark:bg-yellow-900/50 animate-pulse'
                  : isSentByMe
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {/* Message Text */}
              <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className={`flex items-center gap-2 p-2 rounded ${
                        isSentByMe
                          ? 'bg-primary-foreground/10'
                          : 'bg-background'
                      }`}
                    >
                      {getFileIcon(attachment.fileType)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{attachment.fileName}</p>
                        <p className="text-xs opacity-70">{formatFileSize(attachment.fileSize)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => handleDownloadAttachment(attachment.id, attachment.fileName)}
                        data-testid={`download-attachment-${attachment.id}`}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Timestamp and Read Status */}
              <div className="flex items-center gap-1 mt-1 justify-end">
                <p
                  suppressHydrationWarning
                  className={`text-xs ${
                    isSentByMe
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  }`}
                >
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </p>
                {isSentByMe && (
                  <>
                    {message.readAt ? (
                      <CheckCheck className="h-3 w-3 text-blue-400" data-testid="read-receipt-read" />
                    ) : message.deliveredAt ? (
                      <CheckCheck className="h-3 w-3 text-primary-foreground/70" data-testid="read-receipt-delivered" />
                    ) : (
                      <Check className="h-3 w-3 text-primary-foreground/70" data-testid="read-receipt-sent" />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Hover Actions */}
            <div className="absolute -top-3 right-0 opacity-0 group-hover/message:opacity-100 transition-opacity flex gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-6 w-6 shadow-md"
                onClick={() => setShowReactions(!showReactions)}
                data-testid={`button-react-${message.id}`}
              >
                <Smile className="h-3 w-3" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6 shadow-md"
                    data-testid={`button-message-options-${message.id}`}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Text
                  </DropdownMenuItem>
                  {isSentByMe && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete?.(message.id)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Message
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Quick Reactions Picker */}
          {showReactions && (
            <div className="flex gap-1 mt-1 p-2 bg-background border rounded-lg shadow-lg">
              {QUICK_REACTIONS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:scale-110 transition-transform"
                  onClick={() => {
                    onAddReaction?.(message.id, emoji);
                    setShowReactions(false);
                  }}
                  data-testid={`emoji-${emoji}`}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          )}

          {/* Reactions Display */}
          {groupedReactions && Object.keys(groupedReactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(groupedReactions).map(([emoji, data]) => (
                <Badge
                  key={emoji}
                  variant={data.hasReacted ? 'default' : 'secondary'}
                  className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => {
                    if (data.hasReacted) {
                      onRemoveReaction?.(message.id, emoji);
                    } else {
                      onAddReaction?.(message.id, emoji);
                    }
                  }}
                  data-testid={`reaction-${emoji}-${message.id}`}
                >
                  {emoji} {data.count}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
