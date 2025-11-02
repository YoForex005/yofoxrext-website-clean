"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopVendor } from "@/hooks/useTopVendors";

interface TopVendorsProps {
  vendors: TopVendor[];
  isLoading?: boolean;
}

export function TopVendors({ vendors, isLoading }: TopVendorsProps) {
  return (
    <Card className="bg-card dark:bg-gray-800" data-testid="top-vendors">
      <CardHeader>
        <CardTitle>Top Vendors</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400" data-testid="empty-state-vendors">
              No vendor data available
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {vendors.map((vendor, index) => (
              <div
                key={vendor.userId}
                className="flex items-center justify-between p-2 rounded bg-gray-700"
                data-testid={`vendor-${vendor.userId}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-gray-500" data-testid={`rank-${index + 1}`}>
                    #{index + 1}
                  </span>
                  <span data-testid={`username-${vendor.userId}`}>{vendor.username}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm" data-testid={`stats-${vendor.userId}`}>
                    {vendor.items} items • {vendor.sales} sales
                  </p>
                  <p className="text-green-400 font-bold" data-testid={`revenue-${vendor.userId}`}>
                    ${vendor.revenue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
