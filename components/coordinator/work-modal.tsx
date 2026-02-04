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
import { Checkbox } from "@/components/ui/checkbox";
import { workSchema, workEditSchema } from "@/lib/schemas";
import type { Work } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface WorkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  work?: Work | null;
  onSubmit: (data: {
    code?: string;
    quotationDeadline: string;
    finalized?: boolean;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

// Convertir fecha del backend (UTC/ISO) a formato local YYYY-MM-DD para el input
function formatDateForInput(dateString: string | Date | null): string {
  if (!dateString) return "";

  const date = new Date(dateString);

  // Obtener componentes en zona horaria LOCAL
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Convertir fecha del input (YYYY-MM-DD) a ISO con mediodía para evitar cambios de día
function formatDateForSubmit(dateString: string): string {
  if (!dateString) return "";

  // El input tipo date devuelve "YYYY-MM-DD"
  // Agregamos hora 12:00:00 en zona local para evitar problemas de zona horaria
  const [year, month, day] = dateString.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);

  // Convertir a ISO string
  return date.toISOString();
}

export function WorkModal({
  open,
  onOpenChange,
  work,
  onSubmit,
  isSubmitting = false,
}: WorkModalProps) {
  const isEditing = !!work;
  const [formData, setFormData] = useState({
    code: "",
    quotationDeadline: "",
    finalized: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;

    if (work) {
      setFormData({
        code: work.code,
        quotationDeadline: work.quotationDeadline
          ? formatDateForInput(work.quotationDeadline)
          : "",
        finalized: work.finalized,
      });
    } else {
      setFormData({
        code: "",
        quotationDeadline: "",
        finalized: false,
      });
    }
    setErrors({});
  }, [work, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Convertir fecha del input a ISO antes de enviar
      const deadlineISO = formatDateForSubmit(formData.quotationDeadline);

      if (isEditing) {
        workEditSchema.parse({
          quotationDeadline: deadlineISO,
          finalized: formData.finalized,
        });

        await onSubmit({
          quotationDeadline: deadlineISO,
          finalized: formData.finalized,
        });
      } else {
        workSchema.parse({
          code: formData.code,
          quotationDeadline: deadlineISO,
        });

        await onSubmit({
          code: formData.code,
          quotationDeadline: deadlineISO,
        });
      }

      onOpenChange(false);
    } catch (error) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {isEditing ? "Editar Obra" : "Crear Nueva Obra"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEditing
              ? "Modifica los datos de la obra. El código no puede ser editado."
              : "Completa los datos para crear una nueva obra."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="Ej: PCN-2026-001"
                aria-invalid={!!errors.code}
                disabled={isSubmitting}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code}</p>
              )}
            </div>
          )}

          {isEditing && (
            <div className="space-y-2">
              <Label>Código</Label>
              <Input value={work?.code} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                El código no puede ser modificado
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quotationDeadline">
              Fecha límite de cotización
            </Label>
            <Input
              id="quotationDeadline"
              type="date"
              value={formData.quotationDeadline}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  quotationDeadline: e.target.value,
                }))
              }
              aria-invalid={!!errors.quotationDeadline}
              disabled={isSubmitting}
            />
            {errors.quotationDeadline && (
              <p className="text-sm text-destructive">
                {errors.quotationDeadline}
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
              {isEditing ? "Guardar cambios" : "Crear obra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}