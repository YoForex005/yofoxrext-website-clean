"use client";

import { useState } from "react";
import { AdminAuthCheck } from "@/admin/auth-check";
import { FinanceHeader } from "@/components/admin/finance/FinanceHeader";
import { KPICardsGrid } from "@/components/admin/finance/KPICardsGrid";
import { RevenueTrendChart } from "@/components/admin/finance/RevenueTrendChart";
import { RevenueSourceChart } from "@/components/admin/finance/RevenueSourceChart";
import { TriggerStatsCard } from "@/components/admin/finance/TriggerStatsCard";
import { PendingWithdrawalsTable } from "@/components/admin/finance/PendingWithdrawalsTable";
import { RejectWithdrawalModal } from "@/components/admin/finance/RejectWithdrawalModal";
import { useFinanceStats } from "@/hooks/useFinanceStats";
import { useFinanceRevenueTrend } from "@/hooks/useFinanceRevenueTrend";
import { useRevenueSources } from "@/hooks/useRevenueSources";
import { useTriggerStats } from "@/hooks/useTriggerStats";
import { usePendingWithdrawals } from "@/hooks/usePendingWithdrawals";
import { useApproveWithdrawal } from "@/hooks/useApproveWithdrawal";
import { useRejectWithdrawal } from "@/hooks/useRejectWithdrawal";
import { useToast } from "@/hooks/use-toast";

function FinanceContent() {
  const [period, setPeriod] = useState(30);
  const [page, setPage] = useState(1);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState<string | null>(null);

  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useFinanceStats(period);
  const { data: trendData, isLoading: trendLoading } = useFinanceRevenueTrend(period);
  const { data: sourcesData, isLoading: sourcesLoading } = useRevenueSources(period);
  const { data: triggerData, isLoading: triggerLoading } = useTriggerStats(period);
  const { data: withdrawalsData, isLoading: withdrawalsLoading } = usePendingWithdrawals(page, 20);

  const { mutate: approveWithdrawal, isPending: isApproving } = useApproveWithdrawal();
  const { mutate: rejectWithdrawal, isPending: isRejecting } = useRejectWithdrawal();

  const handlePeriodChange = (newPeriod: number) => {
    setPeriod(newPeriod);
  };

  const handleExport = () => {
    const baseUrl = window.location.origin;
    const exportUrl = `${baseUrl}/api/admin/finance/export?days=${period}`;
    window.open(exportUrl, '_blank');
  };

  const handleApprove = (id: string) => {
    if (confirm('Are you sure you want to approve this withdrawal request?')) {
      approveWithdrawal(
        { id },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Withdrawal approved successfully",
            });
          },
          onError: (error: Error) => {
            toast({
              title: "Error",
              description: error.message || "Failed to approve withdrawal",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  const handleRejectClick = (id: string) => {
    setSelectedWithdrawalId(id);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = (reason: string) => {
    if (!selectedWithdrawalId) return;

    rejectWithdrawal(
      { id: selectedWithdrawalId, reason },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Withdrawal rejected successfully",
          });
          setRejectModalOpen(false);
          setSelectedWithdrawalId(null);
        },
        onError: (error: Error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to reject withdrawal",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 space-y-6" data-testid="finance-page">
      <FinanceHeader 
        period={period}
        onPeriodChange={handlePeriodChange}
        onExport={handleExport}
      />

      <KPICardsGrid
        stats={stats}
        isLoading={statsLoading}
        error={statsError}
        onRetry={refetchStats}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueTrendChart data={trendData} isLoading={trendLoading} />
        <RevenueSourceChart data={sourcesData} isLoading={sourcesLoading} />
      </div>

      <TriggerStatsCard data={triggerData} isLoading={triggerLoading} />

      <PendingWithdrawalsTable
        withdrawals={withdrawalsData?.withdrawals}
        isLoading={withdrawalsLoading}
        onApprove={handleApprove}
        onReject={handleRejectClick}
      />

      <RejectWithdrawalModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedWithdrawalId(null);
        }}
        onConfirm={handleRejectConfirm}
        isPending={isRejecting}
      />
    </div>
  );
}

export default function FinancePage() {
  return (
    <AdminAuthCheck>
      <FinanceContent />
    </AdminAuthCheck>
  );
}
