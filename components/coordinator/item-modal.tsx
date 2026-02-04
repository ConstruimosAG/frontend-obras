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

interface ItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
  workId?: number;
  onSubmit: (data: {
    description: string;
    personnelRequired: Record<string, unknown>;
    extras: Record<string, unknown>;
    estimatedExecutionTime?: number;
    contractorId?: number | null;
    active?: boolean;
    workId?: number;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
  coordinator?: boolean;
  contractors?: User[];
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
}: ItemModalProps) {
  const isEditing = Boolean(item);
  const [formData, setFormData] = useState({
    description: "",
    oficiales: "",
    ayudantes: "",
    mediaCuchara: "",
    siso: "",
    otroPersonalName: "",
    otroPersonalQuantity: "",
    andamio: "",
    equiposDeAltura: "",
    volqueta: "",
    acarreoYTransporte: "",
    herramientaEspecial: "",
    otroExtrasName: "",
    otroExtrasQuantity: "",
    estimatedExecutionTime: "",
    contractorId: "",
    active: true,
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;

    if (item) {
      const personnel = item.personnelRequired || {};
      const extras = item.extras || {};

      setFormData({
        description: item.description,
        oficiales: String(personnel.oficiales || ""),
        ayudantes: String(personnel.ayudantes || ""),
        mediaCuchara: String(personnel.mediaCuchara || ""),
        siso: String(personnel.siso || ""),
        otroPersonalName: String(personnel.otroName || ""),
        otroPersonalQuantity: String(personnel.otroQuantity || ""),
        andamio: String(extras.andamio || ""),
        equiposDeAltura: String(extras.equiposDeAltura || ""),
        volqueta: String(extras.volqueta || ""),
        acarreoYTransporte: String(extras.acarreoYTransporte || ""),
        herramientaEspecial: String(extras.herramientaEspecial || ""),
        otroExtrasName: String(extras.otroName || ""),
        otroExtrasQuantity: String(extras.otroQuantity || ""),
        estimatedExecutionTime: item.estimatedExecutionTime?.toString() || "",
        contractorId: item.contractorId?.toString() || "",
        active: item.active,
        notes: String(extras.notes || ""),
      });
    } else {
      setFormData({
        description: "",
        oficiales: "",
        ayudantes: "",
        mediaCuchara: "",
        siso: "",
        otroPersonalName: "",
        otroPersonalQuantity: "",
        andamio: "",
        equiposDeAltura: "",
        volqueta: "",
        acarreoYTransporte: "",
        herramientaEspecial: "",
        otroExtrasName: "",
        otroExtrasQuantity: "",
        estimatedExecutionTime: "",
        contractorId: "",
        active: true,
        notes: "",
      });
    }
    setErrors({});
  }, [item, open]);

  const buildPersonnelRequired = (): Record<string, unknown> => {
    const personnel: Record<string, unknown> = {};

    if (formData.oficiales) personnel.oficiales = Number(formData.oficiales);
    if (formData.ayudantes) personnel.ayudantes = Number(formData.ayudantes);
    if (formData.mediaCuchara) personnel.mediaCuchara = Number(formData.mediaCuchara);
    if (formData.siso) personnel.siso = Number(formData.siso);
    if (formData.otroPersonalName) {
      personnel.otroName = formData.otroPersonalName;
      if (formData.otroPersonalQuantity) {
        personnel.otroQuantity = Number(formData.otroPersonalQuantity);
      }
    }
    return personnel;
  };

  const buildExtras = (): Record<string, unknown> => {
    const extras: Record<string, unknown> = {};

    if (formData.andamio) extras.andamio = Number(formData.andamio);
    if (formData.equiposDeAltura) extras.equiposDeAltura = Number(formData.equiposDeAltura);
    if (formData.volqueta) extras.volqueta = Number(formData.volqueta);
    if (formData.acarreoYTransporte) extras.acarreoYTransporte = Number(formData.acarreoYTransporte);
    if (formData.herramientaEspecial) extras.herramientaEspecial = Number(formData.herramientaEspecial);
    if (formData.otroExtrasName) {
      extras.otroName = formData.otroExtrasName;
      if (formData.otroExtrasQuantity) {
        extras.otroQuantity = Number(formData.otroExtrasQuantity);
      }
    }
    if (formData.notes) extras.notes = formData.notes;

    return extras;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const payload = {
        description: formData.description,
        personnelRequired: buildPersonnelRequired(),
        extras: buildExtras(),
        estimatedExecutionTime: formData.estimatedExecutionTime
          ? Number.parseInt(formData.estimatedExecutionTime)
          : undefined,
        contractorId: formData.contractorId
          ? Number(formData.contractorId)
          : undefined,
        active: Boolean(formData.active),
        workId: isEditing ? undefined : workId,
      };

      if (isEditing) {
        itemEditSchema.parse({
          description: payload.description,
          estimatedExecutionTime: payload.estimatedExecutionTime,
        });
      } else {
        itemSchema.parse({
          description: payload.description,
          estimatedExecutionTime: payload.estimatedExecutionTime,
        });
      }

      await onSubmit(payload as any);
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
            {isEditing ? "Editar Ítem" : "Crear Nuevo Ítem"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEditing
              ? "Modifica los datos del ítem. Algunos campos no se pueden editar."
              : "Completa los datos para crear un nuevo ítem dentro de la obra."}
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
              disabled={(isEditing && coordinator ? true : false) || isSubmitting}
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

          {/* Contratista - Select con shadcn - CORREGIDO */}
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

          {/* Personal Requerido Section */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Personal Requerido
            </Label>
            <div className="space-y-4">
              <div className="border-b pb-2">
                <p className="text-sm text-gray-500 mt-1">
                  Ingresa la cantidad necesaria para cada tipo de personal
                </p>
              </div>

              <div className="grid gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {[
                  { label: "OFICIALES", key: "oficiales" },
                  { label: "AYUDANTES", key: "ayudantes" },
                  { label: "MEDIA CUCHARA", key: "mediaCuchara" },
                  { label: "SISO", key: "siso" },
                ].map((tipo) => (
                  <div
                    key={tipo.key}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {tipo.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData[tipo.key as keyof typeof formData] as string}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [tipo.key]: e.target.value,
                          })
                        }
                        className="w-20 h-9 text-center bg-white dark:bg-gray-700 dark:text-white border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                ))}

                {/* Opción "Otro" en Personal Requerido */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={formData.otroPersonalName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          otroPersonalName: e.target.value,
                        })
                      }
                      placeholder="Otro (describir)"
                      className="w-full bg-white dark:bg-gray-700 dark:text-white border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Input
                      type="number"
                      min="0"
                      value={formData.otroPersonalQuantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          otroPersonalQuantity: e.target.value,
                        })
                      }
                      className="w-20 h-9 text-center bg-white dark:bg-gray-700 dark:text-white border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Adicionales Section */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Adicionales
            </Label>
            <div className="space-y-4">
              <div className="border-b pb-2">
                <p className="text-sm text-gray-500 mt-1">
                  Ingresa la cantidad necesaria para cada tipo de adicional
                </p>
              </div>

              <div className="grid gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {[
                  { label: "ANDAMIO", key: "andamio" },
                  { label: "EQUIPOS DE ALTURA", key: "equiposDeAltura" },
                  { label: "VOLQUETA", key: "volqueta" },
                  { label: "ACARREO Y TRANSPORTE", key: "acarreoYTransporte" },
                  { label: "HERRAMIENTA ESPECIAL", key: "herramientaEspecial" },
                ].map((tipo) => (
                  <div
                    key={tipo.key}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {tipo.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData[tipo.key as keyof typeof formData] as string}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [tipo.key]: e.target.value,
                          })
                        }
                        className="w-20 h-9 text-center bg-white dark:bg-gray-700 dark:text-white border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                ))}

                {/* Opción "Otro" en Adicionales */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={formData.otroExtrasName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          otroExtrasName: e.target.value,
                        })
                      }
                      placeholder="Otro (describir)"
                      className="w-full bg-white dark:bg-gray-700 dark:text-white border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Input
                      type="number"
                      min="0"
                      value={formData.otroExtrasQuantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          otroExtrasQuantity: e.target.value,
                        })
                      }
                      className="w-20 h-9 text-center bg-white dark:bg-gray-700 dark:text-white border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notas Adicionales */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Información adicional sobre el ítem..."
              rows={2}
              disabled={isSubmitting}
              className="dark:text-black/80"
            />
          </div>

          {/* Other Fields */}
          <div className="space-y-2">
            <Label htmlFor="estimatedExecutionTime">
              Tiempo Estimado (horas)
            </Label>
            <Input
              id="estimatedExecutionTime"
              type="number"
              min={1}
              value={formData.estimatedExecutionTime}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estimatedExecutionTime: e.target.value,
                })
              }
              placeholder="Ex: 40"
              disabled={isEditing || isSubmitting}
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
              {isEditing ? "Guardar Cambios" : "Crear Ítem"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}