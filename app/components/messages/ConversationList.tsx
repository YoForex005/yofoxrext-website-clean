'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, MessageSquare } from 'lucide-react';
import type { ConversationWithDetails } from '@/types/messaging';

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  isLoading?: boolean;
  typingUsers?: Record<string, boolean>;
  onlineUsers?: Set<string>;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  isLoading = false,
  typingUsers = {},
  onlineUsers = new Set(),
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Search by group name
    if (conv.isGroup && conv.groupName) {
      return conv.groupName.toLowerCase().includes(query);
    }
    
    // Search by other participant's username
    if (conv.otherParticipant) {
      return conv.otherParticipant.username.toLowerCase().includes(query);
    }
    
    // Search by last message
    if (conv.lastMessage) {
      return conv.lastMessage.body.toLowerCase().includes(query);
    }
    
    return false;
  });

  const sortedConversations = [...filteredConversations].sort((a, b) => {
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="border-b">
          <Skeleton className="h-10 w-full" />
        </CardHeader>
        <CardContent className="p-0">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button
            size="sm"
            onClick={onNewConversation}
            data-testid="button-new-conversation"
          >
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search conversations..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-conversations"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? 'Try a different search' : 'Start a conversation with other traders'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {sortedConversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.id;
              const isTyping = conversation.isTyping || false;
              const otherUserId = conversation.otherParticipant?.id;
              const isOnline = otherUserId ? onlineUsers.has(otherUserId) : false;

              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`p-4 cursor-pointer transition-colors relative ${
                    isSelected
                      ? 'bg-muted'
                      : 'hover:bg-muted/50'
                  }`}
                  style={{
                    borderLeft: conversation.unreadCount > 0
                      ? '4px solid hsl(var(--primary))'
                      : '4px solid transparent',
                  }}
                  data-testid={`conversation-${conversation.id}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar with online indicator */}
                    <div className="relative flex-shrink-0">
                      <Avatar>
                        <AvatarFallback>
                          {conversation.isGroup
                            ? conversation.groupName?.[0] || 'G'
                            : conversation.otherParticipant?.username?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {!conversation.isGroup && isOnline && (
                        <div
                          className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"
                          data-testid={`status-online-${conversation.id}`}
                        />
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm truncate">
                          {conversation.isGroup
                            ? conversation.groupName || 'Group Chat'
                            : conversation.otherParticipant?.username || 'Unknown User'}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <Badge
                            variant="default"
                            className="ml-2 flex-shrink-0"
                            data-testid={`badge-unread-${conversation.id}`}
                          >
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>

                      {/* Last message or typing indicator */}
                      {isTyping ? (
                        <p className="text-sm text-primary italic" data-testid={`typing-${conversation.id}`}>
                          {conversation.otherParticipant?.username || 'Someone'} is typing...
                        </p>
                      ) : conversation.lastMessage ? (
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage.body.length > 50
                            ? conversation.lastMessage.body.substring(0, 50) + '...'
                            : conversation.lastMessage.body}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No messages yet
                        </p>
                      )}

                      {/* Timestamp */}
                      <p
                        suppressHydrationWarning
                        className="text-xs text-muted-foreground mt-1"
                      >
                        {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
