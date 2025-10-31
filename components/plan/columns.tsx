"use client";

import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Project } from "@/lib/types";
import { DataTableColumnHeader } from "../reusable-datatable/column-header";
import { DataTableRowActions } from "./row-actions";
import Image from "next/image";
import {
  isAfter, parseISO, startOfDay, differenceInCalendarDays,
  isToday, isFuture, isPast
} from 'date-fns';

const iconDone = "/images/status-done.svg";
const iconLoading = "/images/status-loading.svg";

const formatDate = (dateVal: string | null): string => {
  if (dateVal && typeof dateVal === 'string') {
    try {
      const parsedDate = parseISO(dateVal);
      return parsedDate.toLocaleDateString("id-ID", {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (e) {
      console.warn("Invalid date format encountered:", dateVal);
      return '';
    }
  }
  return '';
};

export const getDeliveryStatus = (
  planDateStr: string | null,
  actualDateStr: string | null
): "On Track" | "Need Delivery" | "Late" | "Delivered" | null => {
  if (!planDateStr) return null;

  const today = startOfDay(new Date());
  try {
    const planDate = startOfDay(parseISO(planDateStr));

    if (actualDateStr) {
      const actualDate = startOfDay(parseISO(actualDateStr));
      if (isAfter(actualDate, planDate)) {
        return "Late"; 
      }
      return "Delivered"; 
    }

    if (isPast(planDate) && !isToday(planDate)) {
      return "Late"; 
    } 
    
    return "Need Delivery"; 

  } catch (e) {
    console.warn("Error calculating delivery status:", planDateStr);
  }
  return null; 
};


const renderMergedPlanDateWithStatusChip = (
    planDateStr: string | null, 
    actualDatePanel: string | null,
    actualDateBusbar: string | null
) => {
    const formattedPlanDate = formatDate(planDateStr);
    if (!planDateStr) {
        return <span>{formattedPlanDate}</span>;
    }

    const statusPanel = getDeliveryStatus(planDateStr, actualDatePanel);
    const statusBusbar = getDeliveryStatus(planDateStr, actualDateBusbar);

    let finalStatus: "Late" | "Need Delivery" | "On Track" | null = null;

    if (statusPanel === "Late" || statusBusbar === "Late") {
        finalStatus = "Late";
    } 
    else if (statusPanel === "Need Delivery" || statusBusbar === "Need Delivery") {
        finalStatus = "Need Delivery";
    }
    else if ((statusPanel === "Delivered" || statusPanel === "On Track") &&
             (statusBusbar === "Delivered" || statusBusbar === "On Track")) {
        finalStatus = "On Track";
    }
    if (statusPanel === "Delivered" && statusBusbar === "Delivered") {
        finalStatus = "On Track"; 
    }

    let statusChip: React.ReactNode = null;

    if (finalStatus === "Late") { 
        statusChip = <span className="ml-2 px-2 py-0.5 text-xs font-light rounded-full bg-red-100 text-red-700">Late</span>
    } else if (finalStatus === "Need Delivery") {
        statusChip = <span className="ml-2 px-2 py-0.5 text-xs font-light rounded-full bg-yellow-100 text-yellow-800">Need Delivery</span>;
    } else if (finalStatus === "On Track") { 
        statusChip = <span className="ml-2 px-2 py-0.5 text-xs font-light rounded-full bg-green-100 text-green-800">On Track</span>;
    }

    return (
        <div className="items-start ml-1">
            <span> {formattedPlanDate}</span>
            <span>{statusChip}</span>
        </div>
    );
};


export const filterByDeliveryStatus: FilterFn<Project> = (row, columnId, filterValue: string[]) => {
    if (!filterValue || filterValue.length === 0) return true;

    const project = row.original;
    const statuses: (string | null)[] = []; 
    
    let itemsToCompare: { plan: string | null; actual: string | null; }[] = [];

    if (columnId === "planBasicKit") {
        itemsToCompare = [
            { plan: project.planDeliveryBasicKitPanel, actual: project.actualDeliveryBasicKitPanel },
            { plan: project.planDeliveryBasicKitBusbar, actual: project.actualDeliveryBasicKitBusbar }
        ];
    } else if (columnId === "planAccessories") {
        itemsToCompare = [
            { plan: project.planDeliveryAccessoriesPanel, actual: project.actualDeliveryAccessoriesPanel },
            { plan: project.planDeliveryAccessoriesBusbar, actual: project.actualDeliveryAccessoriesBusbar }
        ];
    } else {
        return true; 
    }

    for (const item of itemsToCompare) {
        if (!item.actual) {
            statuses.push(getDeliveryStatus(item.plan, null));
        } else if (item.plan && item.actual && filterValue.includes("Late")) {
            try {
                const planDate = startOfDay(parseISO(item.plan));
                const actualDate = startOfDay(parseISO(item.actual));
                if (isAfter(actualDate, planDate)) {
                    statuses.push("Late");
                }
            } catch(e)  {}
        } else if (item.plan && item.actual && filterValue.includes("On Track")) {
             try {
                const planDate = startOfDay(parseISO(item.plan));
                const actualDate = startOfDay(parseISO(item.actual));
                if (!isAfter(actualDate, planDate)) {
                    statuses.push("On Track"); 
                }
            } catch(e)  {}
        }
    }

    if (filterValue.includes("On Track")) {
         return statuses.some(status => status && (filterValue.includes(status) || status === "Delivered"));
    }

    return statuses.some(status => status && filterValue.includes(status));
};

export const filterByMergedVendors: FilterFn<Project> = (row, _columnId, filterValues: string[]) => {
    if (!filterValues || filterValues.length === 0) return true;
    
    const panel = String(row.original.vendorPanel).toLowerCase();
    const busbar = String(row.original.vendorBusbar).toLowerCase();
    
    return filterValues.some((filterValue: string) => {
        const value = filterValue.toLowerCase();
        return panel.includes(value) || busbar.includes(value);
    });
};

export const filterByProjectDetails: FilterFn<Project> = (row, _columnId, filterValues: string[]) => {
    if (!filterValues || filterValues.length === 0) return true;
    
    const wbs = String(row.original.wbs);
    const name = String(row.original.projectName);
    const category = String(row.original.category);
    
    return filterValues.some((filterValue: string) => {
        const value = filterValue.toLowerCase();
        return wbs.toLowerCase() === value || name.toLowerCase() === value || category.toLowerCase() === value;
    });
};

export const filterByActualDelivery: FilterFn<Project> = (row, columnId, filterValues: string[]) => {
    if (!filterValues || filterValues.length === 0) return true;
    
    let datesToCompare: (string | null)[] = [];

    if (columnId === "actualBasicKit") {
        datesToCompare = [row.original.actualDeliveryBasicKitPanel, row.original.actualDeliveryBasicKitBusbar];
    } else if (columnId === "actualAccessories") {
        datesToCompare = [row.original.actualDeliveryAccessoriesPanel, row.original.actualDeliveryAccessoriesBusbar];
    } else {
        return true; 
    }

    return filterValues.some(filterValue => {
        const value = filterValue === "(Kosong)" ? null : filterValue;
        
        return datesToCompare.some(dateStr => {
            const formattedDate = dateStr ? formatDate(dateStr) : null;
            if (value === null) {
                // Filter Kosong
                return formattedDate === null || formattedDate === '';
            }
            // Filter Tanggal
            return formattedDate === value;
        });
    });
};

export const columns: ColumnDef<Project>[] = [
  {
    id: "no",
    header: "No.",
    cell: ({ row }) => row.index + 1,
  },
  
  {
    id: "projectDetails",
    header: ({ column }) => <DataTableColumnHeader column={column} title="WBS / Proyek / Kategori" />,
    accessorFn: (row) => [row.wbs, row.projectName, row.category].filter(Boolean).join(' | '),
    cell: ({ row }) => (
        <div className="flex flex-col text-xs space-y-0.5">
            <span className="font-medium text-sm">{row.original.projectName}</span>
            <span className="font-light">WBS: {row.original.wbs || '-'}</span>
            <span className="font-light">Kategori: {row.original.category || '-'}</span>
        </div>
    ),
    filterFn: filterByProjectDetails,
  },

  {
    accessorKey: "quantity",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Qty" />,
    filterFn: (row, id, filterValues) => {
      const cellValue = row.getValue<number>(id);
      if (!Array.isArray(filterValues)) {
        return cellValue === Number(filterValues);
      }
      return filterValues.some((v) => cellValue === Number(v));
    },
    cell: ({ row }) => (
       <span className="text-sm">{row.original.quantity}</span>
    ),
  },
  
  {
    id: "vendorsMerged",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor" />,
    accessorFn: (row) => [row.vendorPanel, row.vendorBusbar].filter(Boolean).join(' | '), 
    cell: ({ row }) => (
        <div className="flex flex-col text-xs space-y-0.5">
            <span className="font-light">Panel: {row.original.vendorPanel || '-'}</span>
            <span className="font-light">Busbar: {row.original.vendorBusbar || '-'}</span>
        </div>
    ),
    filterFn: filterByMergedVendors, 
  },

  {
    accessorKey: "panelProgress",
    filterFn: (row, id, filterValues) => {
      const cellValue = row.getValue<number>(id);
      if (!Array.isArray(filterValues)) {
        return cellValue === Number(filterValues);
      }
      return filterValues.some((v) => cellValue === Number(v));
    },

    header: ({ column }) => <DataTableColumnHeader column={column} title="Progress" />,
    cell: ({ row }) => {
      const progress: number = row.original.panelProgress;
      
      const { 
        actualDeliveryBasicKitPanel, 
        actualDeliveryBasicKitBusbar, 
        actualDeliveryAccessoriesPanel, 
        actualDeliveryAccessoriesBusbar 
      } = row.original;

      const isAllDelivered = 
        actualDeliveryBasicKitPanel && 
        actualDeliveryBasicKitBusbar && 
        actualDeliveryAccessoriesPanel && 
        actualDeliveryAccessoriesBusbar;

      let barColorClass = "";
      
      if (isAllDelivered) {
        barColorClass = "bg-[#008A15]";
      } else if (progress >= 75) { 
        barColorClass = "bg-blue-500";
      } else if (progress >= 50) {
        barColorClass = "bg-orange-500";
      } else {
        barColorClass = "bg-red-500";
      }

      return (
        <div className="flex items-center gap-2">
          <span className="w-10 text-right text-sm">{progress}%</span>
          <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
            <div className={`h-2 rounded-full transition-all ${barColorClass}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "statusBusbar",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status Busbar" />,
    filterFn: (row, id, filterValues) => {
        if (!filterValues || filterValues.length === 0) return true;
        const cellValue = String(row.getValue(id)).toLowerCase();
        return filterValues.some((value: string) =>
        cellValue.includes(value.toLowerCase())
        );
    },
    cell: ({ row }) => {
      const stage = row.original.statusBusbar;
      let statusText: string;
      let statusIcon: string;
      switch (stage) {
        case "Punching/Bending": statusText = "Punching/Bending"; statusIcon = iconLoading; break;
        case "Heatshrink": statusText = "Heatshrink"; statusIcon = iconLoading; break;
        case "Plating": statusText = "Plating"; statusIcon = iconLoading; break;
        default: statusText = "Done"; statusIcon = iconDone; break;
      }
      return (
        <div className="flex items-center text-xs space-x-2">
          <span>{statusText}</span>
          <Image src={statusIcon} alt={statusText} width={24} height={24} priority={false} />
        </div>
      );
    },
  },
  
  {
    id: "planMerged",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Plan" />,
    accessorFn: (row) => [formatDate(row.planStart), formatDate(row.planDeliveryBasicKitPanel), formatDate(row.planDeliveryAccessoriesPanel)].filter(Boolean).join(' | '),
    cell: ({ row }) => (
        <div className="flex flex-col text-xs space-y-3">
            <span className="font-light">Start: {formatDate(row.original.planStart) || '-'}</span>
            <span className="font-light flex">BK Plan: {renderMergedPlanDateWithStatusChip(row.original.planDeliveryBasicKitPanel, row.original.actualDeliveryBasicKitPanel, row.original.actualDeliveryBasicKitBusbar)}</span>
            <span className="font-light flex">Acc Plan: {renderMergedPlanDateWithStatusChip(row.original.planDeliveryAccessoriesPanel, row.original.actualDeliveryAccessoriesPanel, row.original.actualDeliveryAccessoriesBusbar)}</span>
        </div>
    ),
    filterFn: (row, id, filterValues) => {
        if (!filterValues || filterValues.length === 0) return true;
        const start = formatDate(row.original.planStart) || '(Kosong)';
        const bk = formatDate(row.original.planDeliveryBasicKitPanel) || '(Kosong)';
        const acc = formatDate(row.original.planDeliveryAccessoriesPanel) || '(Kosong)';
        
        return filterValues.some((filterValue: string) => {
            const value = filterValue === '(Kosong)' ? '(Kosong)' : filterValue;
            return start === value || bk === value || acc === value;
        });
    },
  },

  {
    id: "actualBasicKit",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Act. BK" />,
    accessorFn: (row) => [formatDate(row.actualDeliveryBasicKitPanel), formatDate(row.actualDeliveryBasicKitBusbar)].filter(Boolean).join(' | '),
    cell: ({ row }) => (
        <div className="flex flex-col text-xs space-y-0.5">
            <span className="font-light">Panel: {formatDate(row.original.actualDeliveryBasicKitPanel) || '-'}</span>
            <span className="font-light">Busbar: {formatDate(row.original.actualDeliveryBasicKitBusbar) || '-'}</span>
        </div>
    ),
    filterFn: filterByActualDelivery,
    enableHiding: true,
  },
  
  {
    id: "actualAccessories",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Act. Acc" />,
    accessorFn: (row) => [formatDate(row.actualDeliveryAccessoriesPanel), formatDate(row.actualDeliveryAccessoriesBusbar)].filter(Boolean).join(' | '),
    cell: ({ row }) => (
        <div className="flex flex-col text-xs space-y-0.5">
            <span className="font-light">Panel: {formatDate(row.original.actualDeliveryAccessoriesPanel) || '-'}</span>
            <span className="font-light">Busbar: {formatDate(row.original.actualDeliveryAccessoriesBusbar) || '-'}</span>
        </div>
    ),
    filterFn: filterByActualDelivery,
    enableHiding: true,
  },

  {
    id: 'derivedDeliveryStatus',
    accessorFn: (row) => {
      const statuses = [
        getDeliveryStatus(row.planDeliveryBasicKitPanel, row.actualDeliveryBasicKitPanel),
        getDeliveryStatus(row.planDeliveryBasicKitBusbar, row.actualDeliveryBasicKitBusbar),
        getDeliveryStatus(row.planDeliveryAccessoriesPanel, row.actualDeliveryAccessoriesPanel),
        getDeliveryStatus(row.planDeliveryAccessoriesBusbar, row.actualDeliveryAccessoriesBusbar),
      ];
      return statuses.map(s => {
        if (s === 'Delivered') return 'on track'; 
        return s?.toLowerCase() ?? '';
      }).filter(s => s && s !== 'delivered').join(' ');
    },
    enableHiding: true,
  },
  {
    id: "actions",
    header: () => <div className="text-center">Aksi</div>,
    cell: ({ row }) => {
      return (
        <div className="text-center">
          <DataTableRowActions project={row.original} />
        </div>
      );
    },
  },
];