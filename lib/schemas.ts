import { z } from "zod";

// Schema for creating a new work
export const workSchema = z.object({
  code: z
    .string()
    .min(2, "Code must have at least 2 characters")
    .max(20, "Code cannot exceed 20 characters")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Code can only contain letters, numbers, hyphens and underscores"
    ),
  quotationDeadline: z
    .string()
    .min(1, "Quotation deadline is required")
    .refine((date) => new Date(date) > new Date(), {
      message: "Quotation deadline must be after today",
    }),
});

// Schema for editing a work (without code)
export const workEditSchema = z.object({
  quotationDeadline: z.string().min(1, "Quotation deadline is required"),
  finalized: z.boolean().optional(),
});

// Schema for creating an item
export const itemSchema = z.object({
  description: z
    .string()
    .min(10, "Description must have at least 10 characters")
    .max(500, "Description cannot exceed 500 characters"),
//   personnelRequired: z.record(z.unknown()).default({}),
//   extras: z.record(z.unknown()).default({}),
  estimatedExecutionTime: z
    .number()
    .min(1, "Estimated time must be at least 1 hour")
    .optional(),
});

// Schema for editing an item
export const itemEditSchema = z.object({
  description: z
    .string()
    .min(10, "Description must have at least 10 characters")
    .max(500, "Description cannot exceed 500 characters"),
  estimatedExecutionTime: z
    .number()
    .min(1, "Estimated time must be at least 1 hour")
    .optional(),
});

export type WorkSchemaType = z.infer<typeof workSchema>;
export type WorkEditSchemaType = z.infer<typeof workEditSchema>;
export type ItemSchemaType = z.infer<typeof itemSchema>;
export type ItemEditSchemaType = z.infer<typeof itemEditSchema>;
