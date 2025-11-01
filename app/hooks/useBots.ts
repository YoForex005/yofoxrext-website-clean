"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Bot, InsertBot, BotAction, BotSettings, InsertBotSettings } from "../../shared/schema";

export function useBots(filters?: { isActive?: boolean; squad?: string; purpose?: string }) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['/api/admin/bots', filters],
    enabled: !!user && (user.role === 'admin' || user.role === 'superadmin'),
  });
}

export function useBot(botId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['/api/admin/bots', botId],
    enabled: !!user && !!botId && (user.role === 'admin' || user.role === 'superadmin'),
  });
}

export function useCreateBot() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (bot: Partial<InsertBot>) => {
      const res = await fetch('/api/admin/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bot),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bots'] });
      toast({ title: "Bot created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create bot", 
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useUpdateBot() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ botId, updates }: { botId: string; updates: Partial<Bot> }) => {
      const res = await fetch(`/api/admin/bots/${botId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bots'] });
      toast({ title: "Bot updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update bot", 
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useToggleBotStatus() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ botId, isActive }: { botId: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/bots/${botId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bots'] });
      toast({ title: "Bot status updated" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update bot status", 
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useDeleteBot() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (botId: string) => {
      const res = await fetch(`/api/admin/bots/${botId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bots'] });
      toast({ title: "Bot deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete bot", 
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useGenerateBotProfile() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (purpose: string) => {
      const res = await fetch('/api/admin/bots/generate-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose }),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      
      return res.json();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to generate profile", 
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useBotActions(botId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['/api/admin/bot-actions', botId],
    enabled: !!user && (user.role === 'admin' || user.role === 'superadmin'),
  });
}

export function useTreasury() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['/api/admin/treasury'],
    enabled: !!user && (user.role === 'admin' || user.role === 'superadmin'),
  });
}

export function useRefillTreasury() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch('/api/admin/treasury/refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/treasury'] });
      toast({ title: "Treasury refilled successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to refill treasury", 
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useBotSettings() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['/api/admin/bot-settings'],
    enabled: !!user && (user.role === 'admin' || user.role === 'superadmin'),
  });
}

export function useUpdateBotSettings() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (settings: Partial<BotSettings>) => {
      const res = await fetch('/api/admin/bot-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bot-settings'] });
      toast({ title: "Bot settings updated" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update settings", 
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useDrainUserWallet() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ userId, percentage, reason }: { userId: string; percentage: number; reason?: string }) => {
      const res = await fetch('/api/admin/economy/drain-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, percentage, reason }),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "User wallet drained successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to drain wallet", 
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useOverrideWalletCap() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ userId, newCap }: { userId: string; newCap: number | null }) => {
      const res = await fetch('/api/admin/economy/override-cap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newCap }),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Wallet cap overridden successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to override cap", 
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
