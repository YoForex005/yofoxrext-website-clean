"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Coins } from "lucide-react";
import { useBotActions } from "@/hooks/useBots";
import { Skeleton } from "@/components/ui/skeleton";
import type { BotAction } from "../../../shared/schema";

interface BotActionsTableProps {
  botId?: string;
}

export function BotActionsTable({ botId }: BotActionsTableProps) {
  const [page, setPage] = useState(1);
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");
  const { data, isLoading } = useBotActions(botId);

  const actions = ((data as any)?.actions || []) as BotAction[];
  const pageSize = 20;
  const totalPages = Math.ceil(actions.length / pageSize);
  const paginatedActions = actions.slice((page - 1) * pageSize, page * pageSize);

  const filteredActions = actionTypeFilter === "all" 
    ? paginatedActions 
    : paginatedActions.filter(action => action.actionType === actionTypeFilter);

  if (isLoading) {
    return (
      <Card data-testid="card-bot-actions">
        <CardHeader>
          <CardTitle>Bot Actions</CardTitle>
          <CardDescription>Loading bot actions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-bot-actions">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bot Actions</CardTitle>
            <CardDescription>Recent bot interactions and purchases</CardDescription>
          </div>
          <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
            <SelectTrigger className="w-48" data-testid="select-action-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="option-all">All Actions</SelectItem>
              <SelectItem value="like" data-testid="option-like">Likes</SelectItem>
              <SelectItem value="follow" data-testid="option-follow">Follows</SelectItem>
              <SelectItem value="purchase" data-testid="option-purchase">Purchases</SelectItem>
              <SelectItem value="download" data-testid="option-download">Downloads</SelectItem>
              <SelectItem value="view" data-testid="option-view">Views</SelectItem>
              <SelectItem value="unlock" data-testid="option-unlock">Unlocks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bot</TableHead>
                <TableHead>Action Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Target ID</TableHead>
                <TableHead>Coin Cost</TableHead>
                <TableHead>Refund Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No actions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredActions.map((action) => (
                  <TableRow key={action.id} data-testid={`row-action-${action.id}`}>
                    <TableCell className="font-medium" data-testid={`text-bot-${action.botId}`}>
                      {action.botId.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-type-${action.actionType}`}>
                        {action.actionType}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-target-type-${action.targetType}`}>
                      {action.targetType}
                    </TableCell>
                    <TableCell className="font-mono text-sm" data-testid={`text-target-id-${action.targetId}`}>
                      {action.targetId.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1" data-testid={`text-cost-${action.coinCost}`}>
                        <Coins className="h-3 w-3 text-amber-500" />
                        <span>{action.coinCost}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {action.wasRefunded ? (
                        <Badge variant="secondary" data-testid="badge-refunded">
                          Refunded
                        </Badge>
                      ) : (
                        <Badge variant="default" data-testid="badge-not-refunded">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" data-testid={`text-date-${action.id}`}>
                      {new Date(action.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground" data-testid="text-page-info">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                data-testid="button-next-page"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
