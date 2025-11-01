'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Flag } from 'lucide-react';
import { format } from 'date-fns';

type FeatureFlag = {
  id: string;
  slug: string;
  scope: 'global' | 'page' | 'component';
  targetPath: string | null;
  status: 'enabled' | 'disabled' | 'coming_soon';
  rolloutType: 'all_users' | 'percentage' | 'beta_users' | null;
  rolloutConfig: any;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type InsertFeatureFlag = Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>;

export default function FeatureFlags() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);

  // Fetch all feature flags
  const { data: flags, isLoading } = useQuery<FeatureFlag[]>({
    queryKey: ['/api/admin/feature-flags'],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertFeatureFlag) => {
      return apiRequest('/api/admin/feature-flags', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-flags'] });
      setCreateDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Feature flag created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create feature flag',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { slug: string; updates: Partial<InsertFeatureFlag> }) => {
      return apiRequest(`/api/admin/feature-flags/${data.slug}`, {
        method: 'PATCH',
        body: JSON.stringify(data.updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-flags'] });
      setEditDialogOpen(false);
      setSelectedFlag(null);
      toast({
        title: 'Success',
        description: 'Feature flag updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update feature flag',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (slug: string) => {
      return apiRequest(`/api/admin/feature-flags/${slug}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-flags'] });
      toast({
        title: 'Success',
        description: 'Feature flag deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete feature flag',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: FeatureFlag['status']) => {
    const variants: Record<FeatureFlag['status'], 'default' | 'secondary' | 'destructive'> = {
      enabled: 'default',
      coming_soon: 'secondary',
      disabled: 'destructive',
    };
    return (
      <Badge variant={variants[status]} data-testid={`badge-status-${status}`}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Feature Flags
          </h2>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Manage feature rollouts and Coming Soon pages
          </p>
        </div>
        <CreateFlagDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading feature flags...</div>
        </div>
      ) : flags && flags.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slug</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Target Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flags.map((flag) => (
                <TableRow key={flag.id} data-testid={`row-flag-${flag.slug}`}>
                  <TableCell className="font-medium">{flag.slug}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{flag.scope}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {flag.targetPath || '—'}
                  </TableCell>
                  <TableCell>{getStatusBadge(flag.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(flag.updatedAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        value={flag.status}
                        onValueChange={(value: FeatureFlag['status']) => {
                          updateMutation.mutate({
                            slug: flag.slug,
                            updates: { status: value },
                          });
                        }}
                      >
                        <SelectTrigger
                          className="w-[140px]"
                          data-testid={`select-status-${flag.slug}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                          <SelectItem value="coming_soon">Coming Soon</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFlag(flag);
                          setEditDialogOpen(true);
                        }}
                        data-testid={`button-edit-${flag.slug}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete feature flag "${flag.slug}"?`)) {
                            deleteMutation.mutate(flag.slug);
                          }
                        }}
                        data-testid={`button-delete-${flag.slug}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border rounded-lg p-8 text-center">
          <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Feature Flags</h3>
          <p className="text-muted-foreground mb-4">
            Create your first feature flag to manage feature rollouts
          </p>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            data-testid="button-create-first-flag"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Feature Flag
          </Button>
        </div>
      )}

      {selectedFlag && (
        <EditFlagDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setSelectedFlag(null);
          }}
          flag={selectedFlag}
          onSubmit={(updates) => {
            updateMutation.mutate({
              slug: selectedFlag.slug,
              updates,
            });
          }}
          isPending={updateMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateFlagDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertFeatureFlag) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState<InsertFeatureFlag>({
    slug: '',
    scope: 'page',
    targetPath: '',
    status: 'coming_soon',
    rolloutType: null,
    rolloutConfig: null,
    seoTitle: '',
    seoDescription: '',
    ogImage: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      targetPath: formData.targetPath || null,
      seoTitle: formData.seoTitle || null,
      seoDescription: formData.seoDescription || null,
      ogImage: formData.ogImage || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-flag">
          <Plus className="w-4 h-4 mr-2" />
          Create Feature Flag
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Feature Flag</DialogTitle>
          <DialogDescription>
            Create a new feature flag to control feature rollouts and display Coming Soon pages
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="brokers-directory"
                required
                data-testid="input-slug"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scope">Scope *</Label>
              <Select
                value={formData.scope}
                onValueChange={(value: InsertFeatureFlag['scope']) =>
                  setFormData({ ...formData, scope: value })
                }
              >
                <SelectTrigger id="scope" data-testid="select-scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="page">Page</SelectItem>
                  <SelectItem value="component">Component</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetPath">Target Path</Label>
            <Input
              id="targetPath"
              value={formData.targetPath}
              onChange={(e) => setFormData({ ...formData, targetPath: e.target.value })}
              placeholder="/brokers"
              data-testid="input-targetPath"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: FeatureFlag['status']) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger id="status" data-testid="select-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="coming_soon">Coming Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input
              id="seoTitle"
              value={formData.seoTitle}
              onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
              placeholder="Feature Coming Soon | YoForex"
              data-testid="input-seoTitle"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seoDescription">SEO Description</Label>
            <Textarea
              id="seoDescription"
              value={formData.seoDescription}
              onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
              placeholder="Exciting new feature coming soon..."
              rows={3}
              data-testid="input-seoDescription"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogImage">OG Image URL</Label>
            <Input
              id="ogImage"
              value={formData.ogImage}
              onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
              placeholder="https://example.com/image.jpg"
              data-testid="input-ogImage"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-submit">
              {isPending ? 'Creating...' : 'Create Flag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditFlagDialog({
  open,
  onOpenChange,
  flag,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flag: FeatureFlag;
  onSubmit: (updates: Partial<InsertFeatureFlag>) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState({
    seoTitle: flag.seoTitle || '',
    seoDescription: flag.seoDescription || '',
    ogImage: flag.ogImage || '',
    targetPath: flag.targetPath || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      seoTitle: formData.seoTitle || null,
      seoDescription: formData.seoDescription || null,
      ogImage: formData.ogImage || null,
      targetPath: formData.targetPath || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Feature Flag: {flag.slug}</DialogTitle>
          <DialogDescription>Update SEO metadata and configuration</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-targetPath">Target Path</Label>
            <Input
              id="edit-targetPath"
              value={formData.targetPath}
              onChange={(e) => setFormData({ ...formData, targetPath: e.target.value })}
              placeholder="/brokers"
              data-testid="input-edit-targetPath"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-seoTitle">SEO Title</Label>
            <Input
              id="edit-seoTitle"
              value={formData.seoTitle}
              onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
              placeholder="Feature Coming Soon | YoForex"
              data-testid="input-edit-seoTitle"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-seoDescription">SEO Description</Label>
            <Textarea
              id="edit-seoDescription"
              value={formData.seoDescription}
              onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
              placeholder="Exciting new feature coming soon..."
              rows={3}
              data-testid="input-edit-seoDescription"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-ogImage">OG Image URL</Label>
            <Input
              id="edit-ogImage"
              value={formData.ogImage}
              onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
              placeholder="https://example.com/image.jpg"
              data-testid="input-edit-ogImage"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-edit-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-edit-submit">
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
