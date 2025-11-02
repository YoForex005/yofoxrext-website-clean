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
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageCircle, Clock, Star, CheckCircle, AlertCircle } from "lucide-react";
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

export default function SupportPage() {
  const { toast } = useToast();
  const [createDialog, setCreateDialog] = useState(false);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [satisfactionDialog, setSatisfactionDialog] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const [newTicketForm, setNewTicketForm] = useState({
    subject: "",
    description: "",
    category: "general" as "technical" | "billing" | "general" | "account" | "other",
  });

  const [replyMessage, setReplyMessage] = useState("");
  const [satisfactionForm, setSatisfactionForm] = useState({
    score: 5,
    comment: "",
  });

  // Fetch user's tickets with 10s auto-refresh
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support/tickets"],
    refetchInterval: 10000,
  });

  // Fetch selected ticket details
  const { data: ticketDetail, isLoading: detailLoading } = useQuery<TicketWithMessages>({
    queryKey: ["/api/support/tickets", selectedTicketId],
    enabled: selectedTicketId !== null,
    refetchInterval: 10000,
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: (data: typeof newTicketForm) => apiRequest("POST", "/api/support/tickets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      setCreateDialog(false);
      setNewTicketForm({ subject: "", description: "", category: "general" });
      toast({ title: "Success", description: "Ticket created successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: ({ ticketId, body }: { ticketId: number; body: string }) =>
      apiRequest("POST", `/api/support/tickets/${ticketId}/messages`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      setReplyMessage("");
      toast({ title: "Success", description: "Message sent!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Submit satisfaction mutation
  const submitSatisfactionMutation = useMutation({
    mutationFn: ({ ticketId, score, comment }: { ticketId: number; score: number; comment?: string }) =>
      apiRequest("POST", `/api/support/tickets/${ticketId}/satisfaction`, { score, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      setSatisfactionDialog(false);
      setSatisfactionForm({ score: 5, comment: "" });
      toast({ title: "Thank you!", description: "Your feedback has been submitted." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateTicket = () => {
    if (!newTicketForm.subject || !newTicketForm.description) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    createTicketMutation.mutate(newTicketForm);
  };

  const handleAddMessage = () => {
    if (!selectedTicketId || !replyMessage.trim()) {
      toast({ title: "Error", description: "Please enter a message", variant: "destructive" });
      return;
    }
    addMessageMutation.mutate({ ticketId: selectedTicketId, body: replyMessage });
  };

  const handleSubmitSatisfaction = () => {
    if (!selectedTicketId) return;
    submitSatisfactionMutation.mutate({
      ticketId: selectedTicketId,
      score: satisfactionForm.score,
      comment: satisfactionForm.comment || undefined,
    });
  };

  const openTicketDetail = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setDetailDrawer(true);
  };

  const showSatisfactionDialog = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setSatisfactionDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "default",
      in_progress: "secondary",
      closed: "outline",
    };
    return <Badge variant={variants[status] || "default"} data-testid={`badge-status-${status}`}>{status.replace("_", " ")}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={colors[priority] || ""} data-testid={`badge-priority-${priority}`}>
        {priority}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-support">Support & Tickets</h1>
          <p className="text-muted-foreground" data-testid="text-support-description">
            Create and manage your support tickets
          </p>
        </div>
        <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-ticket">
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-create-ticket">
            <DialogHeader>
              <DialogTitle data-testid="heading-create-ticket">Create Support Ticket</DialogTitle>
              <DialogDescription>
                Submit a support request and we'll get back to you as soon as possible.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject" data-testid="label-subject">Subject</Label>
                <Input
                  id="subject"
                  data-testid="input-subject"
                  value={newTicketForm.subject}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                  placeholder="Brief description of the issue"
                />
              </div>
              <div>
                <Label htmlFor="category" data-testid="label-category">Category</Label>
                <Select
                  value={newTicketForm.category}
                  onValueChange={(value: any) => setNewTicketForm({ ...newTicketForm, category: value })}
                >
                  <SelectTrigger id="category" data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical" data-testid="option-category-technical">Technical</SelectItem>
                    <SelectItem value="billing" data-testid="option-category-billing">Billing</SelectItem>
                    <SelectItem value="general" data-testid="option-category-general">General</SelectItem>
                    <SelectItem value="account" data-testid="option-category-account">Account</SelectItem>
                    <SelectItem value="other" data-testid="option-category-other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description" data-testid="label-description">Description</Label>
                <Textarea
                  id="description"
                  data-testid="textarea-description"
                  value={newTicketForm.description}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                  placeholder="Provide detailed information about your issue"
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateTicket}
                disabled={createTicketMutation.isPending}
                data-testid="button-submit-ticket"
              >
                {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {ticketsLoading ? (
        <div className="text-center py-12" data-testid="loading-tickets">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2" data-testid="text-no-tickets">No tickets yet</h3>
            <p className="text-muted-foreground mb-4" data-testid="text-no-tickets-description">
              Create your first support ticket to get help
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openTicketDetail(ticket.id)}
              data-testid={`card-ticket-${ticket.id}`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg" data-testid={`text-ticket-number-${ticket.id}`}>
                        {ticket.ticketNumber}
                      </CardTitle>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <CardDescription data-testid={`text-subject-${ticket.id}`}>
                      {ticket.subject}
                    </CardDescription>
                  </div>
                  {ticket.status === "closed" && !ticket.satisfactionScore && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        showSatisfactionDialog(ticket.id);
                      }}
                      data-testid={`button-rate-ticket-${ticket.id}`}
                    >
                      <Star className="mr-1 h-4 w-4" />
                      Rate
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground space-x-4">
                  <div className="flex items-center" data-testid={`text-category-${ticket.id}`}>
                    <span className="font-medium">Category:</span>
                    <span className="ml-1">{ticket.category}</span>
                  </div>
                  <div className="flex items-center" data-testid={`text-created-${ticket.id}`}>
                    <Clock className="mr-1 h-4 w-4" />
                    {format(new Date(ticket.createdAt), "MMM dd, yyyy")}
                  </div>
                  {ticket.lastMessageAt && (
                    <div className="flex items-center" data-testid={`text-last-message-${ticket.id}`}>
                      <MessageCircle className="mr-1 h-4 w-4" />
                      Last message: {format(new Date(ticket.lastMessageAt), "MMM dd, HH:mm")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ticket Detail Drawer */}
      <Sheet open={detailDrawer} onOpenChange={setDetailDrawer}>
        <SheetContent className="w-full sm:max-w-2xl" data-testid="drawer-ticket-detail">
          <SheetHeader>
            <SheetTitle data-testid="heading-ticket-detail">
              {ticketDetail?.ticket.ticketNumber || "Ticket Details"}
            </SheetTitle>
            <SheetDescription>
              View ticket information and messages
            </SheetDescription>
          </SheetHeader>

          {detailLoading ? (
            <div className="text-center py-8" data-testid="loading-ticket-detail">Loading...</div>
          ) : ticketDetail ? (
            <div className="mt-6 space-y-6">
              {/* Ticket Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium" data-testid="label-status">Status:</span>
                  {getStatusBadge(ticketDetail.ticket.status)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium" data-testid="label-priority">Priority:</span>
                  {getPriorityBadge(ticketDetail.ticket.priority)}
                </div>
                <div>
                  <span className="font-medium" data-testid="label-subject-detail">Subject:</span>
                  <p className="mt-1" data-testid="text-subject-detail">{ticketDetail.ticket.subject}</p>
                </div>
                <div>
                  <span className="font-medium" data-testid="label-description-detail">Description:</span>
                  <p className="mt-1 text-sm text-muted-foreground" data-testid="text-description-detail">
                    {ticketDetail.ticket.description}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground" data-testid="text-created-detail">
                  Created: {format(new Date(ticketDetail.ticket.createdAt), "MMM dd, yyyy HH:mm")}
                </div>
              </div>

              <Separator />

              {/* Messages */}
              <div>
                <h3 className="font-semibold mb-4" data-testid="heading-messages">Messages</h3>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {ticketDetail.messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg ${
                          message.isAdmin
                            ? "bg-blue-50 border border-blue-200"
                            : "bg-gray-50 border border-gray-200"
                        }`}
                        data-testid={`message-${message.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm" data-testid={`message-author-${message.id}`}>
                            {message.isAdmin ? "Support Team" : "You"}
                          </span>
                          <span className="text-xs text-muted-foreground" data-testid={`message-time-${message.id}`}>
                            {format(new Date(message.createdAt), "MMM dd, HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm" data-testid={`message-body-${message.id}`}>{message.body}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Reply Form (only if ticket is not closed) */}
              {ticketDetail.ticket.status !== "closed" && (
                <div className="space-y-2">
                  <Label htmlFor="reply" data-testid="label-reply">Your Reply</Label>
                  <Textarea
                    id="reply"
                    data-testid="textarea-reply"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={3}
                  />
                  <Button
                    onClick={handleAddMessage}
                    disabled={addMessageMutation.isPending || !replyMessage.trim()}
                    data-testid="button-send-message"
                  >
                    {addMessageMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              )}

              {/* Satisfaction Info (if rated) */}
              {ticketDetail.ticket.status === "closed" && ticketDetail.ticket.satisfactionScore && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4" data-testid="satisfaction-info">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium" data-testid="text-satisfaction-label">Your Feedback</span>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= (ticketDetail.ticket.satisfactionScore || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                        data-testid={`star-${star}`}
                      />
                    ))}
                    <span className="ml-2 text-sm" data-testid="text-satisfaction-score">
                      {ticketDetail.ticket.satisfactionScore}/5
                    </span>
                  </div>
                  {ticketDetail.ticket.satisfactionComment && (
                    <p className="text-sm text-muted-foreground mt-2" data-testid="text-satisfaction-comment">
                      {ticketDetail.ticket.satisfactionComment}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Satisfaction Dialog */}
      <Dialog open={satisfactionDialog} onOpenChange={setSatisfactionDialog}>
        <DialogContent data-testid="dialog-satisfaction">
          <DialogHeader>
            <DialogTitle data-testid="heading-satisfaction">Rate Your Experience</DialogTitle>
            <DialogDescription>
              How satisfied were you with the support you received?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setSatisfactionForm({ ...satisfactionForm, score: rating })}
                  className="focus:outline-none"
                  data-testid={`button-rating-${rating}`}
                >
                  <Star
                    className={`h-8 w-8 cursor-pointer transition-colors ${
                      rating <= satisfactionForm.score
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div>
              <Label htmlFor="feedback-comment" data-testid="label-feedback-comment">
                Additional Comments (Optional)
              </Label>
              <Textarea
                id="feedback-comment"
                data-testid="textarea-feedback-comment"
                value={satisfactionForm.comment}
                onChange={(e) => setSatisfactionForm({ ...satisfactionForm, comment: e.target.value })}
                placeholder="Tell us more about your experience..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSatisfactionDialog(false)}
              data-testid="button-cancel-satisfaction"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitSatisfaction}
              disabled={submitSatisfactionMutation.isPending}
              data-testid="button-submit-satisfaction"
            >
              {submitSatisfactionMutation.isPending ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
