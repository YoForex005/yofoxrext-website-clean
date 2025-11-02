"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
import { UserManagementFilters } from "@/hooks/useUserManagement";
import { useDebounce } from "@/hooks/use-debounce";
import { useState, useEffect } from "react";

interface UserSearchFiltersProps {
  filters: UserManagementFilters;
  onChange: (filters: UserManagementFilters) => void;
}

export function UserSearchFilters({ filters, onChange }: UserSearchFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    onChange({ ...filters, search: debouncedSearch, page: 1 });
  }, [debouncedSearch]);

  const handleClearFilters = () => {
    setSearchInput("");
    onChange({
      page: 1,
      search: "",
      role: "all",
      status: "all",
      authMethod: "all",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const toggleSortOrder = () => {
    const newOrder = filters.sortOrder === "asc" ? "desc" : "asc";
    onChange({ ...filters, sortOrder: newOrder });
  };

  const hasActiveFilters = 
    searchInput ||
    (filters.role && filters.role !== "all") ||
    (filters.status && filters.status !== "all") ||
    (filters.authMethod && filters.authMethod !== "all");

  return (
    <div className="space-y-4" data-testid="user-search-filters">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by username or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>

        <Select
          value={filters.role || "all"}
          onValueChange={(value) => onChange({ ...filters, role: value, page: 1 })}
        >
          <SelectTrigger className="w-[150px]" data-testid="select-role">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="superadmin">Superadmin</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status || "all"}
          onValueChange={(value) => onChange({ ...filters, status: value, page: 1 })}
        >
          <SelectTrigger className="w-[150px]" data-testid="select-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.authMethod || "all"}
          onValueChange={(value) => onChange({ ...filters, authMethod: value, page: 1 })}
        >
          <SelectTrigger className="w-[180px]" data-testid="select-auth-method">
            <SelectValue placeholder="Auth Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="email">Email/Password</SelectItem>
            <SelectItem value="google">Google OAuth</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sortBy || "createdAt"}
          onValueChange={(value) => onChange({ ...filters, sortBy: value, page: 1 })}
        >
          <SelectTrigger className="w-[150px]" data-testid="select-sort-by">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Created At</SelectItem>
            <SelectItem value="username">Username</SelectItem>
            <SelectItem value="lastLogin">Last Login</SelectItem>
            <SelectItem value="reputation">Reputation</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={toggleSortOrder}
          title={`Sort ${filters.sortOrder === "asc" ? "Descending" : "Ascending"}`}
          data-testid="button-sort-order"
        >
          {filters.sortOrder === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="secondary"
            onClick={handleClearFilters}
            data-testid="button-clear-filters"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
