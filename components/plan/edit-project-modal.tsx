"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Project, useAuthStore } from "@/lib/types";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FormData {
  projectName: string;
  wbs: string;
  category: string;
  planStart: Date | null | undefined;
  quantity: number;
  vendorPanel: string;
  vendorBusbar: string;
  panelProgress: number;
  statusBusbar: string;
  fatStart: Date | null | undefined;
  planDeliveryBasicKitPanel: Date | null | undefined;
  planDeliveryBasicKitBusbar: Date | null | undefined;
  actualDeliveryBasicKitPanel: Date | null | undefined;
  actualDeliveryBasicKitBusbar: Date | null | undefined;
  planDeliveryAccessoriesPanel: Date | null | undefined;
  planDeliveryAccessoriesBusbar: Date | null | undefined;
  actualDeliveryAccessoriesPanel: Date | null | undefined;
  actualDeliveryAccessoriesBusbar: Date | null | undefined;
}

interface EditProjectModalProps {
  project: Project;
  setIsOpen: (open: boolean) => void;
}

const parseNullableDate = (dateStr: string | null | undefined): Date | null => {
  return dateStr ? new Date(dateStr) : null;
};

const formatNullableDate = (date: Date | null | undefined): string | null => {
  return date ? format(date, "yyyy-MM-dd") : null;
};
export function EditProjectModal({ project, setIsOpen }: EditProjectModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const role = useAuthStore((state) => state.role);
  const companyName = useAuthStore((state) => state.companyName);
  const isVendor = role === "External/Vendor";
  const isAdmin = role === "Admin" || role === "admin";

  const isPanelVendor = isVendor && companyName === project.vendorPanel;
  const isBusbarVendor = isVendor && companyName === project.vendorBusbar;

  const checkCanGoToStep2 = (p: Project) => {
    const isPanel = isVendor && companyName === p.vendorPanel;
    const isBusbar = isVendor && companyName === p.vendorBusbar;
    const panelOK = isPanel ? p.panelProgress === 100 : true;
    const busbarOK = isBusbar ? p.statusBusbar === "Done" : true;
    return panelOK && busbarOK;
  };

  const checkCanGoToStep3 = (p: Project) => {
    if (!checkCanGoToStep2(p)) return false;
    const isPanel = isVendor && companyName === p.vendorPanel;
    const isBusbar = isVendor && companyName === p.vendorBusbar;
    const panelOK = isPanel ? p.actualDeliveryBasicKitPanel != null : true;
    const busbarOK = isBusbar ? p.actualDeliveryBasicKitBusbar != null : true;
    return panelOK && busbarOK;
  };

  const [formData, setFormData] = useState<FormData>({
    projectName: project.projectName || "",
    wbs: project.wbs || "",
    category: project.category || "PIX",
    planStart: project.planStart ? new Date(project.planStart) : undefined,
    quantity: project.quantity || 0,
    vendorPanel: project.vendorPanel || "",
    vendorBusbar: project.vendorBusbar || "",
    panelProgress: project.panelProgress || 0,
    statusBusbar: project.statusBusbar || "Punching/Bending",
    fatStart: parseNullableDate(project.fatStart),
    planDeliveryBasicKitPanel: parseNullableDate(
      project.planDeliveryBasicKitPanel
    ),
    planDeliveryBasicKitBusbar: parseNullableDate(
      project.planDeliveryBasicKitBusbar
    ),
    actualDeliveryBasicKitPanel: parseNullableDate(
      project.actualDeliveryBasicKitPanel
    ),
    actualDeliveryBasicKitBusbar: parseNullableDate(
      project.actualDeliveryBasicKitBusbar
    ),
    planDeliveryAccessoriesPanel: parseNullableDate(
      project.planDeliveryAccessoriesPanel
    ),
    planDeliveryAccessoriesBusbar: parseNullableDate(
      project.planDeliveryAccessoriesBusbar
    ),
    actualDeliveryAccessoriesPanel: parseNullableDate(
      project.actualDeliveryAccessoriesPanel
    ),
    actualDeliveryAccessoriesBusbar: parseNullableDate(
      project.actualDeliveryAccessoriesBusbar
    ),
  });

  const [basicKitOffset, setBasicKitOffset] = useState<number>(7);
  const [accessoriesOffset, setAccessoriesOffset] = useState<number>(7);

  const [step, setStep] = useState(1);

  useEffect(() => {
    if (project) {
      setFormData({
        projectName: project.projectName,
        wbs: project.wbs,
        category: project.category,
        planStart: new Date(project.planStart),
        quantity: project.quantity,
        vendorPanel: project.vendorPanel,
        vendorBusbar: project.vendorBusbar,
        panelProgress: project.panelProgress,
        statusBusbar: project.statusBusbar,
        fatStart: parseNullableDate(project.fatStart),
        planDeliveryBasicKitPanel: parseNullableDate(
          project.planDeliveryBasicKitPanel
        ),
        planDeliveryBasicKitBusbar: parseNullableDate(
          project.planDeliveryBasicKitBusbar
        ),
        actualDeliveryBasicKitPanel: parseNullableDate(
          project.actualDeliveryBasicKitPanel
        ),
        actualDeliveryBasicKitBusbar: parseNullableDate(
          project.actualDeliveryBasicKitBusbar
        ),
        planDeliveryAccessoriesPanel: parseNullableDate(
          project.planDeliveryAccessoriesPanel
        ),
        planDeliveryAccessoriesBusbar: parseNullableDate(
          project.planDeliveryAccessoriesBusbar
        ),
        actualDeliveryAccessoriesPanel: parseNullableDate(
          project.actualDeliveryAccessoriesPanel
        ),
        actualDeliveryAccessoriesBusbar: parseNullableDate(
          project.actualDeliveryAccessoriesBusbar
        ),
      });

      if (isVendor) {
        const canGo2 = checkCanGoToStep2(project);
        const canGo3 = checkCanGoToStep3(project);

        const projectStep3Unfilled =
          (isPanelVendor && !project.actualDeliveryAccessoriesPanel) ||
          (isBusbarVendor && !project.actualDeliveryAccessoriesBusbar);

        let initialStep = 1;
        if (!canGo2) {
          initialStep = 1;
        } else if (!canGo3) {
          initialStep = 2;
        } else if (projectStep3Unfilled) {
          initialStep = 3;
        } else {
          initialStep = 3;
        }

        setStep(initialStep);
      }
    }
  }, [project, isVendor, isPanelVendor, isBusbarVendor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSelectChange = (id: keyof FormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleNullableDateChange =
    (field: keyof FormData) => (date: Date | undefined) => {
      if (field === "planStart") {
        if (date) {
          const planBasicKitDate = addDays(date, -basicKitOffset);
          setFormData((prev) => ({
            ...prev,
            planStart: date,
            planDeliveryBasicKitPanel: planBasicKitDate,
            planDeliveryBasicKitBusbar: planBasicKitDate,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            planStart: null,
            planDeliveryBasicKitPanel: null,
            planDeliveryBasicKitBusbar: null,
          }));
        }
      } else if (field === "fatStart") {
        if (date) {
          const planAccessoriesDate = addDays(date, -accessoriesOffset);
          setFormData((prev) => ({
            ...prev,
            fatStart: date,
            planDeliveryAccessoriesPanel: planAccessoriesDate,
            planDeliveryAccessoriesBusbar: planAccessoriesDate,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            fatStart: null,
            planDeliveryAccessoriesPanel: null,
            planDeliveryAccessoriesBusbar: null,
          }));
        }
      } else {
        setFormData((prev) => ({ ...prev, [field]: date || null }));
      }
    };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (!isAdmin && !isPanelVendor && !isBusbarVendor) {
        throw new Error("Anda tidak memiliki izin untuk mengedit proyek ini.");
      }

      const payload: Partial<Project> = {
        ...project,
        projectName: formData.projectName,
        wbs: formData.wbs,
        category: formData.category as "PIX" | "MCZ",
        quantity: formData.quantity,
        vendorPanel: formData.vendorPanel,
        vendorBusbar: formData.vendorBusbar,
        panelProgress: formData.panelProgress,
        statusBusbar: formData.statusBusbar as
          | "Punching/Bending"
          | "Plating"
          | "Heatshrink"
          | "Done",
        planStart: formData.planStart
          ? format(formData.planStart, "yyyy-MM-dd")
          : project.planStart,
        fatStart: formatNullableDate(formData.fatStart),
        planDeliveryBasicKitPanel: formatNullableDate(
          formData.planDeliveryBasicKitPanel
        ),
        planDeliveryBasicKitBusbar: formatNullableDate(
          formData.planDeliveryBasicKitBusbar
        ),
        planDeliveryAccessoriesPanel: formatNullableDate(
          formData.planDeliveryAccessoriesPanel
        ),
        planDeliveryAccessoriesBusbar: formatNullableDate(
          formData.planDeliveryAccessoriesBusbar
        ),
        actualDeliveryBasicKitPanel: formatNullableDate(
          formData.actualDeliveryBasicKitPanel
        ),
        actualDeliveryBasicKitBusbar: formatNullableDate(
          formData.actualDeliveryBasicKitBusbar
        ),
        actualDeliveryAccessoriesPanel: formatNullableDate(
          formData.actualDeliveryAccessoriesPanel
        ),
        actualDeliveryAccessoriesBusbar: formatNullableDate(
          formData.actualDeliveryAccessoriesBusbar
        ),
      };

      const currentUserRole = useAuthStore.getState().role;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${project.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Role": currentUserRole || "",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengupdate proyek.");
      }
      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Error updating project:", error);
      alert(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  const isGeneralInfoDisabled = !isAdmin;
  const isTanggalDisabled = !isAdmin;
  const vendorSteps = [
    {
      title: "Langkah 1: Pengerjaan",
      description: "Pengerjaan harus 100% agar bisa dikirim.",
    },
    {
      title: "Langkah 2: Delivery Basic Kit",
      description: "Update tanggal actual delivery basic kit.",
    },
    {
      title: "Langkah 3: Delivery Accessories",
      description: "Update tanggal actual delivery accessories.",
    },
  ];

  const renderAdminView = () => (
    <>
      <div className="flex-grow overflow-y-auto -mx-6 px-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sticky top-0 bg-background z-10">
            <TabsTrigger value="general">General Information</TabsTrigger>
            <TabsTrigger value="tanggal">Tanggal</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="flex flex-col gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="projectName" className="text-left">
                  Nama Proyek
                </Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={handleChange}
                  disabled={isGeneralInfoDisabled}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="wbs" className="text-left">
                  WBS
                </Label>
                <Input
                  id="wbs"
                  value={formData.wbs}
                  onChange={handleChange}
                  disabled={isGeneralInfoDisabled}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="category" className="text-left">
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={handleSelectChange("category")}
                  disabled={isGeneralInfoDisabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="MCZ">MCZ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="quantity" className="text-left">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange}
                  disabled={isGeneralInfoDisabled}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="vendorPanel" className="text-left">
                  Vendor Panel
                </Label>
                <Input
                  id="vendorPanel"
                  value={formData.vendorPanel}
                  onChange={handleChange}
                  disabled={isGeneralInfoDisabled}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="vendorBusbar" className="text-left">
                  Vendor Busbar
                </Label>
                <Input
                  id="vendorBusbar"
                  value={formData.vendorBusbar}
                  onChange={handleChange}
                  disabled={isGeneralInfoDisabled}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="panelProgress" className="text-left">
                  Panel Progress (%)
                </Label>
                <Input
                  id="panelProgress"
                  type="number"
                  value={formData.panelProgress}
                  onChange={handleChange}
                  disabled={isGeneralInfoDisabled}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="statusBusbar" className="text-left">
                  Status Busbar
                </Label>
                <Select
                  value={formData.statusBusbar}
                  onValueChange={handleSelectChange("statusBusbar")}
                  disabled={isGeneralInfoDisabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Punching/Bending">
                      Punching/Bending
                    </SelectItem>
                    <SelectItem value="Plating">Plating</SelectItem>
                    <SelectItem value="Heatshrink">Heatshrink</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tanggal">
            <div className="flex flex-col gap-4 py-4">
              <NullableDatePicker
                label="Plan Start"
                date={formData.planStart}
                onDateChange={handleNullableDateChange("planStart")}
                disabled={isTanggalDisabled}
              />
              <NullableDatePicker
                label="FAT Start"
                date={formData.fatStart}
                onDateChange={handleNullableDateChange("fatStart")}
                disabled={isTanggalDisabled}
              />

              <Separator className="my-2" />

              <div className="grid grid-cols-1 gap-2">
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
                  disabled={isTanggalDisabled}
                  className="w-24"
                />
                <p className="text-xs text-muted-foreground -mt-1">
                  Jarak hari dari Plan Start. Tanggal Plan Basic Kit akan
                  otomatis diatur.
                </p>
              </div>

              <NullableDatePicker
                label="Plan Basic Kit (Panel)"
                date={formData.planDeliveryBasicKitPanel}
                onDateChange={handleNullableDateChange(
                  "planDeliveryBasicKitPanel"
                )}
                note={`Otomatis H-${basicKitOffset} dari Plan Start`}
                disabled
              />
              <NullableDatePicker
                label="Plan Basic Kit (Busbar)"
                date={formData.planDeliveryBasicKitBusbar}
                onDateChange={handleNullableDateChange(
                  "planDeliveryBasicKitBusbar"
                )}
                note={`Otomatis H-${basicKitOffset} dari Plan Start`}
                disabled
              />
              <NullableDatePicker
                label="Actual Basic Kit (Panel)"
                date={formData.actualDeliveryBasicKitPanel}
                onDateChange={handleNullableDateChange(
                  "actualDeliveryBasicKitPanel"
                )}
                disabled={isTanggalDisabled}
              />
              <NullableDatePicker
                label="Actual Basic Kit (Busbar)"
                date={formData.actualDeliveryBasicKitBusbar}
                onDateChange={handleNullableDateChange(
                  "actualDeliveryBasicKitBusbar"
                )}
                disabled={isTanggalDisabled}
              />
              <Separator className="my-2" />

              <div className="grid grid-cols-1 gap-2">
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
                  disabled={isTanggalDisabled}
                  className="w-24"
                />
                <p className="text-xs text-muted-foreground -mt-1">
                  Jarak hari dari FAT Start. Tanggal Plan Accessories akan
                  otomatis diatur.
                </p>
              </div>

              <NullableDatePicker
                label="Plan Accessories (Panel)"
                date={formData.planDeliveryAccessoriesPanel}
                onDateChange={handleNullableDateChange(
                  "planDeliveryAccessoriesPanel"
                )}
                note={`Otomatis H-${accessoriesOffset} dari FAT Start`}
                disabled
              />
              <NullableDatePicker
                label="Plan Accessories (Busbar)"
                date={formData.planDeliveryAccessoriesBusbar}
                onDateChange={handleNullableDateChange(
                  "planDeliveryAccessoriesBusbar"
                )}
                note={`Otomatis H-${accessoriesOffset} dari FAT Start`}
                disabled
              />
              <NullableDatePicker
                label="Actual Accessories (Panel)"
                date={formData.actualDeliveryAccessoriesPanel}
                onDateChange={handleNullableDateChange(
                  "actualDeliveryAccessoriesPanel"
                )}
                disabled={isTanggalDisabled}
              />
              <NullableDatePicker
                label="Actual Accessories (Busbar)"
                date={formData.actualDeliveryAccessoriesBusbar}
                onDateChange={handleNullableDateChange(
                  "actualDeliveryAccessoriesBusbar"
                )}
                disabled={isTanggalDisabled}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <DialogFooter className="pt-4 border-t">
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </DialogFooter>
    </>
  );

  const renderVendorView = () => {
    const panelStep1Complete = isPanelVendor
      ? formData.panelProgress === 100
      : true;
    const busbarStep1Complete = isBusbarVendor
      ? formData.statusBusbar === "Done"
      : true;
    const canGoToStep2 = panelStep1Complete && busbarStep1Complete;

    const panelStep2Complete = isPanelVendor
      ? formData.actualDeliveryBasicKitPanel != null
      : true;
    const busbarStep2Complete = isBusbarVendor
      ? formData.actualDeliveryBasicKitBusbar != null
      : true;
    const canGoToStep3 =
      canGoToStep2 && panelStep2Complete && busbarStep2Complete;

    return (
      <>
        <div className="flex-grow overflow-y-auto px-6 py-4">
          <div className="mb-6 flex flex-col gap-2">
            {vendorSteps.map((s, index) => {
              const stepNumber = index + 1;

              let isClickable = false;
              let isCompleted = false;

              if (stepNumber === 1) {
                isClickable = true;
                isCompleted = canGoToStep2;
              } else if (stepNumber === 2) {
                isClickable = canGoToStep2;
                isCompleted = canGoToStep3;
              } else if (stepNumber === 3) {
                isClickable = canGoToStep3;
                const panelStep3Complete = isPanelVendor
                  ? formData.actualDeliveryAccessoriesPanel != null
                  : true;
                const busbarStep3Complete = isBusbarVendor
                  ? formData.actualDeliveryAccessoriesBusbar != null
                  : true;
                isCompleted =
                  canGoToStep3 && panelStep3Complete && busbarStep3Complete;
              }

              return (
                <StepItem
                  key={index}
                  stepNumber={stepNumber}
                  title={s.title}
                  description={s.description}
                  isCurrent={step === stepNumber}
                  isCompleted={isCompleted}
                  isLastStep={index === vendorSteps.length - 1}
                  onClick={() => {
                    if (isClickable) {
                      setStep(stepNumber);
                    }
                  }}
                  disabled={!isClickable}
                />
              );
            })}
          </div>
          <Separator className="my-4" />

          <div className="flex flex-col gap-4">
            {step === 1 && (
              <>
                {isPanelVendor && (
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="panelProgress" className="text-left">
                      Panel Progress (%)
                    </Label>
                    <Input
                      id="panelProgress"
                      type="number"
                      value={formData.panelProgress}
                      onChange={handleChange}
                      disabled={!isPanelVendor}
                    />
                    <Button onClick={handleSubmit} disabled={isLoading}>
                      {isLoading ? "Is Saving..." : "Save"}
                    </Button>
                  </div>
                )}
                {isBusbarVendor && (
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="statusBusbar" className="text-left">
                      Status Busbar
                    </Label>
                    <Select
                      value={formData.statusBusbar}
                      onValueChange={handleSelectChange("statusBusbar")}
                      disabled={!isBusbarVendor}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Punching/Bending">
                          Punching/Bending
                        </SelectItem>
                        <SelectItem value="Plating">Plating</SelectItem>
                        <SelectItem value="Heatshrink">Heatshrink</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                      {isLoading ? "Is Saving..." : "Save"}
                    </Button>
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                {isPanelVendor && (
                  <NullableDatePicker
                    label="Actual Basic Kit (Panel)"
                    date={formData.actualDeliveryBasicKitPanel}
                    onDateChange={handleNullableDateChange(
                      "actualDeliveryBasicKitPanel"
                    )}
                    disabled={!isPanelVendor}
                  />
                )}
                {isBusbarVendor && (
                  <NullableDatePicker
                    label="Actual Basic Kit (Busbar)"
                    date={formData.actualDeliveryBasicKitBusbar}
                    onDateChange={handleNullableDateChange(
                      "actualDeliveryBasicKitBusbar"
                    )}
                    disabled={!isBusbarVendor}
                  />
                )}
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? "Is Saving..." : "Save"}
                </Button>
              </>
            )}

            {step === 3 && (
              <>
                {isPanelVendor && (
                  <NullableDatePicker
                    label="Actual Accessories (Panel)"
                    date={formData.actualDeliveryAccessoriesPanel}
                    onDateChange={handleNullableDateChange(
                      "actualDeliveryAccessoriesPanel"
                    )}
                    disabled={!isPanelVendor || !canGoToStep3}
                    note={
                      !canGoToStep3
                        ? "Isi Actual Basic Kit Panel terlebih dahulu di Langkah 2."
                        : undefined
                    }
                  />
                )}
                {isBusbarVendor && (
                  <NullableDatePicker
                    label="Actual Accessories (Busbar)"
                    date={formData.actualDeliveryAccessoriesBusbar}
                    onDateChange={handleNullableDateChange(
                      "actualDeliveryAccessoriesBusbar"
                    )}
                    disabled={!isBusbarVendor || !canGoToStep3}
                    note={
                      !canGoToStep3
                        ? "Isi Actual Basic Kit Busbar terlebih dahulu di Langkah 2."
                        : undefined
                    }
                  />
                )}

                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? "Is Saving..." : "Save"}
                </Button>
              </>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
      <DialogHeader>
        <DialogTitle>Edit Proyek: {project.projectName}</DialogTitle>
        <DialogDescription>
          {isAdmin
            ? "Ubah detail proyek di bawah ini."
            : `Anda mengedit sebagai ${companyName}.`}
        </DialogDescription>
      </DialogHeader>

      {isAdmin ? renderAdminView() : renderVendorView()}
    </DialogContent>
  );
}

interface NullableDatePickerProps {
  label: string;
  date: Date | null | undefined;
  onDateChange: (date: Date | undefined) => void;
  disabled?: boolean;
  note?: string;
}

function NullableDatePicker({
  label,
  date,
  onDateChange,
  disabled = false,
  note,
}: NullableDatePickerProps) {
  return (
    <div className="grid grid-cols-1 gap-2">
      <Label className={cn("text-left", disabled && "text-muted-foreground")}>
        {label}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              disabled && "bg-muted/50 text-muted-foreground cursor-not-allowed"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : "Pilih tanggal"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date || undefined}
            onSelect={onDateChange}
            initialFocus
          />
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onDateChange(undefined)}
            >
              <X className="mr-2 h-4 w-4" />
              Kosongkan
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {note && <p className="text-xs text-muted-foreground -mt-1">{note}</p>}
    </div>
  );
}

interface StepItemProps {
  stepNumber: number;
  title: string;
  description: string;
  isCurrent: boolean;
  isCompleted: boolean;
  isLastStep: boolean;
  onClick: () => void;
  disabled: boolean;
}

function StepItem({
  title,
  description,
  isCurrent,
  isCompleted,
  isLastStep,
  onClick,
  disabled,
}: StepItemProps) {
  const isUpcoming = !isCurrent && !isCompleted;

  return (
    <div
      className={cn(
        "flex gap-4 relative p-2 -m-2 rounded-lg transition-colors",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        isCurrent ? "bg-muted" : disabled ? "" : "hover:bg-muted/50"
      )}
      onClick={disabled ? undefined : onClick}
    >
      {!isLastStep && (
        <div
          className={cn(
            "absolute left-6 top-10 -bottom-2 w-0.5 z-0",
            isCompleted ? "bg-[#008A15]" : "bg-border"
          )}
        />
      )}

      <div className="flex-shrink-0 z-10">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center border-2 bg-background",
            isCompleted
              ? "bg-[#008A15] border-[#008A15] text-primary-foreground"
              : "",
            isCurrent ? "border-[#008A15]" : "",
            isUpcoming ? "border-border" : ""
          )}
        >
          {isCompleted ? (
            <Check className="w-5 h-5" />
          ) : isCurrent ? (
            <div className="w-2.5 h-2.5 rounded-full bg-[#008A15]" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-border" />
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col pt-0.5",
          isUpcoming && !disabled ? "opacity-60" : ""
        )}
      >
        <p
          className={cn(
            "font-semibold",
            isCurrent ? "text-primary" : "text-foreground"
          )}
        >
          {title}
        </p>
        <p className="text-sm font-light text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}