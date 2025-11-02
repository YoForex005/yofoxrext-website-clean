"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LifeBuoy,
  Clock,
  CheckCircle2,
  Star,
  Filter,
  MessageSquare,
  Eye,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type SupportTicket = {
  id: number;
  ticketNumber: string;
  userId: string;
  subject: string;
  description: string;
  category: "technical" | "billing" | "general" | "account" | "other";
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "closed";
  firstResponseAt: string | null;
  resolvedAt: string | null;
  satisfactionScore: number | null;
  satisfactionComment: string | null;
  satisfactionSubmittedAt: string | null;
  lastAdminResponderId: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type TicketMessage = {
  id: number;
  ticketId: number;
  authorId: string;
  body: string;
  isAdmin: boolean;
  attachments: string[] | null;
  createdAt: string;
};

type TicketWithMessages = {
  ticket: SupportTicket;
  messages: TicketMessage[];
};

type SupportKPIs = {
  openTickets: number;
  avgResponseTimeHours: number;
  avgResolutionTimeHours: number;
  satisfactionPercentage: number;
};

export default function AdminSupportPage() {
  const { toast } = useToast();
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    category: "",
  });
  const [replyMessage, setReplyMessage] = useState("");

  // Fetch KPIs with 10s auto-refresh
  const { data: kpis, isLoading: kpisLoading } = useQuery<SupportKPIs>({
    queryKey: ["/api/admin/support/kpis"],
    refetchInterval: 10000,
  });

  // Build query string from filters
  const queryString = Object.entries(filters)
    .filter(([_, value]) => value !== "")
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  // Fetch tickets with 10s auto-refresh
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/admin/support/tickets", filters],
    queryFn: async () => {
      const url = queryString
        ? `/api/admin/support/tickets?${queryString}`
        : "/api/admin/support/tickets";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    refetchInterval: 10000,
  });

  // Fetch selected ticket details
  const { data: ticketDetail, isLoading: detailLoading } = useQuery<TicketWithMessages>({
    queryKey: ["/api/admin/support/tickets", selectedTicketId],
    enabled: selectedTicketId !== null && detailDialog,
    refetchInterval: 10000,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: number; status: string }) =>
      apiRequest("PUT", `/api/admin/support/tickets/${ticketId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/kpis"] });
      toast({ title: "Success", description: "Status updated successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update priority mutation
  const updatePriorityMutation = useMutation({
    mutationFn: ({ ticketId, priority }: { ticketId: number; priority: string }) =>
      apiRequest("PUT", `/api/admin/support/tickets/${ticketId}/priority`, { priority }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      toast({ title: "Success", description: "Priority updated successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Add admin message mutation
  const addMessageMutation = useMutation({
    mutationFn: ({ ticketId, body }: { ticketId: number; body: string }) =>
      apiRequest("POST", `/api/admin/support/tickets/${ticketId}/messages`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/kpis"] });
      setReplyMessage("");
      toast({ title: "Success", description: "Message sent!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleStatusChange = (status: string) => {
    if (!selectedTicketId) return;
    updateStatusMutation.mutate({ ticketId: selectedTicketId, status });
  };

  const handlePriorityChange = (priority: string) => {
    if (!selectedTicketId) return;
    updatePriorityMutation.mutate({ ticketId: selectedTicketId, priority });
  };

  const handleAddMessage = () => {
    if (!selectedTicketId || !replyMessage.trim()) {
      toast({ title: "Error", description: "Please enter a message", variant: "destructive" });
      return;
    }
    addMessageMutation.mutate({ ticketId: selectedTicketId, body: replyMessage });
  };

  const openTicketDetail = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setDetailDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      open: { variant: "default", className: "bg-blue-500 hover:bg-blue-600" },
      in_progress: { variant: "secondary", className: "bg-yellow-500 hover:bg-yellow-600" },
      closed: { variant: "outline", className: "bg-gray-500 hover:bg-gray-600 text-white" },
    };
    const config = variants[status] || variants.open;
    return (
      <Badge variant={config.variant} className={config.className} data-testid={`badge-status-${status}`}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
      medium: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
      high: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
    };
    return (
      <Badge className={colors[priority] || ""} data-testid={`badge-priority-${priority}`}>
        {priority}
      </Badge>
    );
  };

  const formatDuration = (hours: number) => {
    if (hours === 0) return "N/A";
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-admin-support">
            Support Tickets Management
          </h1>
          <p className="text-gray-400" data-testid="text-admin-support-description">
            Monitor and respond to customer support requests
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center" data-testid="label-kpi-open-tickets">
                <LifeBuoy className="mr-2 h-4 w-4" />
                Open Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white" data-testid="value-kpi-open-tickets">
                {kpisLoading ? "..." : kpis?.openTickets || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center" data-testid="label-kpi-response-time">
                <Clock className="mr-2 h-4 w-4" />
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white" data-testid="value-kpi-response-time">
                {kpisLoading ? "..." : formatDuration(kpis?.avgResponseTimeHours || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center" data-testid="label-kpi-resolution-time">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Avg Resolution Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white" data-testid="value-kpi-resolution-time">
                {kpisLoading ? "..." : formatDuration(kpis?.avgResolutionTimeHours || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center" data-testid="label-kpi-satisfaction">
                <Star className="mr-2 h-4 w-4" />
                Satisfaction Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white" data-testid="value-kpi-satisfaction">
                {kpisLoading ? "..." : `${kpis?.satisfactionPercentage.toFixed(0) || 0}%`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center" data-testid="heading-filters">
              <Filter className="mr-2 h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="filter-status" className="text-gray-300" data-testid="label-filter-status">
                  Status
                </Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger id="filter-status" className="bg-gray-700 border-gray-600 text-white" data-testid="select-filter-status">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" data-testid="option-status-all">All Statuses</SelectItem>
                    <SelectItem value="open" data-testid="option-status-open">Open</SelectItem>
                    <SelectItem value="in_progress" data-testid="option-status-in-progress">In Progress</SelectItem>
                    <SelectItem value="closed" data-testid="option-status-closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filter-priority" className="text-gray-300" data-testid="label-filter-priority">
                  Priority
                </Label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => setFilters({ ...filters, priority: value })}
                >
                  <SelectTrigger id="filter-priority" className="bg-gray-700 border-gray-600 text-white" data-testid="select-filter-priority">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" data-testid="option-priority-all">All Priorities</SelectItem>
                    <SelectItem value="low" data-testid="option-priority-low">Low</SelectItem>
                    <SelectItem value="medium" data-testid="option-priority-medium">Medium</SelectItem>
                    <SelectItem value="high" data-testid="option-priority-high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filter-category" className="text-gray-300" data-testid="label-filter-category">
                  Category
                </Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters({ ...filters, category: value })}
                >
                  <SelectTrigger id="filter-category" className="bg-gray-700 border-gray-600 text-white" data-testid="select-filter-category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" data-testid="option-category-all">All Categories</SelectItem>
                    <SelectItem value="technical" data-testid="option-category-technical">Technical</SelectItem>
                    <SelectItem value="billing" data-testid="option-category-billing">Billing</SelectItem>
                    <SelectItem value="general" data-testid="option-category-general">General</SelectItem>
                    <SelectItem value="account" data-testid="option-category-account">Account</SelectItem>
                    <SelectItem value="other" data-testid="option-category-other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white" data-testid="heading-tickets-table">Support Tickets</CardTitle>
            <CardDescription className="text-gray-400">
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ticketsLoading ? (
              <div className="text-center py-8 text-gray-400" data-testid="loading-tickets">
                Loading tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-gray-400" data-testid="text-no-tickets">
                No tickets found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-750">
                      <TableHead className="text-gray-300" data-testid="column-ticket-number">Ticket #</TableHead>
                      <TableHead className="text-gray-300" data-testid="column-user">User</TableHead>
                      <TableHead className="text-gray-300" data-testid="column-subject">Subject</TableHead>
                      <TableHead className="text-gray-300" data-testid="column-status">Status</TableHead>
                      <TableHead className="text-gray-300" data-testid="column-priority">Priority</TableHead>
                      <TableHead className="text-gray-300" data-testid="column-created">Created</TableHead>
                      <TableHead className="text-gray-300" data-testid="column-actions">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        className="border-gray-700 hover:bg-gray-750"
                        data-testid={`row-ticket-${ticket.id}`}
                      >
                        <TableCell className="font-medium text-white" data-testid={`cell-ticket-number-${ticket.id}`}>
                          {ticket.ticketNumber}
                        </TableCell>
                        <TableCell className="text-gray-300" data-testid={`cell-user-${ticket.id}`}>
                          {ticket.userId.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="text-gray-300 max-w-xs truncate" data-testid={`cell-subject-${ticket.id}`}>
                          {ticket.subject}
                        </TableCell>
                        <TableCell data-testid={`cell-status-${ticket.id}`}>
                          {getStatusBadge(ticket.status)}
                        </TableCell>
                        <TableCell data-testid={`cell-priority-${ticket.id}`}>
                          {getPriorityBadge(ticket.priority)}
                        </TableCell>
                        <TableCell className="text-gray-300" data-testid={`cell-created-${ticket.id}`}>
                          {format(new Date(ticket.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openTicketDetail(ticket.id)}
                            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                            data-testid={`button-view-${ticket.id}`}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 text-white border-gray-700" data-testid="dialog-ticket-detail">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white" data-testid="heading-ticket-detail">
              {ticketDetail?.ticket.ticketNumber || "Ticket Details"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Manage ticket and respond to customer
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="text-center py-8 text-gray-400" data-testid="loading-ticket-detail">
              Loading...
            </div>
          ) : ticketDetail ? (
            <div className="space-y-6">
              {/* Ticket Header */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-750 rounded-lg">
                <div>
                  <span className="text-gray-400 text-sm" data-testid="label-user-detail">User ID:</span>
                  <p className="font-mono text-white" data-testid="text-user-detail">{ticketDetail.ticket.userId}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm" data-testid="label-created-detail">Created:</span>
                  <p className="text-white" data-testid="text-created-detail">
                    {format(new Date(ticketDetail.ticket.createdAt), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
              </div>

              {/* Status and Priority Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status-select" className="text-gray-300" data-testid="label-status-select">
                    Status
                  </Label>
                  <Select
                    value={ticketDetail.ticket.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger id="status-select" className="bg-gray-700 border-gray-600 text-white" data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open" data-testid="option-status-open-detail">Open</SelectItem>
                      <SelectItem value="in_progress" data-testid="option-status-in-progress-detail">In Progress</SelectItem>
                      <SelectItem value="closed" data-testid="option-status-closed-detail">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority-select" className="text-gray-300" data-testid="label-priority-select">
                    Priority
                  </Label>
                  <Select
                    value={ticketDetail.ticket.priority}
                    onValueChange={handlePriorityChange}
                  >
                    <SelectTrigger id="priority-select" className="bg-gray-700 border-gray-600 text-white" data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" data-testid="option-priority-low-detail">Low</SelectItem>
                      <SelectItem value="medium" data-testid="option-priority-medium-detail">Medium</SelectItem>
                      <SelectItem value="high" data-testid="option-priority-high-detail">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ticket Info */}
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 font-medium" data-testid="label-subject-detail">Subject:</span>
                  <p className="text-white mt-1" data-testid="text-subject-detail">{ticketDetail.ticket.subject}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium" data-testid="label-description-detail">Description:</span>
                  <p className="text-gray-300 mt-1" data-testid="text-description-detail">
                    {ticketDetail.ticket.description}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span data-testid="text-category-detail">Category: {ticketDetail.ticket.category}</span>
                </div>
              </div>

              {/* Timeline */}
              {(ticketDetail.ticket.firstResponseAt || ticketDetail.ticket.resolvedAt) && (
                <div className="p-4 bg-gray-750 rounded-lg" data-testid="timeline">
                  <h4 className="font-semibold text-white mb-3" data-testid="heading-timeline">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    {ticketDetail.ticket.firstResponseAt && (
                      <div className="flex items-center text-gray-300" data-testid="timeline-first-response">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />
                        First Response: {format(new Date(ticketDetail.ticket.firstResponseAt), "MMM dd, yyyy HH:mm")}
                      </div>
                    )}
                    {ticketDetail.ticket.resolvedAt && (
                      <div className="flex items-center text-gray-300" data-testid="timeline-resolved">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-blue-400" />
                        Resolved: {format(new Date(ticketDetail.ticket.resolvedAt), "MMM dd, yyyy HH:mm")}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator className="bg-gray-700" />

              {/* Messages */}
              <div>
                <h3 className="font-semibold text-white mb-4" data-testid="heading-messages">
                  Messages ({ticketDetail.messages.length})
                </h3>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {ticketDetail.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg ${
                          message.isAdmin
                            ? "bg-blue-900/30 border border-blue-700"
                            : "bg-gray-750 border border-gray-600"
                        }`}
                        data-testid={`message-${message.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-white" data-testid={`message-author-${message.id}`}>
                            {message.isAdmin ? "Support Team (Admin)" : "Customer"}
                          </span>
                          <span className="text-xs text-gray-400" data-testid={`message-time-${message.id}`}>
                            {format(new Date(message.createdAt), "MMM dd, HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-200" data-testid={`message-body-${message.id}`}>{message.body}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Reply Form */}
              <div className="space-y-2">
                <Label htmlFor="admin-reply" className="text-gray-300" data-testid="label-admin-reply">
                  Admin Reply
                </Label>
                <Textarea
                  id="admin-reply"
                  data-testid="textarea-admin-reply"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your response to the customer..."
                  rows={4}
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                />
                <Button
                  onClick={handleAddMessage}
                  disabled={addMessageMutation.isPending || !replyMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-send-admin-message"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {addMessageMutation.isPending ? "Sending..." : "Send Reply"}
                </Button>
              </div>

              {/* Satisfaction Rating (if available) */}
              {ticketDetail.ticket.satisfactionScore && (
                <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg" data-testid="satisfaction-info">
                  <h4 className="font-semibold text-white mb-2" data-testid="heading-satisfaction">
                    Customer Satisfaction
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= (ticketDetail.ticket.satisfactionScore || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-500"
                        }`}
                        data-testid={`star-${star}`}
                      />
                    ))}
                    <span className="text-white ml-2" data-testid="text-satisfaction-score">
                      {ticketDetail.ticket.satisfactionScore}/5
                    </span>
                  </div>
                  {ticketDetail.ticket.satisfactionComment && (
                    <p className="text-sm text-gray-300" data-testid="text-satisfaction-comment">
                      "{ticketDetail.ticket.satisfactionComment}"
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
