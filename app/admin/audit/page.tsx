'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({
    action: '',
    category: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  
  const { data, isLoading } = useQuery<{ logs: any[]; total: number }>({
    queryKey: ['/api/admin/audit-logs', filters],
    refetchInterval: 15000, // 15 seconds
  });
  
  const handleExport = async () => {
    const params = new URLSearchParams(filters as any);
    window.location.href = `/api/admin/audit-logs/export?${params.toString()}`;
  };
  
  const logs = data?.logs || [];
  const total = data?.total || 0;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-white" />
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
      </div>
      
      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Select
            value={filters.category}
            onValueChange={(value) => setFilters({ ...filters, category: value })}
          >
            <SelectTrigger className="w-48 bg-gray-700 text-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              <SelectItem value="USER_MANAGEMENT">User Management</SelectItem>
              <SelectItem value="SUPPORT">Support</SelectItem>
              <SelectItem value="SECURITY">Security</SelectItem>
              <SelectItem value="COMMUNICATIONS">Communications</SelectItem>
              <SelectItem value="MARKETPLACE">Marketplace</SelectItem>
              <SelectItem value="FINANCE">Finance</SelectItem>
              <SelectItem value="SETTINGS">Settings</SelectItem>
              <SelectItem value="SYSTEM">System</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            type="date"
            className="w-48 bg-gray-700 text-white"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            placeholder="Start Date"
            data-testid="input-start-date"
          />
          
          <Input
            type="date"
            className="w-48 bg-gray-700 text-white"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            placeholder="End Date"
            data-testid="input-end-date"
          />
          
          <Input
            placeholder="Search user, target..."
            className="w-64 bg-gray-700 text-white"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            data-testid="input-search"
          />
          
          <Button
            variant="outline"
            onClick={handleExport}
            className="bg-gray-700 text-white hover:bg-gray-600"
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </CardContent>
      </Card>
      
      {/* Logs Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Audit Events ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No audit events found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Timestamp</TableHead>
                  <TableHead className="text-gray-300">Admin</TableHead>
                  <TableHead className="text-gray-300">Action</TableHead>
                  <TableHead className="text-gray-300">Target</TableHead>
                  <TableHead className="text-gray-300">IP</TableHead>
                  <TableHead className="text-gray-300">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <>
                    <TableRow key={log.id} className="border-gray-700" data-testid={`row-audit-log-${log.id}`}>
                      <TableCell className="text-gray-300">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {log.users?.email || log.adminId}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div className="flex flex-col">
                          <span className="font-medium">{log.action}</span>
                          <span className="text-xs text-gray-500">{log.actionCategory}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {log.targetType ? `${log.targetType}#${log.targetId}` : '-'}
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {log.ipAddress || '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                          className="text-blue-400 hover:text-blue-300"
                          data-testid={`button-expand-${log.id}`}
                        >
                          {expandedRow === log.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedRow === log.id && (
                      <TableRow className="border-gray-700 bg-gray-900">
                        <TableCell colSpan={6}>
                          <div className="p-4 space-y-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-500">Method & Path</p>
                                <p className="text-gray-300">{log.requestMethod} {log.requestPath}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Status & Duration</p>
                                <p className="text-gray-300">{log.statusCode || '-'} ({log.durationMs || '-'}ms)</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">User Agent</p>
                                <p className="text-gray-300 text-sm truncate">{log.userAgent || '-'}</p>
                              </div>
                            </div>
                            {log.metadata && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Metadata</p>
                                <pre className="bg-black p-2 rounded text-xs text-gray-300 overflow-auto max-h-48">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
