"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TopSellerItem } from "@/hooks/useTopSellers";

interface TopSellingItemsProps {
  items: TopSellerItem[];
  isLoading?: boolean;
}

export function TopSellingItems({ items, isLoading }: TopSellingItemsProps) {
  return (
    <Card className="bg-card dark:bg-gray-800" data-testid="top-selling-items">
      <CardHeader>
        <CardTitle>Top Selling Items</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400" data-testid="empty-state-sellers">
              No sales data available
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} data-testid={`row-seller-${item.id}`}>
                  <TableCell data-testid={`cell-title-${item.id}`}>{item.title}</TableCell>
                  <TableCell data-testid={`cell-seller-${item.id}`}>{item.seller}</TableCell>
                  <TableCell data-testid={`cell-sales-${item.id}`}>
                    {item.sales.toLocaleString()}
                  </TableCell>
                  <TableCell data-testid={`cell-revenue-${item.id}`}>
                    ${item.revenue.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
