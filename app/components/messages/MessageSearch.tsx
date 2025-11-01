'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, X, MessageSquare, Users, Loader2 } from 'lucide-react';
import { useSearchMessages } from '@/hooks/useSearchMessages';
import { useSearchConversations } from '@/hooks/useSearchConversations';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MessageSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectConversation: (conversationId: string, messageId?: string) => void;
}

export function MessageSearch({ open, onOpenChange, onSelectConversation }: MessageSearchProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'conversations'>('messages');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch search results
  const {
    data: messageResults = [],
    isLoading: messagesLoading,
    error: messagesError,
  } = useSearchMessages(query);

  const {
    data: conversationResults = [],
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useSearchConversations(query);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [messageResults, conversationResults, activeTab]);

  // Clear query when modal closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Get current results based on active tab
  const currentResults =
    activeTab === 'messages' ? messageResults : conversationResults;
  const currentLoading =
    activeTab === 'messages' ? messagesLoading : conversationsLoading;
  const currentError = activeTab === 'messages' ? messagesError : conversationsError;

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (currentResults.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < currentResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          handleSelectResult(selectedIndex);
          break;
        case 'Escape':
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    },
    [currentResults, selectedIndex, onOpenChange]
  );

  // Handle result selection
  const handleSelectResult = (index: number) => {
    if (activeTab === 'messages') {
      const result = messageResults[index];
      if (result) {
        onSelectConversation(result.conversation.id, result.message.id);
        onOpenChange(false);
      }
    } else {
      const result = conversationResults[index];
      if (result) {
        onSelectConversation(result.id);
        onOpenChange(false);
      }
    }
  };

  // Highlight matching text in search results
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-900 font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Get participant names for conversation
  const getConversationName = (conversation: any) => {
    if (conversation.isGroup && conversation.groupName) {
      return conversation.groupName;
    }
    if (conversation.otherParticipant) {
      return conversation.otherParticipant.username || conversation.otherParticipant.email;
    }
    return 'Unknown Conversation';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] p-0"
        onKeyDown={handleKeyDown}
        data-testid="dialog-search-messages"
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl">Search Messages</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages and conversations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
              data-testid="input-search-messages"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                data-testid="button-clear-search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Show query hint */}
          {query && query.length > 0 && query.length < (activeTab === 'messages' ? 3 : 2) && (
            <p className="text-sm text-muted-foreground mt-2">
              Type at least {activeTab === 'messages' ? '3' : '2'} characters to search...
            </p>
          )}
        </div>

        {/* Tabs for Messages and Conversations */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'messages' | 'conversations')}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2" data-testid="tabs-search-type">
              <TabsTrigger value="messages" data-testid="tab-messages">
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="conversations" data-testid="tab-conversations">
                <Users className="h-4 w-4 mr-2" />
                Conversations
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Messages Tab */}
          <TabsContent value="messages" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-[400px] px-6">
              <div className="space-y-2 py-4">
                {/* Loading State */}
                {currentLoading && query.length >= 3 && (
                  <div className="flex items-center justify-center py-8" data-testid="loading-search">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Searching...</span>
                  </div>
                )}

                {/* Error State */}
                {currentError && (
                  <div className="text-center py-8" data-testid="error-search">
                    <p className="text-destructive">Failed to search messages</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentError.message}
                    </p>
                  </div>
                )}

                {/* Empty State */}
                {!currentLoading && !currentError && query.length >= 3 && messageResults.length === 0 && (
                  <div className="text-center py-8" data-testid="empty-search">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No messages found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try different keywords
                    </p>
                  </div>
                )}

                {/* Results Header */}
                {!currentLoading && messageResults.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm text-muted-foreground">
                      Search results for "{query}" ({messageResults.length}{' '}
                      {messageResults.length === 1 ? 'message' : 'messages'})
                    </p>
                  </div>
                )}

                {/* Message Results */}
                {messageResults.slice(0, 20).map((result, index) => (
                  <Card
                    key={result.message.id}
                    className={cn(
                      'p-4 cursor-pointer transition-colors hover:bg-accent',
                      selectedIndex === index && 'bg-accent'
                    )}
                    onClick={() => handleSelectResult(index)}
                    data-testid={`card-message-result-${result.message.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {result.message.sender.username || result.message.sender.email}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            in {getConversationName(result.conversation)}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2">
                          {highlightText(result.snippet || result.message.body, query)}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(result.message.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </Card>
                ))}

                {/* Pagination hint */}
                {messageResults.length > 20 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Showing first 20 of {messageResults.length} results
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="conversations" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-[400px] px-6">
              <div className="space-y-2 py-4">
                {/* Loading State */}
                {currentLoading && query.length >= 2 && (
                  <div className="flex items-center justify-center py-8" data-testid="loading-search">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Searching...</span>
                  </div>
                )}

                {/* Error State */}
                {currentError && (
                  <div className="text-center py-8" data-testid="error-search">
                    <p className="text-destructive">Failed to search conversations</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentError.message}
                    </p>
                  </div>
                )}

                {/* Empty State */}
                {!currentLoading && !currentError && query.length >= 2 && conversationResults.length === 0 && (
                  <div className="text-center py-8" data-testid="empty-search">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No conversations found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try different keywords
                    </p>
                  </div>
                )}

                {/* Results Header */}
                {!currentLoading && conversationResults.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm text-muted-foreground">
                      Search results for "{query}" ({conversationResults.length}{' '}
                      {conversationResults.length === 1 ? 'conversation' : 'conversations'})
                    </p>
                  </div>
                )}

                {/* Conversation Results */}
                {conversationResults.slice(0, 20).map((conversation, index) => (
                  <Card
                    key={conversation.id}
                    className={cn(
                      'p-4 cursor-pointer transition-colors hover:bg-accent',
                      selectedIndex === index && 'bg-accent'
                    )}
                    onClick={() => handleSelectResult(index)}
                    data-testid={`card-conversation-result-${conversation.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {conversation.isGroup ? (
                            <Users className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-semibold text-sm">
                            {highlightText(getConversationName(conversation), query)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{conversation.participants.length} participants</span>
                          {conversation.lastMessage && (
                            <>
                              <span>•</span>
                              <span className="truncate">
                                {conversation.lastMessage.body.substring(0, 50)}
                                {conversation.lastMessage.body.length > 50 ? '...' : ''}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {conversation.lastMessageAt && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(conversation.lastMessageAt), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}

                {/* Pagination hint */}
                {conversationResults.length > 20 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Showing first 20 of {conversationResults.length} results
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Keyboard shortcuts hint */}
        <div className="px-6 pb-4 pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Use <kbd className="px-1 py-0.5 rounded bg-muted">↑</kbd>{' '}
            <kbd className="px-1 py-0.5 rounded bg-muted">↓</kbd> to navigate,{' '}
            <kbd className="px-1 py-0.5 rounded bg-muted">Enter</kbd> to select,{' '}
            <kbd className="px-1 py-0.5 rounded bg-muted">Esc</kbd> to close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
