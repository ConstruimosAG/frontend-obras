"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { itemSchema, itemEditSchema } from "@/lib/schemas";
import type { Item, User } from "@/lib/types";
import { Loader2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
  workId?: number;
  onSubmit: (data: any) => Promise<void> | void;
  isSubmitting?: boolean;
  coordinator?: boolean;
  contractors?: User[];
  editingQuoteItem?: any;
  titles?: string[] | null;
  selectedTitle?: string;
}

export function ItemModal({
  open,
  onOpenChange,
  item,
  workId,
  onSubmit,
  isSubmitting = false,
  coordinator = true,
  contractors = [],
  editingQuoteItem,
  titles = [],
  selectedTitle = "",
}: ItemModalProps) {
  const isEditing = Boolean(item);
  const isEditingQuote = Boolean(editingQuoteItem);
  const [showSummary, setShowSummary] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    estimatedExecutionTime: "",
    contractorId: "",
    active: true,
    construimosAG: false,
    actividad: "",
    unidad: "UND",
    cantidad: "",
    precioUnitario: "",
    precioTotal: "",
    materialesObservaciones: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!open) {
      setShowSummary(false);
      setPendingPayload(null);
      return;
    }

    if (editingQuoteItem) {

      // Support string-encoded JSON if the backend returns it that way
      let subqData: any = editingQuoteItem.subquotations;
      if (typeof subqData === "string") {
        try { subqData = JSON.parse(subqData); } catch (e) { subqData = {}; }
      }

      let materialsData: any = editingQuoteItem.materials;
      if (typeof materialsData === "string") {
        try { materialsData = JSON.parse(materialsData); } catch (e) { materialsData = {}; }
      }

      // Exact mapping from schema example: item_1
      const subq = subqData?.item_1 || {};

      setFormData({
        title: item?.title || "",
        description: item?.description || "",
        estimatedExecutionTime: item?.estimatedExecutionTime?.toString() || "",
        contractorId: item?.contractorId?.toString() || "",
        active: item?.active ?? true,
        construimosAG: true,
        actividad: subq.description || "",
        unidad: subq.unit || "UND",
        cantidad: subq.measure?.toString() || "",
        precioUnitario: subq.unitValue?.toString() || "",
        precioTotal: subq.totalValue?.toString() || editingQuoteItem.subtotal?.toString() || "",
        materialesObservaciones: materialsData?.description || "",
      });
    } else if (item) {
      setFormData({
        title: item.title || "",
        description: item.description,
        estimatedExecutionTime: item.estimatedExecutionTime?.toString() || "",
        contractorId: item.contractorId?.toString() || "",
        active: item.active,
        construimosAG: false,
        actividad: "",
        unidad: "UND",
        cantidad: "",
        precioUnitario: "",
        precioTotal: "",
        materialesObservaciones: "",
      });
    } else {
      setFormData({
        title: selectedTitle,
        description: "",
        estimatedExecutionTime: "",
        contractorId: "",
        active: true,
        construimosAG: false,
        actividad: "",
        unidad: "UND",
        cantidad: "",
        precioUnitario: "",
        precioTotal: "",
        materialesObservaciones: "",
      });
    }
    setErrors({});
  }, [item, open, editingQuoteItem, selectedTitle]);

  const formatCurrency = (value: string | number) => {
    if (!value && value !== 0) return "";
    // Ensure we are working with a string that has . as decimal separator for parseFloat
    let strValue = value.toString().replace(/,/g, ".");
    const num = parseFloat(strValue);
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    // Allow digits, dot and comma. Dot and comma are treated as decimals.
    // Thousand separators (dots in es-CO) are stripped.
    let val = e.target.value;
    
    // If there's a comma, dots are definitely thousands.
    // If there's only dots, the last one might be a decimal or a thousand.
    // To be safe and simple: strip everything except digits and the LAST separator.
    let filtered = val.replace(/[^0-9.,]/g, "");
    const lastDot = filtered.lastIndexOf(".");
    const lastComma = filtered.lastIndexOf(",");
    const lastSeparatorIndex = Math.max(lastDot, lastComma);

    let finalValue = "";
    if (lastSeparatorIndex !== -1) {
      const integerPart = filtered.substring(0, lastSeparatorIndex).replace(/[.,]/g, "");
      const decimalPart = filtered.substring(lastSeparatorIndex + 1).replace(/[.,]/g, "");
      finalValue = integerPart + "." + decimalPart;
    } else {
      finalValue = filtered;
    }

    setFormData(prev => ({ ...prev, [field]: finalValue }));
  };

  // Recalculate Total
  useEffect(() => {
    if (formData.cantidad && formData.precioUnitario) {
      // Normalize cantidad and precioUnitario (replace comma with dot if any)
      const cantStr = formData.cantidad.toString().replace(/,/g, ".");
      const puStr = formData.precioUnitario.toString().replace(/,/g, ".");
      
      const cant = Number.parseFloat(cantStr);
      const pu = Number.parseFloat(puStr);
      if (!isNaN(cant) && !isNaN(pu)) {
        setFormData(prev => ({ ...prev, precioTotal: (cant * pu).toString() }));
      }
    }
  }, [formData.cantidad, formData.precioUnitario]);

  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      if (formData.construimosAG || isEditingQuote) {
        if (!formData.actividad.trim()) {
          setErrors(prev => ({ ...prev, actividad: "La actividad es obligatoria" }));
          return;
        }
        if (!formData.cantidad || Number.parseFloat(formData.cantidad) <= 0) {
          setErrors(prev => ({ ...prev, cantidad: "La cantidad debe ser mayor a 0" }));
          return;
        }
        if (!formData.precioUnitario || Number.parseFloat(formData.precioUnitario) <= 0) {
          setErrors(prev => ({ ...prev, precioUnitario: "El precio unitario debe ser mayor a 0" }));
          return;
        }
      }

      if (!isEditingQuote && titles && titles.length > 0) {
        if (!formData.title?.trim()) {
          setErrors(prev => ({ ...prev, title: "Debes seleccionar un título" }));
          return;
        }
      }

      const payload: any = {
        title: formData.title || null,
        description: formData.description,
        estimatedExecutionTime: formData.estimatedExecutionTime
          ? Number.parseInt(formData.estimatedExecutionTime, 10)
          : null,
        contractorId: formData.contractorId ? Number.parseInt(formData.contractorId, 10) : null,
        active: formData.active,
        construimosAG: formData.construimosAG && !isEditingQuote,
      };

      if ((formData.construimosAG || isEditingQuote)) {
        // Normalize for API
        const cantStr = formData.cantidad.toString().replace(/,/g, ".");
        const puStr = formData.precioUnitario.toString().replace(/,/g, ".");
        const ptStr = formData.precioTotal.toString().replace(/,/g, ".");

        payload.quoteData = {
          actividad: formData.actividad,
          unidad: formData.unidad,
          cantidad: Number.parseFloat(cantStr),
          precioUnitario: Number.parseFloat(puStr),
          precioTotal: Number.parseFloat(ptStr || "0"),
          materialesObservaciones: formData.materialesObservaciones,
        };
      }

      if (isEditing && !isEditingQuote) {
        itemEditSchema.parse({
          description: payload.description,
          estimatedExecutionTime: payload.estimatedExecutionTime,
        });
      } else if (!isEditingQuote) {
        itemSchema.parse({
          description: payload.description,
          estimatedExecutionTime: payload.estimatedExecutionTime,
        });
      }

      if (!isEditing && !isEditingQuote && !showSummary) {
        setPendingPayload(payload);
        setShowSummary(true);
        return;
      }

      setLocalLoading(true);
      await onSubmit(payload);
      onOpenChange(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
      console.error(error);
    } finally {
      setLocalLoading(false);
    }
  };

  const selectedContractor = contractors.find(
    (c) => c.id.toString() === formData.contractorId
  );

  const combinedSubmitting = isSubmitting || localLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-3xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {showSummary
              ? "Resumen de Creación de Ítem"
              : isEditingQuote
                ? "Modificar Cotización Construimos AG"
                : isEditing
                  ? "Editar Ítem"
                  : "Crear Nuevo Ítem"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {showSummary
              ? "Verifica que la información sea correcta antes de crear el ítem."
              : isEditingQuote
                ? "Modifica la información de la cotización."
                : isEditing
                  ? "Modifica la información general de este ítem."
                  : "Completa la información para crear un nuevo ítem en la obra."}
          </DialogDescription>
        </DialogHeader>

        {showSummary && pendingPayload ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg border">
                <h4 className="text-sm font-semibold text-purple-600 mb-3">Información General</h4>
                <div className="space-y-2 text-sm">
                  {pendingPayload.title && (
                    <div>
                      <span className="font-medium text-muted-foreground">Título:</span>
                      <p className="mt-1 font-semibold text-purple-700 dark:text-purple-400">{pendingPayload.title}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-muted-foreground">Descripción:</span>
                    <p className="mt-1 break-words">{pendingPayload.description}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Tiempo Estimado:</span>
                    <p className="mt-1">{pendingPayload.estimatedExecutionTime} horas</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Realizado por:</span>
                    <p className="mt-1 font-semibold">{pendingPayload.construimosAG ? "Construimos AG" : (selectedContractor?.name || "Sin contratista asignado")}</p>
                  </div>
                </div>
              </div>

              {pendingPayload.construimosAG && pendingPayload.quoteData && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800">
                  <h4 className="text-sm font-semibold text-purple-600 mb-3">Cotización Inicial</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Actividad:</span>
                      <p className="mt-1 break-words">{pendingPayload.quoteData.actividad}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium text-muted-foreground">Cantidad:</span>
                        <p className="mt-1">{pendingPayload.quoteData.cantidad} {pendingPayload.quoteData.unidad}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Precio Unitario:</span>
                        <p className="mt-1">${Number(pendingPayload.quoteData.precioUnitario).toLocaleString()}</p>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Precio Total:</span>
                      <p className="mt-1 font-bold text-purple-700 dark:text-purple-400">${Number(pendingPayload.quoteData.precioTotal).toLocaleString()}</p>
                    </div>
                    {pendingPayload.quoteData.materialesObservaciones && (
                      <div>
                        <span className="font-medium text-muted-foreground">Materiales/Observaciones:</span>
                        <p className="mt-1 break-words">{pendingPayload.quoteData.materialesObservaciones}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSummary(false)}
                className="w-full sm:w-auto"
                disabled={combinedSubmitting}
              >
                Volver a editar
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  try {
                    setLocalLoading(true);
                    await onSubmit(pendingPayload);
                    onOpenChange(false);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setLocalLoading(false);
                  }
                }}
                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2"
                disabled={combinedSubmitting}
              >
                {combinedSubmitting && <Loader2 className="animate-spin h-4 w-4" />}
                Confirmar y crear ítem
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {isEditing && item && !isEditingQuote && (
              <div className="hidden">
                <Label>Item ID</Label>
                <Input value={`#${item.id}`} disabled className="bg-muted" />
              </div>
            )}

            {(!isEditingQuote && titles && titles.length > 0) && (
              <div className="space-y-2">
                <Label>Título Padre</Label>
                <Input value={formData.title} disabled className="bg-muted dark:text-black/80 font-semibold" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">
                Descripción <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe el ítem..."
                rows={3}
                aria-invalid={!!errors.description}
                disabled={combinedSubmitting || isEditingQuote}
                className={isEditing ? "bg-muted dark:text-black/80" : "dark:text-black/80"}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  La descripción no puede ser modificada
                </p>
              )}
            </div>

            {(!isEditing || isEditingQuote) && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="construimosAG"
                  checked={formData.construimosAG}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, construimosAG: checked as boolean })
                  }
                  disabled={combinedSubmitting || isEditingQuote}
                />
                <Label
                  htmlFor="construimosAG"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Es realizado por Construimos AG
                </Label>
              </div>
            )}

            {/* Contratista o Cotización */}
            {(!formData.construimosAG || isEditing) && !isEditingQuote && (
              <div className="space-y-2">
                <Label htmlFor="contractorId">Contratista</Label>
                {isEditing ? (
                  <>
                    <Input
                      id="contractorId"
                      value={selectedContractor?.name || "Sin contratista asignado"}
                      disabled
                      className="bg-muted dark:text-black/80"
                    />
                    <p className="text-xs text-muted-foreground">
                      El contratista no puede ser modificado
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Select
                      value={formData.contractorId || "none"}
                      onValueChange={(value) => {
                        if (value === "none") {
                          setFormData({ ...formData, contractorId: "" });
                        } else {
                          setFormData({ ...formData, contractorId: value });
                        }
                      }}
                      disabled={combinedSubmitting}
                    >
                      <SelectTrigger className="w-full dark:text-black/80">
                        <SelectValue placeholder="Seleccionar contratista (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">Sin contratista</span>
                        </SelectItem>
                        {contractors.map((contractor) => (
                          <SelectItem
                            key={contractor.id}
                            value={contractor.id.toString()}
                          >
                            {contractor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.contractorId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        onClick={() => setFormData({ ...formData, contractorId: "" })}
                        disabled={combinedSubmitting}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Limpiar selección</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {(formData.construimosAG || isEditingQuote) && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/20">
                <div className="font-semibold text-sm">Información de Cotización Inicial</div>

                <div className="space-y-2">
                  <Label htmlFor="actividad">Actividad <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="actividad"
                    value={formData.actividad}
                    onChange={(e) => setFormData({ ...formData, actividad: e.target.value })}
                    placeholder="Descripción de la actividad..."
                    disabled={combinedSubmitting}
                  />
                  {errors.actividad && <p className="text-sm text-destructive">{errors.actividad}</p>}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="cantidad" className="truncate block">Cantidad <span className="text-red-500">*</span></Label>
                    <Input
                      id="cantidad"
                      type="text"
                      value={formData.cantidad.toString().replace(/\./g, ",")}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^0-9.,]/g, "");
                        const lastDot = val.lastIndexOf(".");
                        const lastComma = val.lastIndexOf(",");
                        const lastSep = Math.max(lastDot, lastComma);
                        
                        if (lastSep !== -1) {
                          const intP = val.substring(0, lastSep).replace(/[.,]/g, "");
                          const decP = val.substring(lastSep + 1).replace(/[.,]/g, "");
                          setFormData({ ...formData, cantidad: intP + "." + decP });
                        } else {
                          setFormData({ ...formData, cantidad: val });
                        }
                      }}
                      placeholder="0,00"
                      disabled={combinedSubmitting}
                      className="w-full"
                    />
                    {errors.cantidad && <p className="text-sm text-destructive truncate">{errors.cantidad}</p>}
                  </div>

                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="unidad" className="truncate block">Unidad</Label>
                    <Select
                      value={formData.unidad}
                      onValueChange={(value) => setFormData({ ...formData, unidad: value })}
                      disabled={combinedSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue className="truncate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UND">UND</SelectItem>
                        <SelectItem value="M2">M2</SelectItem>
                        <SelectItem value="M3">M3</SelectItem>
                        <SelectItem value="ML">ML</SelectItem>
                        <SelectItem value="KM">KM</SelectItem>
                        <SelectItem value="KG">KG</SelectItem>
                        <SelectItem value="LT">LT</SelectItem>
                        <SelectItem value="GLB">GLB</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="DIA">DIA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="precioUnitario" className="whitespace-nowrap truncate block">
                      Precio U. <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="precioUnitario"
                      type="text"
                      value={formatCurrency(formData.precioUnitario)}
                      onChange={(e) => handleCurrencyChange(e, "precioUnitario")}
                      placeholder="0"
                      disabled={combinedSubmitting}
                      className="w-full font-medium"
                    />
                    {errors.precioUnitario && <p className="text-sm text-destructive truncate">{errors.precioUnitario}</p>}
                  </div>

                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="precioTotal" className="truncate block">Precio Total</Label>
                    <Input
                      id="precioTotal"
                      type="text"
                      value={formatCurrency(formData.precioTotal)}
                      readOnly
                      className="bg-muted w-full font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="materialesObservaciones">Materiales y/o Observaciones</Label>
                  <Textarea
                    id="materialesObservaciones"
                    value={formData.materialesObservaciones}
                    onChange={(e) => setFormData({ ...formData, materialesObservaciones: e.target.value })}
                    placeholder="Materiales requeridos u observaciones adicionales..."
                    disabled={combinedSubmitting}
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Other Fields */}
            <div className="space-y-2">
              <Label htmlFor="estimatedExecutionTime" className="whitespace-nowrap truncate block">
                Tiempo Estimado (horas) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="estimatedExecutionTime"
                type="number"
                step="any"
                min="1"
                value={formData.estimatedExecutionTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedExecutionTime: e.target.value,
                  })
                }
                placeholder="Ex: 40"
                aria-invalid={!!errors.estimatedExecutionTime}
                disabled={combinedSubmitting || isEditingQuote}
                className={isEditing ? "bg-muted dark:text-black/80" : "dark:text-black/80"}
              />
              {errors.estimatedExecutionTime && (
                <p className="text-sm text-destructive">
                  {errors.estimatedExecutionTime}
                </p>
              )}
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  El tiempo estimado no puede ser modificado
                </p>
              )}
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
                disabled={combinedSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center gap-2"
                disabled={combinedSubmitting}
              >
                {combinedSubmitting && <Loader2 className="animate-spin h-4 w-4" />}
                {isEditingQuote
                  ? "Guardar cotización"
                  : isEditing
                    ? "Guardar cambios"
                    : "Crear ítem"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}