"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

interface FormData {
  projectName: string;
  wbs: string;
  planStart: Date | undefined;
  fatStart: Date | undefined;
}

interface AddProjectModalProps {
  setIsOpen: (open: boolean) => void;
}

const formatNullableDate = (date: Date | null | undefined): string | null => {
  return date ? format(date, "yyyy-MM-dd") : null;
};

export function AddProjectModal({ setIsOpen }: AddProjectModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    projectName: "",
    wbs: "",
    planStart: new Date(),
    fatStart: undefined,
  });

  const [basicKitOffset, setBasicKitOffset] = useState<number>(7);
  const [accessoriesOffset, setAccessoriesOffset] = useState<number>(7);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handlePlanStartDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, planStart: date }));
  };

  const handleFatStartDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, fatStart: date }));
  };

  const handleSubmit = async () => {
    if (!formData.planStart || !formData.projectName || !formData.wbs) {
      alert("Nama Proyek, WBS, dan Tanggal Plan Start harus diisi.");
      return;
    }
    setIsLoading(true);
    try {
      const planBasicKitDate = formData.planStart
        ? addDays(formData.planStart, -basicKitOffset)
        : undefined;

      const planAccessoriesDate = formData.fatStart
        ? addDays(formData.fatStart, -accessoriesOffset)
        : undefined;

      const payload = {
        projectName: formData.projectName,
        wbs: formData.wbs,
        planStart: format(formData.planStart, "yyyy-MM-dd"),
        fatStart: formatNullableDate(formData.fatStart),
        quantity: 0,
        category: "PIX",
        vendorPanel: "",
        vendorBusbar: "",
        panelProgress: 0,
        statusBusbar: "Punching/Bending",
        planDeliveryBasicKitPanel: formatNullableDate(planBasicKitDate),
        planDeliveryBasicKitBusbar: formatNullableDate(planBasicKitDate),
        planDeliveryAccessoriesPanel: formatNullableDate(planAccessoriesDate),
        planDeliveryAccessoriesBusbar: formatNullableDate(planAccessoriesDate),
      };

      const role = useAuthStore.getState().role;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Role": role || "",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menambah proyek.");
      }
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error adding project:", error);
      alert(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Tambah Proyek Baru</DialogTitle>
        <DialogDescription>
          Isi detail proyek di bawah ini.
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="max-h-[60vh] pr-6">
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="projectName" className="text-left">
              Nama Proyek
            </Label>
            <Input
              id="projectName"
              value={formData.projectName}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="wbs" className="text-left">
              WBS
            </Label>
            <Input
              id="wbs"
              value={formData.wbs}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="planStart" className="text-left">
              Plan Start
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !formData.planStart && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.planStart ? (
                    format(formData.planStart, "PPP")
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.planStart}
                  onSelect={handlePlanStartDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fatStart" className="text-left">
              FAT Start
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !formData.fatStart && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.fatStart ? (
                    format(formData.fatStart, "PPP")
                  ) : (
                    <span>Pilih tanggal (Opsional)</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.fatStart}
                  onSelect={handleFatStartDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Separator className="my-2" />

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="basicKitOffset" className="text-left col-span-4">
              Offset Basic Kit (H-)
              <p className="text-xs text-muted-foreground font-light">
                Jarak hari dari Plan Start.
              </p>
            </Label>
            <Input
              id="basicKitOffset"
              type="number"
              value={basicKitOffset}
              onChange={(e) =>
                setBasicKitOffset(parseInt(e.target.value) || 0)
              }
              className="col-span-2"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="accessoriesOffset" className="text-left col-span-4">
              Offset Accessories (H-)
              <p className="text-xs text-muted-foreground font-light">
                Jarak hari dari FAT Start.
              </p>
            </Label>
            <Input
              id="accessoriesOffset"
              type="number"
              value={accessoriesOffset}
              onChange={(e) =>
                setAccessoriesOffset(parseInt(e.target.value) || 0)
              }
              className="col-span-2"
            />
          </div>
        </div>
      </ScrollArea>

      <DialogFooter>
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Menyimpan..." : "Simpan Proyek"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}