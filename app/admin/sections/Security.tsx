"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Shield, Activity, Clock, AlertTriangle } from "lucide-react";

interface SecurityEvent {
  id: number;
  type: 'login_failed' | 'api_rate_limit' | 'suspicious_ip' | 'login_bruteforce' | 'api_abuse';
  severity: 'low' | 'medium' | 'high';
  description: string | null;
  ipAddress: string | null;
  userId: string | null;
  status: 'open' | 'resolved';
  createdAt: string;
}

interface IPBan {
  id: number;
  ipAddress: string;
  reason: string | null;
  bannedBy: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface SecurityMetrics {
  totalEvents: number;
  eventsToday: number;
  blockedIps: number;
  uptime: number;
}

export default function Security() {
  const [activeTab, setActiveTab] = useState("security-events");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newBanIp, setNewBanIp] = useState("");
  const [newBanReason, setNewBanReason] = useState("");
  const [newBanHours, setNewBanHours] = useState("");
  const { toast } = useToast();

  const { data: securityEventsRaw, isLoading: eventsLoading, isError: eventsError, error: eventsErrorData } = useQuery<SecurityEvent[]>({
    queryKey: ["/api/admin/security/events", { type: typeFilter !== "all" ? typeFilter : undefined, severity: severityFilter !== "all" ? severityFilter : undefined, status: statusFilter !== "all" ? statusFilter : undefined }],
    refetchInterval: 10000,
  });

  const securityEvents: SecurityEvent[] = Array.isArray(securityEventsRaw) ? securityEventsRaw : [];

  const { data: ipBansRaw, isLoading: bansLoading, isError: bansError, error: bansErrorData } = useQuery<IPBan[]>({
    queryKey: ["/api/admin/security/ip-bans"],
    refetchInterval: 10000,
  });

  const ipBans: IPBan[] = Array.isArray(ipBansRaw) ? ipBansRaw : [];

  const { data: metricsRaw, isLoading: metricsLoading, isError: metricsError, error: metricsErrorData } = useQuery<SecurityMetrics>({
    queryKey: ["/api/admin/security/metrics"],
    refetchInterval: 10000,
  });

  const securityMetrics: SecurityMetrics = metricsRaw || {
    totalEvents: 0,
    eventsToday: 0,
    blockedIps: 0,
    uptime: 0
  };

  const addIPBanMutation = useMutation({
    mutationFn: async (data: { ipAddress: string; reason: string; hours?: number }) => {
      return apiRequest("POST", "/api/admin/security/ban", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/ip-bans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/metrics"] });
      toast({ title: "IP banned successfully" });
      setNewBanIp("");
      setNewBanReason("");
      setNewBanHours("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to ban IP", 
        description: error?.message || "An error occurred",
        variant: "destructive" 
      });
    }
  });

  const unbanIPMutation = useMutation({
    mutationFn: async (ipAddress: string) => {
      return apiRequest("DELETE", `/api/admin/security/unban/${ipAddress}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/ip-bans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/metrics"] });
      toast({ title: "IP unbanned successfully" });
    },
    onError: () => {
      toast({ title: "Failed to unban IP", variant: "destructive" });
    }
  });

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    
    return parts.join(', ');
  };

  const validateIpAddress = (ip: string): boolean => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  };

  const handleAddBan = () => {
    if (!newBanIp.trim()) {
      toast({ title: "IP address is required", variant: "destructive" });
      return;
    }

    if (!validateIpAddress(newBanIp)) {
      toast({ title: "Invalid IP address format", variant: "destructive" });
      return;
    }

    if (!newBanReason.trim()) {
      toast({ title: "Reason is required", variant: "destructive" });
      return;
    }

    if (newBanReason.length > 500) {
      toast({ title: "Reason must be 500 characters or less", variant: "destructive" });
      return;
    }

    const hours = newBanHours ? parseInt(newBanHours) : undefined;
    if (hours !== undefined && (isNaN(hours) || hours < 1 || hours > 8760)) {
      toast({ title: "Hours must be between 1 and 8760", variant: "destructive" });
      return;
    }

    addIPBanMutation.mutate({
      ipAddress: newBanIp,
      reason: newBanReason,
      hours
    });
  };

  const isActiveBan = (ban: IPBan): boolean => {
    if (!ban.expiresAt) return true;
    return new Date(ban.expiresAt) > new Date();
  };

  const activeBans = ipBans.filter(isActiveBan);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Security & Safety</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-security">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="security-events" data-testid="tab-security-events">Security Events</TabsTrigger>
          <TabsTrigger value="ip-bans" data-testid="tab-ip-bans">IP Bans</TabsTrigger>
          <TabsTrigger value="metrics" data-testid="tab-performance">Security Metrics</TabsTrigger>
        </TabsList>

        {/* Security Events Tab */}
        <TabsContent value="security-events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-type-filter">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="login_failed">Login Failed</SelectItem>
                    <SelectItem value="login_bruteforce">Login Bruteforce</SelectItem>
                    <SelectItem value="api_rate_limit">API Rate Limit</SelectItem>
                    <SelectItem value="api_abuse">API Abuse</SelectItem>
                    <SelectItem value="suspicious_ip">Suspicious IP</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-severity-filter">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-resolved-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {eventsLoading ? (
            <Skeleton className="h-96" />
          ) : eventsError ? (
            <Alert variant="destructive" data-testid="alert-events-error">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error loading security events</AlertTitle>
              <AlertDescription>
                {(eventsErrorData as any)?.message || "Failed to load security events. Please try again."}
              </AlertDescription>
            </Alert>
          ) : (
            <Card data-testid="card-security-events">
              <CardHeader>
                <CardTitle>Security Events ({securityEvents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {securityEvents.length > 0 ? (
                        securityEvents.map((event) => (
                          <TableRow key={event.id} data-testid={`event-${event.id}`}>
                            <TableCell>
                              {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>{event.type.replace(/_/g, ' ')}</TableCell>
                            <TableCell>
                              <Badge variant={getSeverityVariant(event.severity)}>
                                {event.severity}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {event.description || '-'}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {event.ipAddress || '-'}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {event.userId || 'System'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={event.status === 'resolved' ? 'secondary' : 'default'}>
                                {event.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No security events found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* IP Bans Tab */}
        <TabsContent value="ip-bans" className="space-y-4">
          <Card data-testid="card-add-ip-ban">
            <CardHeader>
              <CardTitle>Add IP Ban</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ban-ip-address">IP Address *</Label>
                  <Input
                    id="ban-ip-address"
                    placeholder="e.g., 192.168.1.1 or 2001:db8::1"
                    value={newBanIp}
                    onChange={(e) => setNewBanIp(e.target.value)}
                    data-testid="input-ban-ip-address"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ban-reason">Reason *</Label>
                  <Input
                    id="ban-reason"
                    placeholder="Enter reason for ban (max 500 characters)"
                    value={newBanReason}
                    onChange={(e) => setNewBanReason(e.target.value)}
                    maxLength={500}
                    data-testid="input-ban-reason"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ban-hours">Duration (hours, optional)</Label>
                  <Input
                    id="ban-hours"
                    type="number"
                    placeholder="Leave empty for permanent ban"
                    value={newBanHours}
                    onChange={(e) => setNewBanHours(e.target.value)}
                    min="1"
                    max="8760"
                    data-testid="input-ban-hours"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter 1-8760 hours for temporary ban, or leave empty for permanent
                  </p>
                </div>
                <Button
                  onClick={handleAddBan}
                  disabled={addIPBanMutation.isPending}
                  data-testid="button-add-ban"
                >
                  {addIPBanMutation.isPending ? "Banning..." : "Add Ban"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {bansLoading ? (
            <Skeleton className="h-64" />
          ) : bansError ? (
            <Alert variant="destructive" data-testid="alert-bans-error">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error loading IP bans</AlertTitle>
              <AlertDescription>
                {(bansErrorData as any)?.message || "Failed to load IP bans. Please try again."}
              </AlertDescription>
            </Alert>
          ) : (
            <Card data-testid="card-ip-bans-list">
              <CardHeader>
                <CardTitle>IP Bans ({activeBans.length} active)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Banned By</TableHead>
                        <TableHead>Banned At</TableHead>
                        <TableHead>Expires At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ipBans.length > 0 ? (
                        ipBans.map((ban) => {
                          const active = isActiveBan(ban);
                          return (
                            <TableRow key={ban.id} data-testid={`ban-${ban.id}`} className={!active ? 'opacity-50' : ''}>
                              <TableCell className="font-mono text-sm">{ban.ipAddress}</TableCell>
                              <TableCell className="max-w-xs truncate">{ban.reason || '-'}</TableCell>
                              <TableCell className="font-mono text-sm">{ban.bannedBy || 'System'}</TableCell>
                              <TableCell>
                                {formatDistanceToNow(new Date(ban.createdAt), { addSuffix: true })}
                              </TableCell>
                              <TableCell>
                                {ban.expiresAt ? (
                                  <span className="text-sm">
                                    {formatDistanceToNow(new Date(ban.expiresAt), { addSuffix: true })}
                                  </span>
                                ) : (
                                  <Badge variant="secondary">Permanent</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {active && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => unbanIPMutation.mutate(ban.ipAddress)}
                                    disabled={unbanIPMutation.isPending}
                                    data-testid={`button-unban-${ban.id}`}
                                  >
                                    Unban
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No IP bans found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Security Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          {metricsLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            </div>
          ) : metricsError ? (
            <Alert variant="destructive" data-testid="alert-metrics-error">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error loading security metrics</AlertTitle>
              <AlertDescription>
                {(metricsErrorData as any)?.message || "Failed to load security metrics. Please try again."}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card data-testid="card-cpu">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Total Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-cpu">
                      {securityMetrics.totalEvents.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-memory">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Events Today
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-memory">
                      {securityMetrics.eventsToday.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Last 24 hours</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-disk">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Blocked IPs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-disk">
                      {securityMetrics.blockedIps.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Currently active</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-network">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Uptime
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold" data-testid="text-network">
                      {formatUptime(securityMetrics.uptime)}
                    </div>
                    <p className="text-xs text-muted-foreground">Server uptime</p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
