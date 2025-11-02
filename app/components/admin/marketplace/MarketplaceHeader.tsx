"use client";

import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Plus } from "lucide-react";

interface MarketplaceHeaderProps {
  onAddClick: () => void;
}

export function MarketplaceHeader({ onAddClick }: MarketplaceHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between" data-testid="marketplace-header">
      <div>
        <Breadcrumb data-testid="breadcrumb">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" data-testid="breadcrumb-home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin" data-testid="breadcrumb-admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage data-testid="breadcrumb-marketplace">Marketplace</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-3xl font-bold text-foreground mt-2" data-testid="page-title">
          Marketplace Management
        </h1>
      </div>
      <Button 
        onClick={onAddClick} 
        className="bg-blue-600 hover:bg-blue-700 text-white"
        data-testid="button-add-content"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Content
      </Button>
    </div>
  );
}
