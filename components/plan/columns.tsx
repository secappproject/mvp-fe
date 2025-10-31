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


// --- FUNGSI RENDER BARU UNTUK MENGGABUNGKAN STATUS ---
const renderMergedPlanDateWithStatusChip = (
    planDateStr: string | null, // Asumsi planDatePanel dan planDateBusbar SAMA
    actualDatePanel: string | null,
    actualDateBusbar: string | null
) => {
    const formattedPlanDate = formatDate(planDateStr);
    if (!planDateStr) {
        return <span>{formattedPlanDate}</span>;
    }

    // Dapatkan status untuk kedua item
    const statusPanel = getDeliveryStatus(planDateStr, actualDatePanel);
    const statusBusbar = getDeliveryStatus(planDateStr, actualDateBusbar);

    let finalStatus: "Late" | "Need Delivery" | "On Track" | null = null;

    // Logika penggabungan:
    // 1. Jika SALAH SATU telat, status gabungan adalah "Late"
    if (statusPanel === "Late" || statusBusbar === "Late") {
        finalStatus = "Late";
    } 
    // 2. Jika tidak ada yang telat, TAPI SALAH SATU "Need Delivery"
    else if (statusPanel === "Need Delivery" || statusBusbar === "Need Delivery") {
        finalStatus = "Need Delivery";
    }
    // 3. Jika keduanya "Delivered" atau "On Track" (atau kombinasinya)
    else if ((statusPanel === "Delivered" || statusPanel === "On Track") &&
             (statusBusbar === "Delivered" || statusBusbar === "On Track")) {
        finalStatus = "On Track";
    }
    // 4. Khusus untuk kasus di mana KEDUANYA sudah terkirim (Delivered)
    if (statusPanel === "Delivered" && statusBusbar === "Delivered") {
        finalStatus = "On Track"; // Tetap "On Track" (hijau)
    }

    let statusChip: React.ReactNode = null;

    if (finalStatus === "Late") { 
        statusChip = <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">Late</span>
    } else if (finalStatus === "Need Delivery") {
        statusChip = <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Need Delivery</span>;
    } else if (finalStatus === "On Track") { 
        statusChip = <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">On Track</span>;
    }

    return (
        <div className="flex items-center">
            <span>{formattedPlanDate}</span>
            {statusChip}
        </div>
    );
};
// --- BATAS FUNGSI BARU ---


// --- FUNGSI FILTER BARU UNTUK KOLOM GABUNGAN ---
export const filterByDeliveryStatus: FilterFn<Project> = (row, columnId, filterValue: string[]) => {
    if (!filterValue || filterValue.length === 0) return true;

    const project = row.original;
    const statuses: (string | null)[] = []; 
    
    let itemsToCompare: { plan: string | null; actual: string | null; }[] = [];

    // Tentukan item mana yang akan dicek berdasarkan ID kolom
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
        return true; // Fallback jika ID kolom tidak cocok
    }

    // Logika filter yang sama seperti sebelumnya, tapi hanya pada item yang relevan
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
// --- BATAS FUNGSI FILTER BARU ---


export const columns: ColumnDef<Project>[] = [
  {
    id: "no",
    header: "No.",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "wbs",  filterFn: (row, id, filterValues) => {
    if (!filterValues || filterValues.length === 0) return true;
    const cellValue = String(row.getValue(id)).toLowerCase();
    return filterValues.some((value: string) =>
      cellValue.includes(value.toLowerCase())
    );
  },
    header: ({ column }) => <DataTableColumnHeader column={column} title="WBS" />,
  },
  {
    accessorKey: "projectName",  filterFn: (row, id, filterValues) => {
    if (!filterValues || filterValues.length === 0) return true;
    const cellValue = String(row.getValue(id)).toLowerCase();
    return filterValues.some((value: string) =>
      cellValue.includes(value.toLowerCase())
    );
  },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Project Name" />,
  },
  {
    accessorKey: "category",  filterFn: (row, id, filterValues) => {
    if (!filterValues || filterValues.length === 0) return true;
    const cellValue = String(row.getValue(id)).toLowerCase();
    return filterValues.some((value: string) =>
      cellValue.includes(value.toLowerCase())
    );
  },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
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
  },
  {
    accessorKey: "vendorPanel",  filterFn: (row, id, filterValues) => {
    if (!filterValues || filterValues.length === 0) return true;
    const cellValue = String(row.getValue(id)).toLowerCase();
    return filterValues.some((value: string) =>
      cellValue.includes(value.toLowerCase())
    );
  },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor Panel" />,
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

    header: ({ column }) => <DataTableColumnHeader column={column} title="Progress Panel" />,
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
    accessorKey: "vendorBusbar",  filterFn: (row, id, filterValues) => {
    if (!filterValues || filterValues.length === 0) return true;
    const cellValue = String(row.getValue(id)).toLowerCase();
    return filterValues.some((value: string) =>
      cellValue.includes(value.toLowerCase())
    );
  },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor Busbar" />,
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
        <div className="flex items-center space-x-2">
          <span>{statusText}</span>
          <Image src={statusIcon} alt={statusText} width={24} height={24} priority={false} />
        </div>
      );
    },
  },
  {
    accessorKey: "planStart",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Plan Start (All)" />,
    cell: ({ row }) => formatDate(row.original.planStart),
  },

{
    id: "planBasicKit",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Plan Basic Kit" />,
    accessorFn: (row) => row.planDeliveryBasicKitPanel,
    cell: ({ row }) => renderMergedPlanDateWithStatusChip(
        row.original.planDeliveryBasicKitPanel, 
        row.original.actualDeliveryBasicKitPanel,
        row.original.actualDeliveryBasicKitBusbar
    ),
    filterFn: filterByDeliveryStatus,
    enableHiding: true, 
},

  {
    accessorKey: "actualDeliveryBasicKitPanel",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Actual Basic Kit (Panel)" />,
    cell: ({ row }) => row.original.actualDeliveryBasicKitPanel
    
  },
  {
    accessorKey: "actualDeliveryBasicKitBusbar",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Actual Basic Kit (Busbar)" />,
    cell: ({ row }) => row.original.actualDeliveryBasicKitBusbar
  },
  {
    accessorKey: "fatStart",
    header: ({ column }) => <DataTableColumnHeader column={column} title="FAT Start (All)" />,
    cell: ({ row }) => formatDate(row.original.fatStart),
  },

{
    id: "planAccessories",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Plan Accessories" />,
    accessorFn: (row) => row.planDeliveryAccessoriesPanel, 
    cell: ({ row }) => renderMergedPlanDateWithStatusChip(
        row.original.planDeliveryAccessoriesPanel, 
        row.original.actualDeliveryAccessoriesPanel,
        row.original.actualDeliveryAccessoriesBusbar
    ),
    filterFn: filterByDeliveryStatus,
    enableHiding: true,
},
  {
    accessorKey: "actualDeliveryAccessoriesPanel",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Actual Accessories (Panel)" />,
    cell: ({ row }) =>
        row.original.actualDeliveryAccessoriesPanel
  },
  {
    accessorKey: "actualDeliveryAccessoriesBusbar",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Actual Accessories (Busbar)" />,
    cell: ({ row }) => 
        row.original.actualDeliveryAccessoriesBusbar
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