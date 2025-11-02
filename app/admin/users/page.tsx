"use client";

import { AdminAuthCheck } from "@/admin/auth-check";
import { UserManagementKPIs } from "@/components/admin/users/UserManagementKPIs";
import { UserSearchFilters } from "@/components/admin/users/UserSearchFilters";
import { UserDataTable } from "@/components/admin/users/UserDataTable";
import { BanUserModal } from "@/components/admin/users/BanUserModal";
import { UserExportButton } from "@/components/admin/users/UserExportButton";
import { useUserManagement, UserData, UserManagementFilters } from "@/hooks/useUserManagement";
import { useUnbanUser } from "@/hooks/useBanUser";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function AdminUsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate: unbanUser } = useUnbanUser();

  const [filters, setFilters] = useState<UserManagementFilters>({
    page: parseInt(searchParams.get("page") || "1"),
    limit: 20,
    search: searchParams.get("search") || "",
    role: searchParams.get("role") || "all",
    status: searchParams.get("status") || "all",
    authMethod: searchParams.get("authMethod") || "all",
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: searchParams.get("sortOrder") || "desc",
  });

  const [banModalOpen, setBanModalOpen] = useState(false);
  const [unbanModalOpen, setUnbanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const { data, isLoading, error } = useUserManagement(filters);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.page && filters.page > 1) params.set("page", filters.page.toString());
    if (filters.search) params.set("search", filters.search);
    if (filters.role && filters.role !== "all") params.set("role", filters.role);
    if (filters.status && filters.status !== "all") params.set("status", filters.status);
    if (filters.authMethod && filters.authMethod !== "all") params.set("authMethod", filters.authMethod);
    if (filters.sortBy && filters.sortBy !== "createdAt") params.set("sortBy", filters.sortBy);
    if (filters.sortOrder && filters.sortOrder !== "desc") params.set("sortOrder", filters.sortOrder);

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newUrl);
  }, [filters, router]);

  const handleBanClick = (user: UserData) => {
    setSelectedUser(user);
    setBanModalOpen(true);
  };

  const handleUnbanClick = (user: UserData) => {
    setSelectedUser(user);
    setUnbanModalOpen(true);
  };

  const confirmUnban = () => {
    if (selectedUser) {
      unbanUser(selectedUser.id, {
        onSuccess: () => {
          setUnbanModalOpen(false);
          setSelectedUser(null);
        },
      });
    }
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPaginationItems = () => {
    if (!data) return null;

    const { page, totalPages } = data;
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={i === page}
              className="cursor-pointer"
              data-testid={`pagination-page-${i}`}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={1 === page}
            className="cursor-pointer"
            data-testid="pagination-page-1"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (page > 3) {
        items.push(
          <PaginationItem key="ellipsis-1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={i === page}
              className="cursor-pointer"
              data-testid={`pagination-page-${i}`}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (page < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={totalPages === page}
            className="cursor-pointer"
            data-testid={`pagination-page-${totalPages}`}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6" data-testid="admin-users-page">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="page-title">
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        <UserExportButton filters={filters} />
      </div>

      <UserManagementKPIs stats={data?.stats} isLoading={isLoading} />

      <UserSearchFilters filters={filters} onChange={setFilters} />

      <UserDataTable
        users={data?.users}
        isLoading={isLoading}
        error={error}
        onBanClick={handleBanClick}
        onUnbanClick={handleUnbanClick}
      />

      {data && data.totalPages > 1 && (
        <div className="flex flex-col items-center gap-2" data-testid="pagination-container">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, data.page - 1))}
                  className={`cursor-pointer ${data.page === 1 ? "pointer-events-none opacity-50" : ""}`}
                  data-testid="pagination-previous"
                />
              </PaginationItem>

              {renderPaginationItems()}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(data.totalPages, data.page + 1))}
                  className={`cursor-pointer ${data.page === data.totalPages ? "pointer-events-none opacity-50" : ""}`}
                  data-testid="pagination-next"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          <p className="text-sm text-muted-foreground" data-testid="pagination-info">
            Showing page {data.page} of {data.totalPages} ({data.total.toLocaleString()} total users)
          </p>
        </div>
      )}

      <BanUserModal open={banModalOpen} onOpenChange={setBanModalOpen} user={selectedUser} />

      <AlertDialog open={unbanModalOpen} onOpenChange={setUnbanModalOpen}>
        <AlertDialogContent data-testid="unban-confirmation-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Unban</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unban @{selectedUser?.username}? They will regain access to the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-unban">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnban} data-testid="button-confirm-unban">
              Confirm Unban
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminAuthCheck>
      <AdminUsersContent />
    </AdminAuthCheck>
  );
}
