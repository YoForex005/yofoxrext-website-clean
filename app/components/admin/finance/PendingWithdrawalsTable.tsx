"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, CreditCard } from "lucide-react";
import { WithdrawalRequest } from "@/hooks/usePendingWithdrawals";
import { format } from "date-fns";

interface PendingWithdrawalsTableProps {
  withdrawals?: WithdrawalRequest[];
  isLoading?: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function PendingWithdrawalsTable({
  withdrawals,
  isLoading,
  onApprove,
  onReject,
}: PendingWithdrawalsTableProps) {
  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700" data-testid="withdrawals-table-loading">
        <CardHeader>
          <Skeleton className="h-6 w-48 bg-gray-700" />
        </CardHeader>
        <CardContent>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full mb-2 bg-gray-700" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const hasData = withdrawals && withdrawals.length > 0;

  return (
    <Card className="bg-gray-800 border-gray-700" data-testid="withdrawals-table">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-amber-500" />
          Pending Withdrawals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-gray-700/50">
                  <TableHead className="text-gray-400">User</TableHead>
                  <TableHead className="text-gray-400">Amount</TableHead>
                  <TableHead className="text-gray-400">Method</TableHead>
                  <TableHead className="text-gray-400">Wallet/Account</TableHead>
                  <TableHead className="text-gray-400">Requested</TableHead>
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id} className="border-gray-700 hover:bg-gray-700/50" data-testid={`row-withdrawal-${withdrawal.id}`}>
                    <TableCell className="text-white font-medium" data-testid={`text-username-${withdrawal.id}`}>
                      {withdrawal.username}
                    </TableCell>
                    <TableCell className="text-white" data-testid={`text-amount-${withdrawal.id}`}>
                      ${withdrawal.amount?.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell className="text-gray-400" data-testid={`text-method-${withdrawal.id}`}>
                      {withdrawal.method}
                    </TableCell>
                    <TableCell className="text-gray-400 max-w-[200px] truncate" data-testid={`text-wallet-${withdrawal.id}`}>
                      {withdrawal.walletAddress || 'N/A'}
                    </TableCell>
                    <TableCell className="text-gray-400" data-testid={`text-date-${withdrawal.id}`}>
                      {format(new Date(withdrawal.requestedAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => onApprove(withdrawal.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          data-testid={`button-approve-${withdrawal.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onReject(withdrawal.id)}
                          data-testid={`button-reject-${withdrawal.id}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12 text-center" data-testid="withdrawals-table-empty">
            <CreditCard className="h-12 w-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No pending withdrawals</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
