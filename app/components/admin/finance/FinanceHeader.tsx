"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface FinanceHeaderProps {
  period: number;
  onPeriodChange: (period: number) => void;
  onExport: () => void;
}

export function FinanceHeader({ period, onPeriodChange, onExport }: FinanceHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6" data-testid="finance-header">
      <div>
        <h1 className="text-3xl font-bold text-white" data-testid="title-finance">Finance Management</h1>
        <p className="text-gray-400 mt-1" data-testid="subtitle-finance">Monitor revenue, transactions, and withdrawal requests</p>
      </div>
      <div className="flex items-center gap-3">
        <Select value={period.toString()} onValueChange={(v) => onPeriodChange(parseInt(v))}>
          <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700 text-white" data-testid="select-period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="7" data-testid="option-7days">Last 7 days</SelectItem>
            <SelectItem value="30" data-testid="option-30days">Last 30 days</SelectItem>
            <SelectItem value="90" data-testid="option-90days">Last 90 days</SelectItem>
            <SelectItem value="365" data-testid="option-365days">Last year</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onExport} variant="outline" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700" data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
