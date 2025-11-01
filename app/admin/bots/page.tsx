"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Bot, Plus, Play, Trash2, Users, Wallet, Activity, Edit, Coins } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminAuthCheck } from "../auth-check";
import { BotModal } from "./BotModal";
import { BotActionsTable } from "./BotActionsTable";
import { useBots, useToggleBotStatus, useDeleteBot, useTreasury } from "@/hooks/useBots";
import type { Bot as BotType } from "../../../shared/schema";

interface BotData {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  purpose: 'engagement' | 'marketplace' | 'referral';
  trustLevel: number;
  isActive: boolean;
  personaProfile: { timezone: string; favoritePairs: string[] };
  activityCaps: { dailyLikes: number; dailyFollows: number; dailyPurchases: number; dailyUnlocks: number };
  createdAt: string;
  updatedAt: string;
  todaySpend?: number;
}

interface BotStats {
  totalBots: number;
  activeBots: number;
  todaySpending: number;
  totalActions: number;
}

interface BotsApiResponse {
  bots: BotData[];
  count: number;
  maxLimit: number;
  remaining: number;
}

export default function BotManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedBot, setSelectedBot] = useState<BotType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteBot, setDeleteBot] = useState<BotType | null>(null);
  const [filters, setFilters] = useState<{ isActive?: boolean; squad?: string; purpose?: string }>({});

  const { data, isLoading: botsLoading } = useBots(filters);
  const toggleStatus = useToggleBotStatus();
  const deleteBotMutation = useDeleteBot();
  const { data: treasuryData } = useTreasury();

  const bots = ((data as any)?.bots || []) as BotType[];
  const botCount = (data as any)?.count || { total: 0, active: 0, inactive: 0 };
  const treasury = (treasuryData as any)?.treasury;

  const runEngineMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/bots/run-engine", {});
    },
    onSuccess: () => {
      toast({ title: "Bot engine triggered successfully" });
    },
    onError: () => {
      toast({ title: "Failed to trigger bot engine", variant: "destructive" });
    }
  });

  const handleCreateBot = () => {
    setSelectedBot(null);
    setModalOpen(true);
  };

  const handleEditBot = (bot: BotType) => {
    setSelectedBot(bot);
    setModalOpen(true);
  };

  const handleToggleStatus = async (bot: BotType) => {
    await toggleStatus.mutateAsync({ botId: bot.id, isActive: !bot.isActive });
  };

  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case 'engagement': return 'default';
      case 'marketplace': return 'secondary';
      case 'referral': return 'outline';
      default: return 'outline';
    }
  };

  if (botsLoading) {
    return (
      <AdminAuthCheck>
        <div className="space-y-6 p-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </AdminAuthCheck>
    );
  }

  return (
    <AdminAuthCheck>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold dark:text-white text-gray-900" data-testid="title-bot-management">Bot Management</h1>
            <p className="text-muted-foreground">Manage automated bots and their behavior</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => runEngineMutation.mutate()}
              variant="outline"
              disabled={runEngineMutation.isPending}
              data-testid="button-run-engine"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Bot Engine Now
            </Button>
            <Button
              onClick={handleCreateBot}
              data-testid="button-create-bot"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Bot
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card data-testid="card-total-bots">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-bots">{botCount.total}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-active-bots">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bots</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-bots">{botCount.active}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-inactive-bots">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Bots</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-inactive-bots">{botCount.inactive}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-treasury">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treasury Balance</CardTitle>
              <Coins className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-treasury-balance">
                {treasury?.balance?.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-filters">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter bots by status, squad, and purpose</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Select 
                value={filters.isActive?.toString() || "all"} 
                onValueChange={(v) => setFilters({ ...filters, isActive: v === "all" ? undefined : v === "true" })}
              >
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="option-all-status">All Status</SelectItem>
                  <SelectItem value="true" data-testid="option-active">Active Only</SelectItem>
                  <SelectItem value="false" data-testid="option-inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.squad || "all"} 
                onValueChange={(v) => setFilters({ ...filters, squad: v === "all" ? undefined : v })}
              >
                <SelectTrigger data-testid="select-squad-filter">
                  <SelectValue placeholder="Squad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="option-all-squad">All Squads</SelectItem>
                  <SelectItem value="forum" data-testid="option-forum-squad">Forum</SelectItem>
                  <SelectItem value="marketplace" data-testid="option-marketplace-squad">Marketplace</SelectItem>
                  <SelectItem value="social" data-testid="option-social-squad">Social</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.purpose || "all"} 
                onValueChange={(v) => setFilters({ ...filters, purpose: v === "all" ? undefined : v })}
              >
                <SelectTrigger data-testid="select-purpose-filter">
                  <SelectValue placeholder="Purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="option-all-purpose">All Purposes</SelectItem>
                  <SelectItem value="engagement" data-testid="option-engagement-purpose">Engagement</SelectItem>
                  <SelectItem value="marketplace" data-testid="option-marketplace-purpose">Marketplace</SelectItem>
                  <SelectItem value="referral" data-testid="option-referral-purpose">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-bot-list">
          <CardHeader>
            <CardTitle>Bots ({bots.length})</CardTitle>
            <CardDescription>Manage all platform bots</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Squad</TableHead>
                    <TableHead>Aggression</TableHead>
                    <TableHead>Trust</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bots.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No bots found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bots.map((bot) => (
                      <TableRow key={bot.id} data-testid={`bot-row-${bot.id}`}>
                        <TableCell className="font-medium" data-testid={`bot-username-${bot.id}`}>
                          {bot.username}
                        </TableCell>
                        <TableCell data-testid={`bot-email-${bot.id}`}>
                          {bot.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPurposeColor(bot.purpose || '')} data-testid={`bot-purpose-${bot.id}`}>
                            {bot.purpose || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`bot-squad-${bot.id}`}>
                          <Badge variant="secondary">{bot.squad || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell data-testid={`bot-aggression-${bot.id}`}>
                          {bot.aggressionLevel}/10
                        </TableCell>
                        <TableCell data-testid={`bot-trust-${bot.id}`}>
                          {bot.trustLevel}/5
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={bot.isActive}
                              onCheckedChange={() => handleToggleStatus(bot)}
                              disabled={toggleStatus.isPending}
                              data-testid={`switch-bot-active-${bot.id}`}
                            />
                            <Badge variant={bot.isActive ? "default" : "secondary"} data-testid={`bot-status-${bot.id}`}>
                              {bot.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditBot(bot)}
                              data-testid={`button-edit-bot-${bot.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteBot(bot)}
                              data-testid={`button-delete-bot-${bot.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <BotActionsTable />

        <BotModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          bot={selectedBot}
        />

        <AlertDialog open={!!deleteBot} onOpenChange={(open) => !open && setDeleteBot(null)}>
          <AlertDialogContent data-testid="dialog-delete-bot">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Bot</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete bot <strong>{deleteBot?.username}</strong>? This will permanently delete this bot and all associated data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteBot && deleteBotMutation.mutateAsync(deleteBot.id).then(() => setDeleteBot(null))}
                className="bg-destructive hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                Delete Bot
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminAuthCheck>
  );
}
