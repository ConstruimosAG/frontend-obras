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
}: ItemModalProps) {
  const isEditing = Boolean(item);
  const isEditingQuote = Boolean(editingQuoteItem);
  const [formData, setFormData] = useState({
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
    if (!open) return;

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
  }, [item, open, editingQuoteItem]);

  // Recalculate Total
  useEffect(() => {
    if (formData.cantidad && formData.precioUnitario) {
      const cant = Number.parseFloat(formData.cantidad);
      const pu = Number.parseFloat(formData.precioUnitario);
      if (!isNaN(cant) && !isNaN(pu)) {
        setFormData(prev => ({ ...prev, precioTotal: (cant * pu).toString() }));
      }
    }
  }, [formData.cantidad, formData.precioUnitario]);

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

      const payload: any = {
        description: formData.description,
        estimatedExecutionTime: formData.estimatedExecutionTime
          ? Number.parseInt(formData.estimatedExecutionTime, 10)
          : null,
        contractorId: formData.contractorId ? Number.parseInt(formData.contractorId, 10) : null,
        active: formData.active,
        construimosAG: formData.construimosAG && !isEditingQuote,
      };

      if ((formData.construimosAG || isEditingQuote)) {
        payload.quoteData = {
          actividad: formData.actividad,
          unidad: formData.unidad,
          cantidad: Number.parseFloat(formData.cantidad),
          precioUnitario: Number.parseFloat(formData.precioUnitario),
          precioTotal: Number.parseFloat(formData.precioTotal || "0"),
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
    }
  };

  const selectedContractor = contractors.find(
    (c) => c.id.toString() === formData.contractorId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-3xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {isEditingQuote
              ? "Modificar Cotización Construimos AG"
              : isEditing
                ? "Editar Ítem"
                : "Crear Nuevo Ítem"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEditingQuote
              ? "Modifica la información de la cotización."
              : isEditing
                ? "Modifica la información general de este ítem."
                : "Completa la información para crear un nuevo ítem en la obra."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isEditing && item && (
            <div className="space-y-2">
              <Label>Item ID</Label>
              <Input value={`#${item.id}`} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                El ID no puede ser modificado
              </p>
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
              disabled={isSubmitting || isEditingQuote}
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
                disabled={isSubmitting || isEditingQuote}
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
                    disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
                {errors.actividad && <p className="text-sm text-destructive">{errors.actividad}</p>}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="cantidad" className="truncate block">Cantidad <span className="text-red-500">*</span></Label>
                  <Input
                    id="cantidad"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full"
                  />
                  {errors.cantidad && <p className="text-sm text-destructive truncate">{errors.cantidad}</p>}
                </div>

                <div className="space-y-2 min-w-0">
                  <Label htmlFor="unidad" className="truncate block">Unidad</Label>
                  <Select
                    value={formData.unidad}
                    onValueChange={(value) => setFormData({ ...formData, unidad: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue className="truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UND">Unidad</SelectItem>
                      <SelectItem value="M">Metro</SelectItem>
                      <SelectItem value="M2">Metro Cuadrado</SelectItem>
                      <SelectItem value="M3">Metro Cúbico</SelectItem>
                      <SelectItem value="KG">Kilogramo</SelectItem>
                      <SelectItem value="LT">Litro</SelectItem>
                      <SelectItem value="GLB">Global</SelectItem>
                      <SelectItem value="HR">Hora</SelectItem>
                      <SelectItem value="DIA">Día</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 min-w-0">
                  <Label htmlFor="precioUnitario" className="whitespace-nowrap truncate block">
                    Precio U. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="precioUnitario"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precioUnitario}
                    onChange={(e) => setFormData({ ...formData, precioUnitario: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full"
                  />
                  {errors.precioUnitario && <p className="text-sm text-destructive truncate">{errors.precioUnitario}</p>}
                </div>

                <div className="space-y-2 min-w-0">
                  <Label htmlFor="precioTotal" className="truncate block">Precio Total</Label>
                  <Input
                    id="precioTotal"
                    type="text"
                    value={formData.precioTotal}
                    readOnly
                    className="bg-muted w-full"
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
                  disabled={isSubmitting}
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
              disabled={isSubmitting || isEditingQuote}
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
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="animate-spin h-4 w-4" />}
              {isEditingQuote
                ? "Guardar cotización"
                : isEditing
                  ? "Guardar cambios"
                  : "Crear ítem"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}