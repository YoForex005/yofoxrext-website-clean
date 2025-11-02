"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { AlertCircle, FileText, Eye, CheckCircle, XCircle, Ban } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { MarketplaceItem } from "@/hooks/useMarketplaceItems";

interface MarketplaceItemsTableProps {
  items: MarketplaceItem[];
  isLoading: boolean;
  error: Error | null;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onApprove: (itemId: string) => void;
  onReject: (item: MarketplaceItem) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}

export function MarketplaceItemsTable({
  items,
  isLoading,
  error,
  page,
  totalPages,
  onPageChange,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}: MarketplaceItemsTableProps) {
  return (
    <Card data-testid="marketplace-items-table">
      <CardHeader>
        <CardTitle>Marketplace Items</CardTitle>
        <CardDescription>
          Manage all marketplace content submissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : error ? (
          <Alert variant="destructive" data-testid="items-table-error">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading items</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : items.length === 0 ? (
          <div className="text-center py-8" data-testid="items-table-empty">
            <p className="text-gray-400">No items found matching your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any) => (
                  <TableRow key={item.id} data-testid={`item-row-${item.id}`}>
                    {/* Title Column */}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span>{item.title}</span>
                      </div>
                    </TableCell>
                    
                    {/* Type Column */}
                    <TableCell>
                      <Badge variant="outline">
                        {item.type || item.contentType || item.category || 'EA'}
                      </Badge>
                    </TableCell>
                    
                    {/* Seller Column */}
                    <TableCell>
                      {item.seller?.username || item.seller || item.author || 'Unknown'}
                    </TableCell>
                    
                    {/* Price Column */}
                    <TableCell>
                      {item.isPaid ? `$${item.price || item.priceCoins || 0}` : 'Free'}
                    </TableCell>
                    
                    {/* Status Column */}
                    <TableCell>
                      <Badge 
                        variant={
                          item.status === 'approved' ? 'default' : 
                          item.status === 'pending' ? 'secondary' : 
                          item.status === 'rejected' ? 'destructive' : 
                          'outline'
                        }
                        data-testid={`status-badge-${item.id}`}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    
                    {/* Sales Column */}
                    <TableCell>{item.salesCount || item.sales || 0}</TableCell>
                    
                    {/* Revenue Column */}
                    <TableCell className="text-green-400">
                      ${item.revenue || 0}
                    </TableCell>
                    
                    {/* Created Column */}
                    <TableCell>
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </TableCell>
                    
                    {/* Actions Column */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* View Button */}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(`/content/${item.slug || item.id}`, '_blank')}
                          data-testid={`view-item-${item.id}`}
                          title="View item"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {/* Approve/Reject Buttons for pending items */}
                        {item.status === 'pending' && (
                          <>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => onApprove(item.id)}
                              disabled={isApproving}
                              data-testid={`approve-item-${item.id}`}
                              title="Approve item"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => onReject(item)}
                              disabled={isRejecting}
                              data-testid={`reject-item-${item.id}`}
                              title="Reject item"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {/* Suspend button for approved items */}
                        {item.status === 'approved' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onReject(item)}
                            data-testid={`suspend-item-${item.id}`}
                            title="Suspend item"
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        )}
                        
                        {/* Unreject button for rejected items */}
                        {item.status === 'rejected' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onApprove(item.id)}
                            data-testid={`unreject-item-${item.id}`}
                            title="Approve item"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Unreject
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      {/* Pagination */}
      {!isLoading && !error && totalPages > 1 && (
        <CardFooter className="flex justify-center" data-testid="items-table-pagination">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => page > 1 && onPageChange(page - 1)}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => onPageChange(pageNum)}
                      isActive={page === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => page < totalPages && onPageChange(page + 1)}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      )}
    </Card>
  );
}
