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
          ? new Date(work.quotationDeadline).toISOString().split("T")[0]
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
      if (isEditing) {
        workEditSchema.parse({
          quotationDeadline: formData.quotationDeadline,
          finalized: formData.finalized,
        });

        await onSubmit({
          quotationDeadline: formData.quotationDeadline,
          finalized: formData.finalized,
        });
      } else {
        workSchema.parse({
          code: formData.code,
          quotationDeadline: formData.quotationDeadline,
        });

        await onSubmit({
          code: formData.code,
          quotationDeadline: formData.quotationDeadline,
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
      // si la onSubmit lanza error (fetch), dejamos que el hook lo maneje con toast
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

          {/*isEditing && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="finalized"
                checked={formData.finalized}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    finalized: checked as boolean,
                  }))
                }
                disabled={isSubmitting}
              />
              <Label
                htmlFor="finalized"
                className="text-sm font-normal cursor-pointer"
              >
                Marcar como finalizada
              </Label>
            </div>
          )*/}

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
