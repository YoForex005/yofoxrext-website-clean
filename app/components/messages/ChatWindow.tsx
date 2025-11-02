'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  VolumeX,
  Users,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { FileUpload } from './FileUpload';
import { useSendMessage, useMarkRead, useAddReaction, useRemoveReaction } from '@/hooks/useMessaging';
import { useMessagingSocket } from '@/hooks/useMessagingSocket';
import type { ConversationWithDetails, MessageWithDetails, TypingEvent } from '@/types/messaging';
import type { User } from '@shared/schema';
import { toast } from 'sonner';

// Message validation schema matching backend
const messageSchema = z.object({
  body: z.string().min(1, "Message cannot be empty").max(5000, "Message is too long"),
});

type MessageFormValues = z.infer<typeof messageSchema>;

interface ChatWindowProps {
  conversation: ConversationWithDetails | null;
  messages: MessageWithDetails[];
  currentUser: User;
  isLoading?: boolean;
  highlightMessageId?: string | null;
  onBack?: () => void;
  onLeaveConversation?: () => void;
  onMuteConversation?: () => void;
}

export function ChatWindow({
  conversation,
  messages,
  currentUser,
  isLoading = false,
  highlightMessageId = null,
  onBack,
  onLeaveConversation,
  onMuteConversation,
}: ChatWindowProps) {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const highlightedMessageRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendMessageMutation = useSendMessage();
  const markReadMutation = useMarkRead();
  const addReactionMutation = useAddReaction();
  const removeReactionMutation = useRemoveReaction();

  // Message form with validation
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      body: '',
    },
  });

  const { startTyping, stopTyping, joinConversation, leaveConversation: socketLeaveConversation } = useMessagingSocket({
    userId: currentUser?.id,
    onTyping: (event: TypingEvent) => {
      if (event.conversationId === conversation?.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (event.isTyping) {
            newSet.add(event.userId);
          } else {
            newSet.delete(event.userId);
          }
          return newSet;
        });
      }
    },
  });

  // Join conversation room when selected
  useEffect(() => {
    if (conversation?.id) {
      joinConversation(conversation.id);
      return () => {
        socketLeaveConversation();
      };
    }
  }, [conversation?.id, joinConversation, socketLeaveConversation]);

  // Auto-scroll to bottom on new messages or highlighted message
  useEffect(() => {
    if (highlightMessageId && highlightedMessageRef.current) {
      // Scroll to highlighted message
      highlightedMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // Scroll to bottom for new messages
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, highlightMessageId]);

  // Mark messages as read when they come into view
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    
    // Only mark as read if:
    // 1. It's a new message (different from last marked)
    // 2. It's not sent by current user
    // 3. It's not already read
    if (
      lastMessage &&
      lastMessage.id !== lastMessageId &&
      lastMessage.senderId !== currentUser?.id &&
      !lastMessage.isRead
    ) {
      markReadMutation.mutate(lastMessage.id);
      setLastMessageId(lastMessage.id);
    }
  }, [messages, currentUser?.id, lastMessageId, markReadMutation]);

  // Load draft from localStorage
  useEffect(() => {
    if (conversation?.id) {
      const draft = localStorage.getItem(`draft-${conversation.id}`);
      if (draft) {
        form.setValue('body', draft);
      } else {
        form.reset();
      }
    }
  }, [conversation?.id, form]);

  // Save draft to localStorage
  useEffect(() => {
    const messageText = form.watch('body');
    if (conversation?.id && messageText) {
      localStorage.setItem(`draft-${conversation.id}`, messageText);
    }
  }, [conversation?.id, form.watch('body')]);

  const handleSendMessage = async (data: MessageFormValues) => {
    if (!conversation) return;

    const recipientId = conversation.isGroup
      ? conversation.participant1Id // For groups, we'll need to handle this differently in the backend
      : conversation.otherParticipant?.id;

    if (!recipientId) {
      toast.error('Unable to send message: recipient not found');
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        recipientId,
        body: data.body,
      });

      form.reset();
      localStorage.removeItem(`draft-${conversation.id}`);
      
      // Stop typing indicator
      if (conversation.id) {
        stopTyping(conversation.id);
      }

      // Focus back on textarea
      textareaRef.current?.focus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit(handleSendMessage)();
    }
  };

  const handleTextChange = (value: string) => {
    // Emit typing indicator
    if (conversation?.id) {
      startTyping(conversation.id);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Auto-stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (conversation.id) {
          stopTyping(conversation.id);
        }
      }, 3000);
    }
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    addReactionMutation.mutate({ messageId, emoji });
  };

  const handleRemoveReaction = (messageId: string, emoji: string) => {
    removeReactionMutation.mutate({ messageId, emoji });
  };

  const handleDeleteMessage = (messageId: string) => {
    toast.info('Message delete feature coming soon');
  };

  // Empty state
  if (!conversation) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="p-12 text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg text-muted-foreground">
            Select a conversation to view messages
          </p>
        </CardContent>
      </Card>
    );
  }

  const otherParticipant = conversation.otherParticipant;
  const conversationName = conversation.isGroup
    ? conversation.groupName || 'Group Chat'
    : otherParticipant?.username || 'Unknown User';

  const typingUsernames = Array.from(typingUsers)
    .map(userId => {
      const user = conversation.participants?.find(p => p.userId === userId)?.user;
      return user?.username;
    })
    .filter(Boolean);

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              data-testid="button-back-to-conversations"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <Avatar>
            <AvatarFallback>
              {conversationName[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h2 className="text-lg font-semibold">{conversationName}</h2>
            {conversation.isGroup ? (
              <p className="text-sm text-muted-foreground">
                {conversation.participants?.length || 0} participants
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {otherParticipant ? 'Online' : 'Offline'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {conversation.isGroup && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-view-participants">
                    <Users className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Participants</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    {conversation.participants?.map(participant => (
                      <div key={participant.id} className="flex items-center gap-3 p-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{participant.user?.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{participant.user?.username}</span>
                        {participant.role === 'admin' && (
                          <span className="text-xs text-muted-foreground">(Admin)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-conversation-settings">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onMuteConversation}>
                  <VolumeX className="mr-2 h-4 w-4" />
                  Mute Notifications
                </DropdownMenuItem>
                {conversation.isGroup && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={onLeaveConversation}>
                      Leave Conversation
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <div className="flex gap-2 max-w-[70%]">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-20 w-64" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Send one to start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  ref={message.id === highlightMessageId ? highlightedMessageRef : null}
                >
                  <MessageBubble
                    message={message}
                    currentUser={currentUser}
                    highlighted={message.id === highlightMessageId}
                    onAddReaction={handleAddReaction}
                    onRemoveReaction={handleRemoveReaction}
                    onDelete={handleDeleteMessage}
                  />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Typing Indicator */}
        {typingUsernames.length > 0 && (
          <div className="px-4 py-2 text-sm text-muted-foreground italic" data-testid="typing-indicator">
            {typingUsernames.join(', ')} {typingUsernames.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        {/* File Upload Dialog */}
        {showFileUpload && lastMessageId && (
          <div className="p-4 border-t">
            <FileUpload
              messageId={lastMessageId}
              onUploadComplete={() => setShowFileUpload(false)}
              onUploadError={(error) => toast.error(error)}
            />
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t flex-shrink-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSendMessage)} className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => toast.info('Emoji picker coming soon')}
                data-testid="button-emoji-picker"
              >
                <Smile className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowFileUpload(!showFileUpload)}
                data-testid="button-attach-file"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Textarea
                        {...field}
                        ref={textareaRef}
                        placeholder="Type a message..."
                        onChange={(e) => {
                          field.onChange(e);
                          handleTextChange(e.target.value);
                        }}
                        onKeyPress={handleKeyPress}
                        className="min-h-[60px] max-h-[200px] resize-none"
                        data-testid="input-message"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={sendMessageMutation.isPending}
                data-testid="button-send-message"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
