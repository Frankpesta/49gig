"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTable({ children, className }: DataTableProps) {
  return (
    <div className={cn("rounded-xl border border-border/60 overflow-hidden bg-card", className)}>
      <div className="overflow-x-auto">
        <Table>{children}</Table>
      </div>
    </div>
  );
}

export function DataTableHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <TableHeader>
      <TableRow className="border-b border-border/60 bg-muted/30 hover:bg-muted/30">
        {children}
      </TableRow>
    </TableHeader>
  );
}

export function DataTableHead({
  children,
  className,
  sortable,
  onSort,
  ...props
}: React.ComponentProps<"th"> & {
  sortable?: boolean;
  onSort?: () => void;
}) {
  return (
    <TableHead
      className={cn(
        "h-12 px-4 text-left font-semibold text-foreground/90",
        sortable && "cursor-pointer select-none hover:text-foreground",
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      {children}
    </TableHead>
  );
}

export function DataTableBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <TableBody className={className}>{children}</TableBody>;
}

export function DataTableRow({
  children,
  className,
  onClick,
  ...props
}: React.ComponentProps<"tr">) {
  return (
    <TableRow
      className={cn(
        "border-b border-border/40 transition-colors hover:bg-muted/40",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </TableRow>
  );
}

export function DataTableCell({
  children,
  className,
  ...props
}: React.ComponentProps<"td">) {
  return (
    <TableCell
      className={cn("px-4 py-3.5 text-sm", className)}
      {...props}
    >
      {children}
    </TableCell>
  );
}
