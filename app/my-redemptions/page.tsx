"use client";

import { useState } from "react";
import { Package, Calendar, CheckCircle2, Clock, XCircle, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RedemptionOrder {
  id: string;
  optionId: string;
  coinAmount: number;
  status: "pending" | "processing" | "fulfilled" | "cancelled" | "expired";
  redemptionCode?: string;
  createdAt: string;
  fulfilledAt?: string;
  option: {
    name: string;
    description: string;
    category: string;
  };
}

export default function MyRedemptionsPage() {
  const { user, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: orders, isLoading } = useQuery<RedemptionOrder[]>({
    queryKey: ["/api/sweets/redemptions/orders/me", statusFilter],
    enabled: !!user && isAuthenticated,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "fulfilled":
        return <CheckCircle2 className="h-4 w-4" />;
      case "processing":
        return <Clock className="h-4 w-4 animate-spin" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
      case "expired":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "fulfilled":
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700";
      case "expired":
        return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Sign in to view your redemptions</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be signed in to view your redemption history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl" data-testid="page-my-redemptions">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">My Redemptions</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your reward redemption orders and codes
        </p>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] dark:bg-gray-900 dark:border-gray-800 dark:text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800">
              <SelectItem value="all" className="dark:text-gray-200 dark:focus:bg-gray-800">All Orders</SelectItem>
              <SelectItem value="fulfilled" className="dark:text-gray-200 dark:focus:bg-gray-800">Fulfilled</SelectItem>
              <SelectItem value="processing" className="dark:text-gray-200 dark:focus:bg-gray-800">Processing</SelectItem>
              <SelectItem value="pending" className="dark:text-gray-200 dark:focus:bg-gray-800">Pending</SelectItem>
              <SelectItem value="cancelled" className="dark:text-gray-200 dark:focus:bg-gray-800">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2 dark:bg-gray-800" />
                <Skeleton className="h-4 w-1/2 dark:bg-gray-800" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full dark:bg-gray-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="hover:shadow-lg transition-shadow dark:bg-gray-900 dark:border-gray-800"
              data-testid={`order-row-${order.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1 dark:text-white">
                      {order.option.name}
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      {order.option.description}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={`ml-4 ${getStatusBadgeClass(order.status)}`}
                    data-testid={`status-badge-${order.status}`}
                  >
                    {getStatusIcon(order.status)}
                    <span className="ml-1.5 capitalize">{order.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">Coin Cost</p>
                    <p className="font-semibold dark:text-white">
                      {order.coinAmount.toLocaleString()} coins
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">Order Date</p>
                    <p className="font-semibold dark:text-white">
                      {format(new Date(order.createdAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>

                {order.redemptionCode && order.status === "fulfilled" && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Redemption Code:
                    </p>
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border border-green-300 dark:border-green-700">
                      <code className="font-mono font-bold text-lg dark:text-white">
                        {order.redemptionCode}
                      </code>
                      <Badge className="bg-green-600 dark:bg-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </div>
                )}

                {order.status === "processing" && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Your order is being processed. You'll receive your redemption code soon.
                    </p>
                  </div>
                )}

                {order.status === "pending" && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Your order is awaiting admin review.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2 dark:text-white">No redemptions yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {statusFilter !== "all"
              ? "No orders with this status"
              : "Start redeeming your coins for awesome rewards!"}
          </p>
          <a
            href="/rewards"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Browse Rewards Catalog
          </a>
        </div>
      )}
    </div>
  );
}
