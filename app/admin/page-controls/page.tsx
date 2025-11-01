'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Power, PowerOff, Construction } from 'lucide-react';
import type { PageControl } from '@shared/schema';

export default function PageControlsAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingControl, setEditingControl] = useState<PageControl | null>(null);
  const [formData, setFormData] = useState({
    routePattern: '',
    status: 'live' as 'live' | 'coming_soon' | 'maintenance',
    title: '',
    message: '',
  });

  const { data: controls, isLoading } = useQuery<PageControl[]>({
    queryKey: ['/api/admin/page-controls'],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/page-controls', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/page-controls'] });
      toast({ title: 'Success', description: 'Page control created' });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PATCH', `/api/admin/page-controls/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/page-controls'] });
      toast({ title: 'Success', description: 'Page control updated' });
      setDialogOpen(false);
      setEditingControl(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/page-controls/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/page-controls'] });
      toast({ title: 'Success', description: 'Page control deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      routePattern: '',
      status: 'live',
      title: '',
      message: '',
    });
  };

  const handleEdit = (control: PageControl) => {
    setEditingControl(control);
    setFormData({
      routePattern: control.routePattern,
      status: control.status,
      title: control.title || '',
      message: control.message || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingControl) {
      updateMutation.mutate({ id: editingControl.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live': return <Power className="h-4 w-4" />;
      case 'coming_soon': return <Construction className="h-4 w-4" />;
      case 'maintenance': return <PowerOff className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      live: 'default',
      coming_soon: 'secondary',
      maintenance: 'destructive',
    };
    return variants[status] || 'default';
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Page Availability Controls</h1>
          <p className="text-muted-foreground mt-1">
            Manage which pages are live, coming soon, or under maintenance
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingControl(null); resetForm(); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Control
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingControl ? 'Edit Page Control' : 'Create Page Control'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="routePattern">Route Pattern</Label>
                <Input
                  id="routePattern"
                  placeholder="/marketplace, /admin/*, /discussions*"
                  value={formData.routePattern}
                  onChange={(e) => setFormData({ ...formData, routePattern: e.target.value })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Use /* for wildcards (e.g., /admin/*) or * for prefix (e.g., /discussions*)
                </p>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Live (ON)</SelectItem>
                    <SelectItem value="coming_soon">Coming Soon</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="e.g., Marketplace Coming Soon"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Custom message for users..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.routePattern}>
                {editingControl ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {controls && controls.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No page controls configured. Click "Add Control" to create one.
            </CardContent>
          </Card>
        )}

        {controls?.map((control) => (
          <Card key={control.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg font-mono">{control.routePattern}</CardTitle>
                    <Badge variant={getStatusBadge(control.status)} className="gap-1">
                      {getStatusIcon(control.status)}
                      {control.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  {control.title && (
                    <CardDescription className="mt-2 font-medium">{control.title}</CardDescription>
                  )}
                  {control.message && (
                    <CardDescription className="mt-1">{control.message}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(control)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => deleteMutation.mutate(control.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
