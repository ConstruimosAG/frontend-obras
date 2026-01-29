"use client";

import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQuoteItems } from "@/hooks/items/useQuoteItems";

// Schema de validación
const quoteItemSchema = z.object({
  measure: z.number().positive("La cantidad debe ser mayor a 0"),
  unit: z.string().min(1, "Debes seleccionar una unidad"),
  unitValue: z.number().min(0, "El valor unitario no puede ser negativo"),
  materialsDesc: z.string().optional(),
  materialCost: z.number().min(0, "El costo de materiales no puede ser negativo"),
  administrationPerc: z.number().min(0).max(100, "Debe estar entre 0 y 100"),
  contingenciesPerc: z.number().min(0).max(100, "Debe estar entre 0 y 100"),
  profitPerc: z.number().min(0).max(100, "Debe estar entre 0 y 100"),
});

// Opciones de unidad (del código original)
const unitOptions = [
  { value: "UND", label: "Unidad" },
  { value: "M", label: "Metro" },
  { value: "M2", label: "Metro cuadrado" },
  { value: "M3", label: "Metro cúbico" },
  { value: "KG", label: "Kilogramo" },
  { value: "LT", label: "Litro" },
  { value: "GLB", label: "Global" },
  { value: "HR", label: "Hora" },
  { value: "DIA", label: "Día" },
];

interface SubquotationItem {
  id: string;
  proceso: string;
  medida: number;
  unidad: string;
  valorUnitario: number;
  valorTotal: number;
}

interface QuoteItemFormProps {
  item: any; // Item from DB
  currentUser: any | null;
  ivaPercent?: number; // default 19
  onSaved?: (created: any) => void;
  initial?: Partial<any>; // para edición
  isEditing?: boolean;
  isExternal?: boolean; // Para contratistas externos
  caseData?: {
    workOrderNumber: string;
    location: string;
    quotationDescription: string;
    caseDescription: string;
  };
}

export function QuoteItemForm({
  item,
  currentUser,
  ivaPercent = 19,
  onSaved,
  initial,
  isEditing = false,
  isExternal = false,
  caseData,
}: QuoteItemFormProps) {
  const { createQuoteItem, updateQuoteItem, submitting } = useQuoteItems();

  // Campos para contratistas externos
  const [externalName, setExternalName] = useState<string>("");
  const [externalIdentifier, setExternalIdentifier] = useState<string>("");

  // Estado para subitems (como el array de quotationItems del original)
  const [subquotationItems, setSubquotationItems] = useState<SubquotationItem[]>([
    {
      id: "1",
      proceso: "",
      medida: 0,
      unidad: "UND",
      valorUnitario: 0,
      valorTotal: 0,
    },
  ]);

  // Materiales
  const [materialsDesc, setMaterialsDesc] = useState<string>(
    initial?.materials?.description ?? ""
  );
  const [materialCost, setMaterialCost] = useState<number>(
    initial?.materialCost ?? 0
  );

  // AIU / porcentajes
  const [administrationPerc, setAdministrationPerc] = useState<number>(
    initial?.administrationPercentage ?? 0
  );
  const [contingenciesPerc, setContingenciesPerc] = useState<number>(
    initial?.contingenciesPercentage ?? 0
  );
  const [profitPerc, setProfitPerc] = useState<number>(
    initial?.profitPercentage ?? 0
  );

  // Tipo de impuesto
  const [taxType, setTaxType] = useState<"none" | "iva" | "aiu">(
    initial?.vat ? (initial?.administrationPercentage > 0 ? "aiu" : "iva") : "none"
  );

  // Errores de validación
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calcular valor total de cada subitem cuando cambian medida o valor unitario
  useEffect(() => {
    setSubquotationItems((items) =>
      items.map((item) => ({
        ...item,
        valorTotal: item.medida * item.valorUnitario,
      }))
    );
  }, []);

  const handleSubitemChange = (
    id: string,
    field: keyof SubquotationItem,
    value: string | number
  ) => {
    setSubquotationItems((items) =>
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // Recalcular valor total si cambia medida o valor unitario
          if (field === "medida" || field === "valorUnitario") {
            updatedItem.valorTotal =
              updatedItem.medida * updatedItem.valorUnitario;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const addSubitem = () => {
    const newItem: SubquotationItem = {
      id: Date.now().toString(),
      proceso: "",
      medida: 0,
      unidad: "UND",
      valorUnitario: 0,
      valorTotal: 0,
    };
    setSubquotationItems([...subquotationItems, newItem]);
  };

  const removeSubitem = (id: string) => {
    if (subquotationItems.length > 1) {
      setSubquotationItems((items) => items.filter((item) => item.id !== id));
    }
  };

  const handleTaxTypeChange = (type: "iva" | "aiu") => {
    setTaxType((prev) => {
      // Si ya está seleccionado el mismo tipo, desmarcar (none)
      if (prev === type) return "none";
      // Si está en "none" o en el otro tipo, cambiar al tipo seleccionado
      return type;
    });
  };

  const handlePercentageChange = (
    field: "administracion" | "imprevistos" | "utilidad",
    value: number
  ) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    if (field === "administracion") {
      setAdministrationPerc(clampedValue);
    } else if (field === "imprevistos") {
      setContingenciesPerc(clampedValue);
    } else if (field === "utilidad") {
      setProfitPerc(clampedValue);
    }
  };

  // Cálculos (siguiendo la lógica del formulario original)
  const subtotalItems = useMemo(
    () => subquotationItems.reduce((sum, item) => sum + item.valorTotal, 0),
    [subquotationItems]
  );

  const subtotal = useMemo(
    () => subtotalItems + (materialCost ?? 0),
    [subtotalItems, materialCost]
  );

  const adminAmount = useMemo(
    () => (taxType === "aiu" ? subtotal * (administrationPerc / 100) : 0),
    [taxType, subtotal, administrationPerc]
  );

  const contingenciesAmount = useMemo(
    () => (taxType === "aiu" ? subtotal * (contingenciesPerc / 100) : 0),
    [taxType, subtotal, contingenciesPerc]
  );

  const profitAmount = useMemo(
    () => (taxType === "aiu" ? subtotal * (profitPerc / 100) : 0),
    [taxType, subtotal, profitPerc]
  );

  const ivaOnProfit = useMemo(
    () => (taxType === "aiu" ? profitAmount * (ivaPercent / 100) : 0),
    [taxType, profitAmount, ivaPercent]
  );

  const totalAIU = useMemo(
    () => adminAmount + contingenciesAmount + profitAmount + ivaOnProfit,
    [adminAmount, contingenciesAmount, profitAmount, ivaOnProfit]
  );

  const taxAmount = useMemo(() => {
    if (taxType === "iva") {
      return subtotal * (ivaPercent / 100);
    } else if (taxType === "aiu") {
      return totalAIU;
    }
    return 0;
  }, [taxType, subtotal, totalAIU, ivaPercent]);

  const totalContractor = useMemo(
    () => subtotal + taxAmount,
    [subtotal, taxAmount]
  );

  // Limpiar errores cuando cambian los valores
  useEffect(() => {
    setErrors({});
  }, [
    subquotationItems,
    materialCost,
    administrationPerc,
    contingenciesPerc,
    profitPerc,
    taxType,
  ]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validar campos de contratista externo
    if (isExternal) {
      if (!externalName.trim()) {
        newErrors.externalName = "El nombre es requerido";
      }
      if (!externalIdentifier.trim()) {
        newErrors.externalIdentifier = "La identificación es requerida";
      }
    }

    // Validar que hay al menos un subitem con datos
    const hasValidSubitem = subquotationItems.some(
      (item) => item.proceso.trim() !== "" && item.medida > 0
    );
    if (!hasValidSubitem) {
      newErrors.items = "Debes agregar al menos una actividad válida";
    }

    // Validar subitems individuales
    subquotationItems.forEach((item, index) => {
      if (item.proceso.trim() !== "") {
        if (item.medida <= 0) {
          newErrors[`item_${index}_measure`] = "La cantidad debe ser mayor a 0";
        }
        if (item.valorUnitario < 0) {
          newErrors[`item_${index}_unitValue`] =
            "El valor unitario no puede ser negativo";
        }
      }
    });

    // Validar materiales
    if (materialCost < 0) {
      newErrors.materialCost = "El costo de materiales no puede ser negativo";
    }

    // Validar porcentajes AIU
    if (taxType === "aiu") {
      if (administrationPerc < 0 || administrationPerc > 100) {
        newErrors.administrationPerc = "Debe estar entre 0 y 100";
      }
      if (contingenciesPerc < 0 || contingenciesPerc > 100) {
        newErrors.contingenciesPerc = "Debe estar entre 0 y 100";
      }
      if (profitPerc < 0 || profitPerc > 100) {
        newErrors.profitPerc = "Debe estar entre 0 y 100";
      }
    }

    // Validaciones generales
    if (!item?.id) {
      newErrors.item = "Item inválido";
    }
    if (!isExternal && !currentUser?.id) {
      newErrors.user = "No se detectó usuario";
    }
    if (subtotal < 0) {
      newErrors.subtotal = "Subtotal inválido";
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    // Preparar subquotations como objeto indexado (no array)
    const subquotationsArray = subquotationItems
      .filter((item) => item.proceso.trim() !== "")
      .map((item, index) => ({
        id: index + 1,
        description: item.proceso,
        measure: item.medida,
        unit: item.unidad,
        unitValue: item.valorUnitario,
        totalValue: item.valorTotal,
      }));

    // Convertir array a objeto con índices como keys
    const subquotationsObject = subquotationsArray.reduce((acc, item, index) => {
      acc[`item_${index + 1}`] = item;
      return acc;
    }, {} as Record<string, any>);


    const payload = {
      itemId: Number(item.id),
      subquotations: subquotationsObject,
      totalContractor: Number(totalContractor.toFixed(2)),
      materials: materialsDesc ? { description: materialsDesc } : null,
      materialCost: materialCost > 0 ? Number(materialCost.toFixed(2)) : null,
      subtotal: Number(subtotal.toFixed(2)),
      managementPercentage: null,
      administrationPercentage: administrationPerc > 0 ? Number(administrationPerc.toFixed(2)) : null,
      contingenciesPercentage: contingenciesPerc > 0 ? Number(contingenciesPerc.toFixed(2)) : null,
      profitPercentage: profitPerc > 0 ? Number(profitPerc.toFixed(2)) : null,
      agValue: null,
      vat: taxType === "iva" || taxType === "aiu",
      assignedContractorId: isExternal ? null : (currentUser?.id ?? null),
      // Campos para contratistas externos
      ...(isExternal && {
        externalContractorName: externalName.trim(),
        externalContractorIdentifier: externalIdentifier.trim(),
      }),
    };

    console.log("Payload a enviar:", JSON.stringify(payload, null, 2));

    try {
      let result;
      if (isEditing && initial?.id) {
        result = await updateQuoteItem(initial.id, payload);
        toast.success("Cotización actualizada correctamente");
      } else {
        result = await createQuoteItem(payload);
        toast.success("Cotización guardada correctamente");
      }
      onSaved?.(result);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Error guardando la cotización");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
        }
      }}
      className="space-y-6 mb-20 md:mb-0"
    >
      {/* Información General - Solo lectura (si hay caseData) */}
      {caseData && (
        <Card>
          <CardHeader>
            <CardTitle>Información General del Caso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">
                  Número del Caso <span className="text-red-500">*</span>
                </label>
                <Input
                  value={caseData.workOrderNumber}
                  className="bg-gray-100"
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">
                  Ubicación <span className="text-red-500">*</span>
                </label>
                <Input
                  value={caseData.location}
                  className="bg-gray-100"
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Descripción Universidad <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={caseData.quotationDescription}
                rows={4}
                className="bg-gray-100"
                readOnly
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Descripción de Actividades <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={caseData.caseDescription}
                rows={4}
                className="bg-gray-100"
                readOnly
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información del Contratista Externo */}
      {isExternal && (
        <Card>
          <CardHeader>
            <CardTitle>Información del Contratista</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <Input
                  value={externalName}
                  onChange={(e) => setExternalName(e.target.value)}
                  placeholder="Ingresa tu nombre completo"
                  disabled={submitting}
                  aria-invalid={!!errors.externalName}
                />
                {errors.externalName && (
                  <p className="text-sm text-destructive">{errors.externalName}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">
                  Identificación <span className="text-red-500">*</span>
                </label>
                <Input
                  value={externalIdentifier}
                  onChange={(e) => setExternalIdentifier(e.target.value)}
                  placeholder="Cédula, NIT, etc."
                  disabled={submitting}
                  aria-invalid={!!errors.externalIdentifier}
                />
                {errors.externalIdentifier && (
                  <p className="text-sm text-destructive">
                    {errors.externalIdentifier}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cotización - Items dinámicos */}
      <Card>
        <CardHeader>
          <CardTitle>Cotización</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {subquotationItems.map((subitem, index) => (
            <div key={subitem.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Ítem {index + 1}</h4>
                {subquotationItems.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSubitem(subitem.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={submitting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">
                  Actividad <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={subitem.proceso}
                  onChange={(e) =>
                    handleSubitemChange(subitem.id, "proceso", e.target.value)
                  }
                  rows={3}
                  disabled={submitting}
                  aria-invalid={!!errors[`item_${index}_proceso`]}
                />
                {errors[`item_${index}_proceso`] && (
                  <p className="text-sm text-destructive">
                    {errors[`item_${index}_proceso`]}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    Cantidad
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={subitem.medida || ""}
                    onChange={(e) =>
                      handleSubitemChange(
                        subitem.id,
                        "medida",
                        Number.parseFloat(e.target.value) || 0
                      )
                    }
                    disabled={submitting}
                    aria-invalid={!!errors[`item_${index}_measure`]}
                  />
                  {errors[`item_${index}_measure`] && (
                    <p className="text-sm text-destructive">
                      {errors[`item_${index}_measure`]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    Unidad
                  </label>
                  <Select
                    value={subitem.unidad}
                    onValueChange={(value) =>
                      handleSubitemChange(subitem.id, "unidad", value)
                    }
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    Valor Unitario
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={subitem.valorUnitario || ""}
                    onChange={(e) =>
                      handleSubitemChange(
                        subitem.id,
                        "valorUnitario",
                        Number.parseFloat(e.target.value) || 0
                      )
                    }
                    disabled={submitting}
                    aria-invalid={!!errors[`item_${index}_unitValue`]}
                  />
                  {errors[`item_${index}_unitValue`] && (
                    <p className="text-sm text-destructive">
                      {errors[`item_${index}_unitValue`]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    Valor Total
                  </label>
                  <Input
                    type="text"
                    value={subitem.valorTotal.toLocaleString("es-CO", {
                      minimumFractionDigits: 2,
                    })}
                    className="bg-gray-100"
                    readOnly
                  />
                </div>
              </div>
            </div>
          ))}
          {errors.items && (
            <p className="text-sm text-destructive">{errors.items}</p>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={addSubitem}
            className="w-full bg-[#FF5C00] hover:bg-[#E65200] text-white hover:text-white"
            disabled={submitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Ítem
          </Button>
        </CardContent>
      </Card>

      {/* Impuestos */}
      <Card>
        <CardHeader>
          <CardTitle>Impuestos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Selecciona el tipo de impuesto a aplicar (solo puedes elegir uno):
            </p>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="iva"
                  checked={taxType === "iva"}
                  onCheckedChange={() => handleTaxTypeChange("iva")}
                  disabled={submitting}
                />
                <label
                  htmlFor="iva"
                  className={`text-sm font-medium cursor-pointer ${
                    taxType === "aiu" ? "text-muted-foreground" : ""
                  }`}
                >
                  Incluir IVA ({ivaPercent}%)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="aiu"
                  checked={taxType === "aiu"}
                  onCheckedChange={() => handleTaxTypeChange("aiu")}
                  disabled={submitting}
                />
                <label
                  htmlFor="aiu"
                  className={`text-sm font-medium cursor-pointer ${
                    taxType === "iva" ? "text-muted-foreground" : ""
                  }`}
                >
                  Incluir AIU
                </label>
              </div>
            </div>
          </div>

          {taxType === "aiu" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">
                  Administración (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={administrationPerc}
                  onChange={(e) =>
                    handlePercentageChange(
                      "administracion",
                      Number.parseFloat(e.target.value) || 0
                    )
                  }
                  disabled={submitting}
                  aria-invalid={!!errors.administrationPerc}
                />
                {errors.administrationPerc && (
                  <p className="text-sm text-destructive">
                    {errors.administrationPerc}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">
                  Imprevistos (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={contingenciesPerc}
                  onChange={(e) =>
                    handlePercentageChange(
                      "imprevistos",
                      Number.parseFloat(e.target.value) || 0
                    )
                  }
                  disabled={submitting}
                  aria-invalid={!!errors.contingenciesPerc}
                />
                {errors.contingenciesPerc && (
                  <p className="text-sm text-destructive">
                    {errors.contingenciesPerc}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">
                  Utilidad (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={profitPerc}
                  onChange={(e) =>
                    handlePercentageChange(
                      "utilidad",
                      Number.parseFloat(e.target.value) || 0
                    )
                  }
                  disabled={submitting}
                  aria-invalid={!!errors.profitPerc}
                />
                {errors.profitPerc && (
                  <p className="text-sm text-destructive">
                    {errors.profitPerc}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materiales y costos */}
      <Card>
        <CardHeader>
          <CardTitle>Materiales y/o Observaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Descripción de materiales
            </label>
            <Textarea
              value={materialsDesc}
              onChange={(e) => setMaterialsDesc(e.target.value)}
              placeholder="Descripción de los materiales y/o observaciones requeridos en la cotización"
              rows={3}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Costo de materiales
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={materialCost || ""}
              onChange={(e) =>
                setMaterialCost(Number.parseFloat(e.target.value) || 0)
              }
              disabled={submitting}
              aria-invalid={!!errors.materialCost}
            />
            {errors.materialCost && (
              <p className="text-sm text-destructive">{errors.materialCost}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Cotización</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {subquotationItems.map((subitem, index) => (
              <div key={subitem.id} className="flex justify-between text-sm">
                <span>
                  Proceso {index + 1}:{" "}
                  {subitem.proceso || "Sin descripción"}
                </span>
                <span>
                  $
                  {subitem.valorTotal.toLocaleString("es-CO", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            ))}
          </div>

          <hr />

          <div className="flex justify-between font-medium">
            <span>Subtotal:</span>
            <span>
              $
              {subtotal.toLocaleString("es-CO", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          {taxType === "iva" && (
            <div className="flex justify-between text-sm">
              <span>IVA ({ivaPercent}%):</span>
              <span>
                $
                {taxAmount.toLocaleString("es-CO", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          {taxType === "aiu" && (
            <>
              <div className="flex justify-between text-sm">
                <span>
                  Administración ({administrationPerc.toFixed(2)}%):
                </span>
                <span>
                  $
                  {adminAmount.toLocaleString("es-CO", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Imprevistos ({contingenciesPerc.toFixed(2)}%):</span>
                <span>
                  $
                  {contingenciesAmount.toLocaleString("es-CO", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Utilidad ({profitPerc.toFixed(2)}%):</span>
                <span>
                  $
                  {profitAmount.toLocaleString("es-CO", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IVA sobre Utilidad ({ivaPercent}%):</span>
                <span>
                  $
                  {ivaOnProfit.toLocaleString("es-CO", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </>
          )}

          <hr />

          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>
              $
              {totalContractor.toLocaleString("es-CO", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2"
          disabled={submitting}
        >
          {submitting && <Loader2 className="animate-spin h-4 w-4" />}
          {isEditing ? "Actualizar Cotización" : "Guardar Cotización"}
        </Button>
      </div>
    </form>
  );
}