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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash, Send, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Announcement = {
  id: number;
  title: string;
  content: string;
  type: "banner" | "modal" | "toast";
  audience: any;
  status: "draft" | "scheduled" | "active" | "expired";
  scheduledAt: string | null;
  expiresAt: string | null;
  views: number;
  clicks: number;
  createdBy: string;
  createdAt: string;
};

type EmailCampaign = {
  id: number;
  name: string;
  subject: string;
  htmlContent: string;
  audience: any;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  scheduledAt: string | null;
  sentAt: string | null;
  totalRecipients: number;
  opens: number;
  clicks: number;
  createdBy: string;
  createdAt: string;
};

export default function CommunicationsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("announcements");
  
  // Announcements state
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<number | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    type: "banner" as "banner" | "modal" | "toast",
    audience: {},
    scheduledAt: "",
    expiresAt: "",
  });

  // Campaigns state
  const [campaignDialog, setCampaignDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [deleteCampaignId, setDeleteCampaignId] = useState<number | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    subject: "",
    htmlContent: "",
    audience: {},
    scheduledAt: "",
  });

  // Fetch announcements with 10s auto-refresh
  const { data: announcements = [], isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/communications/announcements"],
    refetchInterval: 10000,
  });

  // Fetch campaigns with 10s auto-refresh
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<EmailCampaign[]>({
    queryKey: ["/api/admin/communications/campaigns"],
    refetchInterval: 10000,
  });

  // Announcements mutations
  const createAnnouncementMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/communications/announcements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/communications/announcements"] });
      setAnnouncementDialog(false);
      resetAnnouncementForm();
      toast({ title: "Announcement created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create announcement", variant: "destructive" });
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PUT", `/api/admin/communications/announcements/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/communications/announcements"] });
      setAnnouncementDialog(false);
      setEditingAnnouncement(null);
      resetAnnouncementForm();
      toast({ title: "Announcement updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update announcement", variant: "destructive" });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/admin/communications/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/communications/announcements"] });
      setDeleteAnnouncementId(null);
      toast({ title: "Announcement deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete announcement", variant: "destructive" });
    },
  });

  const publishAnnouncementMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("POST", `/api/admin/communications/announcements/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/communications/announcements"] });
      toast({ title: "Announcement published successfully" });
    },
    onError: () => {
      toast({ title: "Failed to publish announcement", variant: "destructive" });
    },
  });

  // Campaigns mutations
  const createCampaignMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/admin/communications/campaigns", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/communications/campaigns"] });
      setCampaignDialog(false);
      resetCampaignForm();
      toast({ title: "Campaign created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create campaign", variant: "destructive" });
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PUT", `/api/admin/communications/campaigns/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/communications/campaigns"] });
      setCampaignDialog(false);
      setEditingCampaign(null);
      resetCampaignForm();
      toast({ title: "Campaign updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update campaign", variant: "destructive" });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/admin/communications/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/communications/campaigns"] });
      setDeleteCampaignId(null);
      toast({ title: "Campaign deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete campaign", variant: "destructive" });
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("POST", `/api/admin/communications/campaigns/${id}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/communications/campaigns"] });
      toast({ title: "Campaign sent successfully" });
    },
    onError: () => {
      toast({ title: "Failed to send campaign", variant: "destructive" });
    },
  });

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      title: "",
      content: "",
      type: "banner",
      audience: {},
      scheduledAt: "",
      expiresAt: "",
    });
  };

  const resetCampaignForm = () => {
    setCampaignForm({
      name: "",
      subject: "",
      htmlContent: "",
      audience: {},
      scheduledAt: "",
    });
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      audience: announcement.audience || {},
      scheduledAt: announcement.scheduledAt || "",
      expiresAt: announcement.expiresAt || "",
    });
    setAnnouncementDialog(true);
  };

  const handleEditCampaign = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      subject: campaign.subject,
      htmlContent: campaign.htmlContent,
      audience: campaign.audience || {},
      scheduledAt: campaign.scheduledAt || "",
    });
    setCampaignDialog(true);
  };

  const handleSaveAnnouncement = () => {
    if (editingAnnouncement) {
      updateAnnouncementMutation.mutate({
        id: editingAnnouncement.id,
        data: announcementForm,
      });
    } else {
      createAnnouncementMutation.mutate(announcementForm);
    }
  };

  const handleSaveCampaign = () => {
    if (editingCampaign) {
      updateCampaignMutation.mutate({
        id: editingCampaign.id,
        data: campaignForm,
      });
    } else {
      createCampaignMutation.mutate(campaignForm);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Communications Management
          </h1>
          <p className="text-gray-400 mt-2" data-testid="text-page-description">
            Manage announcements and email campaigns
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-gray-800 mb-6" data-testid="tabs-list">
            <TabsTrigger value="announcements" className="data-[state=active]:bg-gray-700" data-testid="tab-announcements">
              Announcements
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-gray-700" data-testid="tab-campaigns">
              Email Campaigns
            </TabsTrigger>
          </TabsList>

          {/* Announcements Tab */}
          <TabsContent value="announcements" data-testid="tab-content-announcements">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold" data-testid="text-announcements-title">
                  Announcements
                </h2>
                <Dialog open={announcementDialog} onOpenChange={(open) => {
                  setAnnouncementDialog(open);
                  if (!open) {
                    setEditingAnnouncement(null);
                    resetAnnouncementForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-create-announcement">
                      <Plus className="mr-2 h-4 w-4" /> Create Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 text-white max-w-2xl" data-testid="dialog-announcement">
                    <DialogHeader>
                      <DialogTitle data-testid="text-dialog-title">
                        {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title" data-testid="label-title">Title</Label>
                        <Input
                          id="title"
                          value={announcementForm.title}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                          data-testid="input-announcement-title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="content" data-testid="label-content">Content</Label>
                        <Textarea
                          id="content"
                          value={announcementForm.content}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                          data-testid="input-announcement-content"
                        />
                      </div>
                      <div>
                        <Label htmlFor="type" data-testid="label-type">Type</Label>
                        <Select
                          value={announcementForm.type}
                          onValueChange={(value) => setAnnouncementForm({ ...announcementForm, type: value as any })}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-announcement-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 text-white">
                            <SelectItem value="banner" data-testid="option-type-banner">Banner</SelectItem>
                            <SelectItem value="modal" data-testid="option-type-modal">Modal</SelectItem>
                            <SelectItem value="toast" data-testid="option-type-toast">Toast</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="scheduledAt" data-testid="label-scheduled-at">Scheduled At (optional)</Label>
                        <Input
                          id="scheduledAt"
                          type="datetime-local"
                          value={announcementForm.scheduledAt}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, scheduledAt: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                          data-testid="input-announcement-scheduled-at"
                        />
                      </div>
                      <div>
                        <Label htmlFor="expiresAt" data-testid="label-expires-at">Expires At (optional)</Label>
                        <Input
                          id="expiresAt"
                          type="datetime-local"
                          value={announcementForm.expiresAt}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, expiresAt: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                          data-testid="input-announcement-expires-at"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleSaveAnnouncement}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={!announcementForm.title || !announcementForm.content}
                        data-testid="button-save-announcement"
                      >
                        {editingAnnouncement ? "Update" : "Create"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {announcementsLoading ? (
                <div className="text-center py-8" data-testid="text-loading">Loading announcements...</div>
              ) : (
                <Table data-testid="table-announcements">
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-700">
                      <TableHead className="text-gray-400">Title</TableHead>
                      <TableHead className="text-gray-400">Type</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Views</TableHead>
                      <TableHead className="text-gray-400">Clicks</TableHead>
                      <TableHead className="text-gray-400">Created</TableHead>
                      <TableHead className="text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcements.map((announcement) => (
                      <TableRow key={announcement.id} className="border-gray-700 hover:bg-gray-700" data-testid={`row-announcement-${announcement.id}`}>
                        <TableCell className="font-medium" data-testid={`text-title-${announcement.id}`}>{announcement.title}</TableCell>
                        <TableCell data-testid={`text-type-${announcement.id}`}>{announcement.type}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              announcement.status === "active"
                                ? "bg-green-900 text-green-300"
                                : announcement.status === "draft"
                                ? "bg-gray-600 text-gray-300"
                                : announcement.status === "scheduled"
                                ? "bg-yellow-900 text-yellow-300"
                                : "bg-red-900 text-red-300"
                            }`}
                            data-testid={`text-status-${announcement.id}`}
                          >
                            {announcement.status}
                          </span>
                        </TableCell>
                        <TableCell data-testid={`text-views-${announcement.id}`}>{announcement.views}</TableCell>
                        <TableCell data-testid={`text-clicks-${announcement.id}`}>{announcement.clicks}</TableCell>
                        <TableCell data-testid={`text-created-${announcement.id}`}>
                          {format(new Date(announcement.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {announcement.status === "draft" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => publishAnnouncementMutation.mutate(announcement.id)}
                                className="text-green-400 hover:text-green-300 hover:bg-gray-600"
                                data-testid={`button-publish-${announcement.id}`}
                              >
                                <Megaphone className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditAnnouncement(announcement)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-gray-600"
                              data-testid={`button-edit-${announcement.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteAnnouncementId(announcement.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-gray-600"
                              data-testid={`button-delete-${announcement.id}`}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Email Campaigns Tab */}
          <TabsContent value="campaigns" data-testid="tab-content-campaigns">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold" data-testid="text-campaigns-title">
                  Email Campaigns
                </h2>
                <Dialog open={campaignDialog} onOpenChange={(open) => {
                  setCampaignDialog(open);
                  if (!open) {
                    setEditingCampaign(null);
                    resetCampaignForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-create-campaign">
                      <Plus className="mr-2 h-4 w-4" /> New Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 text-white max-w-2xl" data-testid="dialog-campaign">
                    <DialogHeader>
                      <DialogTitle data-testid="text-campaign-dialog-title">
                        {editingCampaign ? "Edit Campaign" : "New Campaign"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name" data-testid="label-campaign-name">Campaign Name</Label>
                        <Input
                          id="name"
                          value={campaignForm.name}
                          onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                          data-testid="input-campaign-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject" data-testid="label-campaign-subject">Email Subject</Label>
                        <Input
                          id="subject"
                          value={campaignForm.subject}
                          onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                          data-testid="input-campaign-subject"
                        />
                      </div>
                      <div>
                        <Label htmlFor="htmlContent" data-testid="label-campaign-html">HTML Content</Label>
                        <Textarea
                          id="htmlContent"
                          value={campaignForm.htmlContent}
                          onChange={(e) => setCampaignForm({ ...campaignForm, htmlContent: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white min-h-[200px] font-mono text-sm"
                          data-testid="input-campaign-html"
                        />
                      </div>
                      <div>
                        <Label htmlFor="campaignScheduledAt" data-testid="label-campaign-scheduled-at">Scheduled At (optional)</Label>
                        <Input
                          id="campaignScheduledAt"
                          type="datetime-local"
                          value={campaignForm.scheduledAt}
                          onChange={(e) => setCampaignForm({ ...campaignForm, scheduledAt: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                          data-testid="input-campaign-scheduled-at"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleSaveCampaign}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={!campaignForm.name || !campaignForm.subject || !campaignForm.htmlContent}
                        data-testid="button-save-campaign"
                      >
                        {editingCampaign ? "Update" : "Create"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {campaignsLoading ? (
                <div className="text-center py-8" data-testid="text-campaigns-loading">Loading campaigns...</div>
              ) : (
                <Table data-testid="table-campaigns">
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-700">
                      <TableHead className="text-gray-400">Name</TableHead>
                      <TableHead className="text-gray-400">Subject</TableHead>
                      <TableHead className="text-gray-400">Recipients</TableHead>
                      <TableHead className="text-gray-400">Opens</TableHead>
                      <TableHead className="text-gray-400">Clicks</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Created</TableHead>
                      <TableHead className="text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id} className="border-gray-700 hover:bg-gray-700" data-testid={`row-campaign-${campaign.id}`}>
                        <TableCell className="font-medium" data-testid={`text-campaign-name-${campaign.id}`}>{campaign.name}</TableCell>
                        <TableCell data-testid={`text-campaign-subject-${campaign.id}`}>{campaign.subject}</TableCell>
                        <TableCell data-testid={`text-campaign-recipients-${campaign.id}`}>{campaign.totalRecipients}</TableCell>
                        <TableCell data-testid={`text-campaign-opens-${campaign.id}`}>{campaign.opens}</TableCell>
                        <TableCell data-testid={`text-campaign-clicks-${campaign.id}`}>{campaign.clicks}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              campaign.status === "sent"
                                ? "bg-green-900 text-green-300"
                                : campaign.status === "draft"
                                ? "bg-gray-600 text-gray-300"
                                : campaign.status === "sending"
                                ? "bg-blue-900 text-blue-300"
                                : campaign.status === "scheduled"
                                ? "bg-yellow-900 text-yellow-300"
                                : "bg-red-900 text-red-300"
                            }`}
                            data-testid={`text-campaign-status-${campaign.id}`}
                          >
                            {campaign.status}
                          </span>
                        </TableCell>
                        <TableCell data-testid={`text-campaign-created-${campaign.id}`}>
                          {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {campaign.status === "draft" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => sendCampaignMutation.mutate(campaign.id)}
                                className="text-green-400 hover:text-green-300 hover:bg-gray-600"
                                data-testid={`button-send-${campaign.id}`}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditCampaign(campaign)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-gray-600"
                              data-testid={`button-edit-campaign-${campaign.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteCampaignId(campaign.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-gray-600"
                              data-testid={`button-delete-campaign-${campaign.id}`}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Delete Announcement Confirmation Dialog */}
        <AlertDialog open={deleteAnnouncementId !== null} onOpenChange={() => setDeleteAnnouncementId(null)}>
          <AlertDialogContent className="bg-gray-800 text-white" data-testid="dialog-delete-announcement">
            <AlertDialogHeader>
              <AlertDialogTitle data-testid="text-delete-announcement-title">Delete Announcement?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400" data-testid="text-delete-announcement-description">
                This action cannot be undone. This will permanently delete the announcement.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600" data-testid="button-cancel-delete-announcement">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteAnnouncementId && deleteAnnouncementMutation.mutate(deleteAnnouncementId)}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-confirm-delete-announcement"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Campaign Confirmation Dialog */}
        <AlertDialog open={deleteCampaignId !== null} onOpenChange={() => setDeleteCampaignId(null)}>
          <AlertDialogContent className="bg-gray-800 text-white" data-testid="dialog-delete-campaign">
            <AlertDialogHeader>
              <AlertDialogTitle data-testid="text-delete-campaign-title">Delete Campaign?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400" data-testid="text-delete-campaign-description">
                This action cannot be undone. This will permanently delete the campaign.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600" data-testid="button-cancel-delete-campaign">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteCampaignId && deleteCampaignMutation.mutate(deleteCampaignId)}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-confirm-delete-campaign"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
