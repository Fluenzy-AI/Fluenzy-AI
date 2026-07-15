"use client";

import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  loading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  enableRowSelection?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  emptyState?: React.ReactNode;
  className?: string;
  stickyHeader?: boolean;
}

/**
 * DataTable — TanStack Table wrapper with sort, multi-select,
 * sticky header, empty state, and loading skeleton.
 */
export default function DataTable<T extends { id?: string }>({
  data,
  columns,
  loading = false,
  searchValue,
  enableRowSelection = false,
  onSelectionChange,
  emptyState,
  className,
  stickyHeader = true,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState(searchValue || "");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
      globalFilter: searchValue ?? globalFilter,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(newSelection);
      if (onSelectionChange) {
        const selectedRows = Object.keys(newSelection)
          .filter((key) => newSelection[key])
          .map((key) => data[parseInt(key)])
          .filter(Boolean);
        onSelectionChange(selectedRows);
      }
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection,
  });

  if (loading) {
    return (
      <div
        className={cn("rounded-lg border overflow-hidden", className)}
        style={{
          borderColor: "var(--portal-border)",
          backgroundColor: "var(--portal-bg-elevated)",
        }}
      >
        <div className="divide-y" style={{ borderColor: "var(--portal-border)" }}>
          {/* Header skeleton */}
          <div className="flex items-center gap-4 px-4 py-3">
            {columns.slice(0, 5).map((_, i) => (
              <div key={i} className="h-4 rounded portal-skeleton flex-1" />
            ))}
          </div>
          {/* Row skeletons */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              {columns.slice(0, 5).map((_, j) => (
                <div key={j} className="h-4 rounded portal-skeleton flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div
      className={cn("rounded-lg border overflow-hidden", className)}
      style={{
        borderColor: "var(--portal-border)",
        backgroundColor: "var(--portal-bg-elevated)",
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className={cn(stickyHeader && "sticky top-0 z-10")}
                style={{
                  backgroundColor: "var(--portal-bg-raised)",
                  borderBottom: "1px solid var(--portal-border)",
                }}
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "text-left text-xs font-semibold px-4 py-3 whitespace-nowrap",
                      header.column.getCanSort() && "cursor-pointer select-none hover:opacity-80"
                    )}
                    style={{ color: "var(--portal-text-muted)" }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1.5">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="inline-flex">
                          {header.column.getIsSorted() === "asc" ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "transition-colors",
                  row.getIsSelected() ? "" : ""
                )}
                style={{
                  borderBottom: "1px solid var(--portal-border)",
                  backgroundColor: row.getIsSelected()
                    ? "var(--portal-primary-muted)"
                    : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!row.getIsSelected()) {
                    e.currentTarget.style.backgroundColor = "var(--portal-surface)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!row.getIsSelected()) {
                    e.currentTarget.style.backgroundColor = "";
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 text-sm"
                    style={{ color: "var(--portal-text-primary)" }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table footer with selection count */}
      {enableRowSelection && Object.keys(rowSelection).length > 0 && (
        <div
          className="px-4 py-2 text-xs flex items-center gap-2 border-t"
          style={{
            borderColor: "var(--portal-border)",
            backgroundColor: "var(--portal-primary-muted)",
            color: "var(--portal-primary)",
          }}
        >
          <span className="font-medium">
            {Object.keys(rowSelection).filter((k) => rowSelection[k]).length} selected
          </span>
        </div>
      )}
    </div>
  );
}
