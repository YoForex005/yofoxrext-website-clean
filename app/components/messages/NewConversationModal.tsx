'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Users, User } from 'lucide-react';
import { useSendMessage, useCreateGroupConversation } from '@/hooks/useMessaging';
import type { User as UserType } from '@shared/schema';
import { toast } from 'sonner';

interface NewConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated?: (conversationId: string) => void;
}

export function NewConversationModal({
  open,
  onOpenChange,
  onConversationCreated,
}: NewConversationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  const sendMessageMutation = useSendMessage();
  const createGroupMutation = useCreateGroupConversation();

  // Fetch users for selection
  // Note: This assumes there's an API endpoint to search/list users
  // If it doesn't exist, we'll need to handle it gracefully
  const { data: users = [], isLoading } = useQuery<UserType[]>({
    queryKey: ['/api/users', { search: searchQuery }],
    enabled: open && searchQuery.length > 0,
    staleTime: 30000,
  });

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleCreate = async () => {
    if (selectedUsers.size === 0) {
      toast.error('Please select at least one user');
      return;
    }

    try {
      if (isGroupChat || selectedUsers.size > 1) {
        // Create group conversation
        if (!groupName.trim()) {
          toast.error('Please enter a group name');
          return;
        }

        const result = await createGroupMutation.mutateAsync({
          participantIds: Array.from(selectedUsers),
          groupName: groupName.trim(),
          groupDescription: groupDescription.trim() || undefined,
        });

        toast.success('Group conversation created!');
        onConversationCreated?.(result.id);
      } else {
        // Create 1-on-1 conversation by sending a message
        const recipientId = Array.from(selectedUsers)[0];
        
        await sendMessageMutation.mutateAsync({
          recipientId,
          body: 'Hi! 👋', // Default first message
        });

        toast.success('Conversation started!');
        // The conversation ID will be returned, but we'll let the UI refresh naturally
      }

      // Reset form and close
      setSelectedUsers(new Set());
      setSearchQuery('');
      setGroupName('');
      setGroupDescription('');
      setIsGroupChat(false);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create conversation');
    }
  };

  const handleClose = () => {
    setSelectedUsers(new Set());
    setSearchQuery('');
    setGroupName('');
    setGroupDescription('');
    setIsGroupChat(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Start a conversation with one or more users
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Chat Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="group-chat"
              checked={isGroupChat || selectedUsers.size > 1}
              onCheckedChange={(checked) => setIsGroupChat(checked as boolean)}
              data-testid="checkbox-group-chat"
            />
            <Label htmlFor="group-chat" className="text-sm font-medium cursor-pointer">
              Create group chat
            </Label>
          </div>

          {/* Search Users */}
          <div className="space-y-2">
            <Label htmlFor="search-users">Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-users"
                placeholder="Search by username..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-users"
              />
            </div>
          </div>

          {/* Selected Users */}
          {selectedUsers.size > 0 && (
            <div className="space-y-2">
              <Label>Selected ({selectedUsers.size})</Label>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedUsers).map(userId => {
                  const user = users.find(u => u.id === userId);
                  if (!user) return null;
                  return (
                    <div
                      key={userId}
                      className="flex items-center gap-2 bg-muted rounded-full px-3 py-1"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">
                          {user.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.username}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleUserToggle(userId)}
                      >
                        ✕
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* User List */}
          {searchQuery.length > 0 && (
            <div className="space-y-2">
              <Label>Users</Label>
              <ScrollArea className="h-48 border rounded-lg">
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No users found
                  </div>
                ) : (
                  <div className="divide-y">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition-colors ${
                          selectedUsers.has(user.id) ? 'bg-muted' : ''
                        }`}
                        onClick={() => handleUserToggle(user.id)}
                        data-testid={`user-${user.id}`}
                      >
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => handleUserToggle(user.id)}
                        />
                        <Avatar>
                          <AvatarFallback>{user.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.username}</p>
                          {user.email && (
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Group Details (only if group chat) */}
          {(isGroupChat || selectedUsers.size > 1) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name *</Label>
                <Input
                  id="group-name"
                  placeholder="Enter group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  data-testid="input-group-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-description">Description (optional)</Label>
                <Textarea
                  id="group-description"
                  placeholder="Enter group description..."
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="resize-none"
                  rows={3}
                  data-testid="input-group-description"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              selectedUsers.size === 0 ||
              ((isGroupChat || selectedUsers.size > 1) && !groupName.trim()) ||
              sendMessageMutation.isPending ||
              createGroupMutation.isPending
            }
            data-testid="button-create-conversation"
          >
            {sendMessageMutation.isPending || createGroupMutation.isPending
              ? 'Creating...'
              : isGroupChat || selectedUsers.size > 1
              ? 'Create Group'
              : 'Start Chat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
