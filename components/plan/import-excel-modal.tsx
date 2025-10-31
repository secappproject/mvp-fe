"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/types";
import * as XLSX from "xlsx";
import { addDays, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileCheck2, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const parseExcelDate = (dateValue: any): Date | null => {
  if (dateValue instanceof Date) {
    return dateValue;
  }
  if (typeof dateValue === "string") {
    try {
      const parsed = parseISO(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch (e) {
      // Gagal parse, coba format lain di bawah
    }
  }
  if (typeof dateValue === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
  }
  return null;
};

const formatDateForPayload = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  return date.toISOString().split("T")[0];
};

export function ImportExcelModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [basicKitOffset, setBasicKitOffset] = useState<number>(7);
  const [accessoriesOffset, setAccessoriesOffset] = useState<number>(7);
  const role = useAuthStore((state) => state.role);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    // Sesuai permintaan: hanya 8 kolom
    const headers = [
      "Project Name",
      "WBS",
      "Category",
      "Qty",
      "Progress Panel",
      "Status Busbar",
      "Plan Start",
      "FAT Start",
    ];

    const sampleData = [
      {
        "Project Name": "Contoh Proyek",
        "WBS": "WBS-12345",
        "Category": "PIX",
        "Qty": 1,
        "Progress Panel": 0,
        "Status Busbar": "Punching/Bending",
        "Plan Start": "2025-12-01", // Format YYYY-MM-DD
        "FAT Start": "2025-12-15", // Format YYYY-MM-DD
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });

    worksheet["!cols"] = headers.map((h) => ({ wch: h.length + 5 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Proyek");

    XLSX.writeFile(workbook, "Template_Impor_Proyek.xlsx");
  };

  const handleImport = async () => {
    if (!file) {
      alert("Silakan pilih file Excel terlebih dahulu.");
      return;
    }
    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array", cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const sheetData: any[] = XLSX.utils.sheet_to_json(worksheet);

          const projectsPayload = sheetData.map((row) => {
            const planStart = parseExcelDate(row["Plan Start"]);
            const fatStart = parseExcelDate(row["FAT Start"]);

            const planBasicKit =
              parseExcelDate(row["Plan Basic Kit (Panel)"]) ||
              parseExcelDate(row["Plan Basic Kit (Busbar)"]);
            const planAccessories =
              parseExcelDate(row["Plan Accessories (Panel)"]) ||
              parseExcelDate(row["Plan Accessories (Busbar)"]);

            const finalPlanBasicKit =
              planBasicKit ??
              (planStart ? addDays(planStart, -basicKitOffset) : null);
            const finalPlanAccessories =
              planAccessories ??
              (fatStart ? addDays(fatStart, -accessoriesOffset) : null);

            return {
              projectName: row["Project Name"] || "",
              wbs: String(row["WBS"] || ""),
              category: String(row["Category"] || ""), 
              quantity: Number(row["Qty"] || 0),
              vendorPanel: row["Vendor Panel"] || "",
              vendorBusbar: row["Vendor Busbar"] || "",
              panelProgress: Number(row["Progress Panel"] || 0),
              statusBusbar: row["Status Busbar"] || "Punching/Bending",
              planStart: formatDateForPayload(planStart),
              fatStart: formatDateForPayload(fatStart),
              planDeliveryBasicKitPanel:
                formatDateForPayload(finalPlanBasicKit),
              planDeliveryBasicKitBusbar:
                formatDateForPayload(finalPlanBasicKit),
              actualDeliveryBasicKitPanel: formatDateForPayload(
                parseExcelDate(row["Actual Basic Kit (Panel)"])
              ),
              actualDeliveryBasicKitBusbar: formatDateForPayload(
                parseExcelDate(row["Actual Basic Kit (Busbar)"])
              ),
              planDeliveryAccessoriesPanel: formatDateForPayload(
                finalPlanAccessories
              ),
              planDeliveryAccessoriesBusbar: formatDateForPayload(
                finalPlanAccessories
              ),
              actualDeliveryAccessoriesPanel: formatDateForPayload(
                parseExcelDate(row["Actual Accessories (Panel)"])
              ),
              actualDeliveryAccessoriesBusbar: formatDateForPayload(
                parseExcelDate(row["Actual Accessories (Busbar)"])
              ),
            };
          });

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/projects/bulk`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-User-Role": role || "",
              },
              body: JSON.stringify(projectsPayload),
            }
          );

          setIsLoading(false);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || "Gagal mengimpor data proyek."
            );
          }

          alert("Data berhasil diimpor.");
          onSuccess();
        } catch (err) {
          setIsLoading(false);
          console.error("Error processing file:", err);
          alert(
            err instanceof Error ? err.message : "Terjadi kesalahan saat impor."
          );
        }
      };

      reader.onerror = () => {
        setIsLoading(false);
        alert("Gagal membaca file.");
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      setIsLoading(false);
      console.error("Error reading file:", err);
      alert(err instanceof Error ? err.message : "Gagal membaca file.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Impor Data Proyek dari Excel</DialogTitle>
          <DialogDescription>
            Unggah file Excel (.xlsx) untuk menambah atau memperbarui data
            proyek secara massal.
          </DialogDescription>
          <Button
            variant="link"
            size="sm"
            onClick={handleDownloadTemplate}
            className="justify-start p-0 h-auto text-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            Unduh Templat Impor
          </Button>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-6">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="file">File Excel (.xlsx)</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              {file && (
                <div className="text-sm text-muted-foreground flex items-center">
                  <FileCheck2 className="w-4 h-4 mr-2 text-green-600" />
                  {file.name}
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <h4 className="font-semibold text-sm">Pengaturan Offset</h4>
            <p className="text-xs text-muted-foreground -mt-3">
              Tanggal plan (Basic Kit/Accessories) akan dihitung otomatis
              menggunakan offset ini.
            </p>

            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="basicKitOffset" className="text-left">
                Offset Basic Kit (H-)
              </Label>
              <Input
                id="basicKitOffset"
                type="number"
                value={basicKitOffset}
                onChange={(e) =>
                  setBasicKitOffset(parseInt(e.target.value) || 0)
                }
                disabled={isLoading}
                className="col-span-1"
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="accessoriesOffset" className="text-left">
                Offset Accessories (H-)
              </Label>
              <Input
                id="accessoriesOffset"
                type="number"
                value={accessoriesOffset}
                onChange={(e) =>
                  setAccessoriesOffset(parseInt(e.target.value) || 0)
                }
                disabled={isLoading}
                className="col-span-1"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleImport} disabled={isLoading || !file}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Impor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}