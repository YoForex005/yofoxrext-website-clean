"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect, useState } from "react";

interface MarketplaceFiltersProps {
  filters: {
    search: string;
    category: string;
    status: string;
    price: string;
  };
  onChange: (filters: Partial<MarketplaceFiltersProps["filters"]>) => void;
  onClear: () => void;
}

export function MarketplaceFilters({ filters, onChange, onClear }: MarketplaceFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onChange({ search: debouncedSearch });
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  return (
    <div className="flex flex-wrap gap-4" data-testid="marketplace-filters">
      <div className="relative w-full md:w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by title or seller..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>

      <Select value={filters.category} onValueChange={(v) => onChange({ category: v })}>
        <SelectTrigger className="w-40" data-testid="select-category">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="ea">Expert Advisors</SelectItem>
          <SelectItem value="indicator">Indicators</SelectItem>
          <SelectItem value="template">Templates</SelectItem>
          <SelectItem value="source-code">Source Code</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.status} onValueChange={(v) => onChange({ status: v })}>
        <SelectTrigger className="w-40" data-testid="select-status">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="suspended">Suspended</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.price} onValueChange={(v) => onChange({ price: v })}>
        <SelectTrigger className="w-40" data-testid="select-price">
          <SelectValue placeholder="All Prices" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Prices</SelectItem>
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="under50">Under $50</SelectItem>
          <SelectItem value="50-100">$50 - $100</SelectItem>
          <SelectItem value="100-200">$100 - $200</SelectItem>
          <SelectItem value="over200">Over $200</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        onClick={onClear}
        className="text-blue-400 hover:text-blue-300"
        data-testid="button-clear-filters"
      >
        Clear Filters
      </Button>
    </div>
  );
}
