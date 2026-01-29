import { z } from "zod";

// Esquema para crear un nuevo trabajo
export const workSchema = z.object({
  code: z
    .string()
    .min(2, "El código debe tener al menos 2 caracteres")
    .max(20, "El código no puede exceder los 20 caracteres")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "El código solo puede contener letras, números, guiones y guiones bajos",
    ),
  quotationDeadline: z
    .string()
    .min(1, "La fecha límite de cotización es obligatoria")
    .refine((date) => new Date(date) > new Date(), {
      message: "La fecha límite de cotización debe ser posterior a hoy",
    }),
});

// Esquema para editar un trabajo (sin código)
export const workEditSchema = z.object({
  quotationDeadline: z
    .string()
    .min(1, "La fecha límite de cotización es obligatoria"),
  finalized: z.boolean().optional(),
});

// Esquema para crear un ítem
export const itemSchema = z.object({
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(500, "La descripción no puede exceder los 500 caracteres"),
  //   personnelRequired: z.record(z.unknown()).default({}),
  //   extras: z.record(z.unknown()).default({}),
  estimatedExecutionTime: z
    .number()
    .min(1, "El tiempo estimado debe ser de al menos 1 hora")
    .optional(),
});

// Esquema para editar un ítem
export const itemEditSchema = z.object({
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(500, "La descripción no puede exceder los 500 caracteres"),
  estimatedExecutionTime: z
    .number()
    .min(1, "El tiempo estimado debe ser de al menos 1 hora")
    .optional(),
});

export type WorkSchemaType = z.infer<typeof workSchema>;
export type WorkEditSchemaType = z.infer<typeof workEditSchema>;
export type ItemSchemaType = z.infer<typeof itemSchema>;
export type ItemEditSchemaType = z.infer<typeof itemEditSchema>;
