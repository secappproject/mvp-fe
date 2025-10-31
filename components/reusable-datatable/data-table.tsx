"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  FilterFn,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { X, PlusCircle, MoreVertical, Upload, Download, FileUp, FileSpreadsheet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { AddProjectModal } from "../plan/add-project-modal";
import { ImportExcelModal } from "../plan/import-excel-modal"; 
import { Project, useAuthStore } from "@/lib/types";
import * as XLSX from "xlsx";
import { filterByDeliveryStatus } from "../plan/columns";
import { cn } from "@/lib/utils"; 
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { parseISO, startOfDay, differenceInCalendarDays, max } from 'date-fns';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

type DeliveryStatus = "On Track" | "Need Delivery" | "Late";
const deliveryStatuses: DeliveryStatus[] = ["On Track", "Need Delivery", "Late"];
const statusFilterColumnIds = [
    "derivedDeliveryStatus"
];

function TableAddButton() {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const role = useAuthStore((state) => state.role);
  const vendorType = useAuthStore((state) => state.vendorType);
  
  const isVendorPanel = vendorType === "Panel" || vendorType === "panel"; 
  const isAdmin = role === "Admin" || role === "admin";
  const canManageProjects = isAdmin || isVendorPanel;

  if (!canManageProjects) {
    return null;
  }

  return (
    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
      <Button
        onClick={() => setIsAddModalOpen(true)}
        className="w-full md:w-auto flex-shrink-0"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Tambah Proyek
      </Button>
      <AddProjectModal setIsOpen={setIsAddModalOpen} />
    </Dialog>
  );
}

interface TableFabProps {
  data: Project[]; 
}

function TableFab({ data }: TableFabProps) {
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const vendorType = useAuthStore((state) => state.vendorType);

  const isVendorPanel = vendorType === "Panel" || vendorType === "panel"; 
  const isAdmin = role === "Admin" || role === "admin";
  const canManageProjects = isAdmin || isVendorPanel;

  const handleExport = () => {
    const dataToExport = data.map((p) => ({
      "Project Name": p.projectName,
      "WBS": p.wbs,
      "Category": p.category,
      "Qty": p.quantity,
      "Vendor Panel": p.vendorPanel,
      "Vendor Busbar": p.vendorBusbar,
      "Progress Panel": p.panelProgress,
      "Status Busbar": p.statusBusbar,
      "Plan Start": p.planStart,
      "FAT Start": p.fatStart,
      "Plan Basic Kit (Panel)": p.planDeliveryBasicKitPanel,
      "Plan Basic Kit (Busbar)": p.planDeliveryBasicKitBusbar,
      "Actual Basic Kit (Panel)": p.actualDeliveryBasicKitPanel,
      "Actual Basic Kit (Busbar)": p.actualDeliveryBasicKitBusbar,
      "Plan Accessories (Panel)": p.planDeliveryAccessoriesPanel,
      "Plan Accessories (Busbar)": p.planDeliveryAccessoriesBusbar,
      "Actual Accessories (Panel)": p.actualDeliveryAccessoriesPanel,
      "Actual Accessories (Busbar)": p.actualDeliveryAccessoriesBusbar,
      "Created At": p.createdAt,
      "Updated At": p.updatedAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");
    XLSX.writeFile(workbook, "ProjectPlanData.xlsx");
  };

  const handleImportSuccess = () => {
    router.refresh();
    setIsImportModalOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-32 right-6 z-50 md:bottom-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="rounded-full h-14 w-44">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              <span className="text-black">Mass Data</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="mb-2">
            {canManageProjects && (
              <DropdownMenuItem onClick={() => setIsImportModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                <span>Import Data</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              <span>Export Data</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </>
  );
}


export function DataTable<TData extends Project, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [inputValue, setInputValue] = React.useState("");
  const [filterChips, setFilterChips] = React.useState<string[]>([]);
  const [activeStatusFilter, setActiveStatusFilter] = React.useState<DeliveryStatus | null>(null);
  const [showOldClosed, setShowOldClosed] = React.useState(false);

  const filteredData = React.useMemo(() => {
    if (showOldClosed) {
      return data; 
    }

    const today = startOfDay(new Date());

    return data.filter(item => {
      const project = item as Project; 
      
      const { 
        actualDeliveryBasicKitPanel, 
        actualDeliveryBasicKitBusbar, 
        actualDeliveryAccessoriesPanel, 
        actualDeliveryAccessoriesBusbar 
      } = project;

      const isAllDelivered = 
        actualDeliveryBasicKitPanel && 
        actualDeliveryBasicKitBusbar && 
        actualDeliveryAccessoriesPanel && 
        actualDeliveryAccessoriesBusbar;

      if (!isAllDelivered) {
        return true; 
      }

      try {
        const dates = [
          parseISO(actualDeliveryBasicKitPanel!),
          parseISO(actualDeliveryBasicKitBusbar!),
          parseISO(actualDeliveryAccessoriesPanel!),
          parseISO(actualDeliveryAccessoriesBusbar!)
        ];
        
        const lastDeliveryDate = startOfDay(max(dates));
        const diffDays = differenceInCalendarDays(today, lastDeliveryDate);

        if (diffDays > 2) { 
          return false;
        }

      } catch (e) {
        console.warn("Error parsing delivery dates for filtering:", project.wbs, e);
        return true; 
      }

      return true;
    });
  }, [data, showOldClosed]);


  const multiWordFilterFn: FilterFn<TData> = (row, _columnId, filterValue) => {
    const filterWords = String(filterValue).toLowerCase().split(" ").filter(Boolean);
    if (filterWords.length === 0) return true;

    const rowText = row
      .getVisibleCells()
      .map((cell) => String(cell.getValue() ?? ""))
      .join(" ")
      .toLowerCase();

    return filterWords.every((word) => rowText.includes(word));
  };


  const table = useReactTable<TData>({
    data: filteredData, 
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      columnVisibility: {
        derivedDeliveryStatus: false, 
      },
    },
    filterFns: {
      multiWord: multiWordFilterFn,
      filterByDeliveryStatus: filterByDeliveryStatus as FilterFn<unknown>, 
    },
    globalFilterFn: multiWordFilterFn,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  React.useEffect(() => {
    const chipsString = filterChips.join(" ");
    const liveInputString = inputValue.trim().toLowerCase();
    const combinedFilter = [chipsString, liveInputString].filter(Boolean).join(" ");
    table.setGlobalFilter(combinedFilter);
  }, [filterChips, inputValue, table]);

  const handleStatusFilterClick = (status: DeliveryStatus | null) => {
    const newStatus = activeStatusFilter === status ? null : status;
    setActiveStatusFilter(newStatus);

    statusFilterColumnIds.forEach(columnId => {
        table.getColumn(columnId)?.setFilterValue(newStatus ? [newStatus] : undefined); 
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const newChip = inputValue.trim().toLowerCase();

    if (event.key === "Enter" && newChip !== "") {
      event.preventDefault();
      if (!filterChips.includes(newChip)) {
        setFilterChips((prev) => [...prev, newChip]);
      }
      setInputValue("");
    }
  };

  const removeChip = (chipToRemove: string) => {
    setFilterChips((prev) => prev.filter((chip) => chip !== chipToRemove));
  };

  const resetFilters = () => {
    setActiveStatusFilter(null);
    statusFilterColumnIds.forEach(columnId => {
        table.getColumn(columnId)?.setFilterValue(undefined);
    });
    table.resetColumnFilters(); 
    setFilterChips([]);
    setInputValue("");
    table.setGlobalFilter(undefined); 
  };

  const isFiltered = filterChips.length > 0 || table.getState().columnFilters.length > 0 || activeStatusFilter !== null;
  
  const filteredDataForExport = table.getFilteredRowModel().rows.map(row => row.original) as Project[];


  return (
    <div className="space-y-4 pb-24 md:pb-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        
        <div className="flex flex-col gap-2 w-full max-w-lg">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder={filterChips.length === 0 ? "Cari, lalu tekan Enter..." : "Tambah filter..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow"
            />
            {isFiltered && (
              <Button variant="ghost" onClick={resetFilters} className="h-9 px-2 lg:px-3">
                Reset <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          {filterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {filterChips.map((chip) => (
                <div
                  key={chip}
                  className="flex items-center gap-1 bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-sm"
                >
                  <span>{chip}</span>
                  <button onClick={() => removeChip(chip)} className="rounded-full hover:bg-muted/50">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-sm text-muted-foreground mr-1">Status:</span>
            {deliveryStatuses.map((status) => (
              <Button
                key={status}
                variant={activeStatusFilter === status ? "secondary" : "outline"}
                size="sm"
                className={cn(
                  "h-7 px-2.5 text-xs rounded-full",
                  status === "On Track" && activeStatusFilter === status && "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
                  status === "Need Delivery" && activeStatusFilter === status && "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
                  status === "Late" && activeStatusFilter === status && "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
                )}
                onClick={() => handleStatusFilterClick(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <TableAddButton />
          
          <div className="flex items-center space-x-2 pt-1">
            <Switch
              id="show-old-closed"
              checked={showOldClosed}
              onCheckedChange={(checked) => setShowOldClosed(checked as boolean)}
            />
            <Label htmlFor="show-old-closed" className="text-sm font-light">
              Include 2+ Days Closed
            </Label>
          </div>
        </div>

      </div>

       <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell className="font-light" key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center font-light">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>

      <TableFab data={filteredDataForExport} />
    </div>
  );
}