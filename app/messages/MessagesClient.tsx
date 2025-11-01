'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import EnhancedFooter from '@/components/EnhancedFooter';
import { Button } from '@/components/ui/button';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatWindow } from '@/components/messages/ChatWindow';
import { NewConversationModal } from '@/components/messages/NewConversationModal';
import { MessageSearch } from '@/components/messages/MessageSearch';
import { useMessagingSocket } from '@/hooks/useMessagingSocket';
import { useConversations, useConversation } from '@/hooks/useMessaging';
import { useIsMobile } from '@/hooks/use-mobile';
import { Search, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { User } from '@shared/schema';
import type { ConversationWithDetails, TypingEvent, UserOnlineEvent } from '@/types/messaging';

interface MessagesClientProps {
  initialConversations?: ConversationWithDetails[];
}

export default function MessagesClient({ initialConversations = [] }: MessagesClientProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/me'],
  });

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useConversations();

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useConversation(selectedConversationId);

  // Set up WebSocket
  useMessagingSocket({
    userId: currentUser?.id,
    onNewMessage: (event) => {
      // Show notification if message is not from current user and not in active conversation
      if (event.message.senderId !== currentUser?.id) {
        if (event.conversationId !== selectedConversationId) {
          toast.success('New message received!', {
            description: event.message.body.substring(0, 50) + (event.message.body.length > 50 ? '...' : ''),
          });
        }
      }
    },
    onTyping: (event: TypingEvent) => {
      setTypingUsers(prev => ({
        ...prev,
        [event.conversationId]: event.isTyping,
      }));

      // Auto-clear typing after 5 seconds
      if (event.isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [event.conversationId]: false,
          }));
        }, 5000);
      }
    },
    onUserOnline: (event: UserOnlineEvent) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.add(event.userId);
        return newSet;
      });
    },
    onUserOffline: (event: UserOnlineEvent) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(event.userId);
        return newSet;
      });
    },
  });

  // Handle URL parameters for deep linking to specific messages
  useEffect(() => {
    const conversationId = searchParams.get('conversationId');
    const messageId = searchParams.get('messageId');

    if (conversationId) {
      setSelectedConversationId(conversationId);
      if (messageId) {
        setHighlightMessageId(messageId);
        
        // Clear highlight after 3 seconds
        const timeout = setTimeout(() => {
          setHighlightMessageId(null);
        }, 3000);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [searchParams]);

  // Keyboard shortcut for search (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Enrich conversations with typing status
  const enrichedConversations = useMemo(() => {
    return conversations.map(conv => ({
      ...conv,
      isTyping: typingUsers[conv.id] || false,
    }));
  }, [conversations, typingUsers]);

  // Get selected conversation details
  const selectedConversation = enrichedConversations.find(
    c => c.id === selectedConversationId
  ) || null;

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleNewConversation = () => {
    setShowNewConversation(true);
  };

  const handleConversationCreated = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleBack = () => {
    setSelectedConversationId(null);
  };

  const handleLeaveConversation = () => {
    toast.info('Leave conversation feature coming soon');
  };

  const handleMuteConversation = () => {
    toast.info('Mute conversation feature coming soon');
  };

  const handleSearchResultSelect = (conversationId: string, messageId?: string) => {
    setSelectedConversationId(conversationId);
    if (messageId) {
      setHighlightMessageId(messageId);
      
      // Clear highlight after 3 seconds
      setTimeout(() => {
        setHighlightMessageId(null);
      }, 3000);
    }
  };

  // Mobile view: show either conversation list or chat window
  const showConversationList = !isMobile || !selectedConversationId;
  const showChatWindow = !isMobile || selectedConversationId;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground mt-2">
              Connect with traders, share strategies, and collaborate
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSearch(true)}
              title="Search messages (Ctrl+K)"
              data-testid="button-open-search"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/messages/settings')}
              title="Message settings"
              data-testid="button-message-settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Two-column layout: Conversations | Chat Window */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          {/* Left Column: Conversation List */}
          {showConversationList && (
            <div className={`${isMobile ? '' : 'md:col-span-1'} h-full`}>
              <ConversationList
                conversations={enrichedConversations}
                selectedConversationId={selectedConversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                isLoading={conversationsLoading}
                typingUsers={typingUsers}
                onlineUsers={onlineUsers}
              />
            </div>
          )}

          {/* Right Column: Chat Window */}
          {showChatWindow && (
            <div className={`${isMobile ? '' : 'md:col-span-2'} h-full`}>
              <ChatWindow
                conversation={selectedConversation}
                messages={messages}
                currentUser={currentUser!}
                isLoading={messagesLoading}
                highlightMessageId={highlightMessageId}
                onBack={isMobile ? handleBack : undefined}
                onLeaveConversation={handleLeaveConversation}
                onMuteConversation={handleMuteConversation}
              />
            </div>
          )}
        </div>

        {/* New Conversation Modal */}
        <NewConversationModal
          open={showNewConversation}
          onOpenChange={setShowNewConversation}
          onConversationCreated={handleConversationCreated}
        />

        {/* Search Modal */}
        <MessageSearch
          open={showSearch}
          onOpenChange={setShowSearch}
          onSelectConversation={handleSearchResultSelect}
        />
      </main>

      <EnhancedFooter />
    </div>
  );
}
