"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { UserManagementFilters } from "@/hooks/useUserManagement";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface UserExportButtonProps {
  filters: UserManagementFilters;
}

export function UserExportButton({ filters }: UserExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.set("search", filters.search);
      if (filters.role && filters.role !== "all") queryParams.set("role", filters.role);
      if (filters.status && filters.status !== "all") queryParams.set("status", filters.status);
      if (filters.authMethod && filters.authMethod !== "all") queryParams.set("authMethod", filters.authMethod);
      if (filters.sortBy) queryParams.set("sortBy", filters.sortBy);
      if (filters.sortOrder) queryParams.set("sortOrder", filters.sortOrder);

      const queryString = queryParams.toString();
      const endpoint = `/api/admin/users/export/csv${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error("Failed to export users");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "User data has been exported to CSV.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export user data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleExport}
      disabled={isExporting}
      data-testid="button-export-csv"
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </>
      )}
    </Button>
  );
}
