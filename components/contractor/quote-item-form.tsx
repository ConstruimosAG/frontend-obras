"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, FileText, Calendar, Building2, DollarSign, Percent, Info } from "lucide-react";
import { toast } from "sonner";
import { useQuoteItems } from "@/hooks/items/useQuoteItems";

const unitOptions = [
  { value: "UND", label: "UND" },
  { value: "M2", label: "M2" },
  { value: "M3", label: "M3" },
  { value: "ML", label: "ML" },
  { value: "KM", label: "KM" },
  { value: "KG", label: "KG" },
  { value: "LT", label: "LT" },
  { value: "GLB", label: "GLB" },
  { value: "HR", label: "HR" },
  { value: "DIA", label: "DIA" },
];

interface QuoteItemFormProps {
  item: any;
  currentUser: any | null;
  ivaPercent?: number;
  onSaved?: (created: any) => void;
  initial?: Partial<any>;
  isEditing?: boolean;
  isExternal?: boolean;
}

export function QuoteItemForm({
  item,
  currentUser,
  ivaPercent = 19,
  onSaved,
  initial,
  isEditing = false,
  isExternal = false,
}: QuoteItemFormProps) {
  const { createQuoteItem, updateQuoteItem, submitting } = useQuoteItems();

  // Parse initial data safely
  const {
    subquotations: rawSubq,
    externalContractorName: initExtName = "",
    externalContractorIdentifier: initExtId = "",
    materials: initMaterials,
    administrationPercentage: initAdmin = 0,
    contingenciesPercentage: initCont = 0,
    profitPercentage: initProfit = 0,
    vat: initVat = false,
  } = initial || {};

  const getInitialSubq = () => {
    if (rawSubq) {
      const subq = typeof rawSubq === 'string' ? JSON.parse(rawSubq) : rawSubq;
      const firstKey = Object.keys(subq)[0];
      if (firstKey && subq[firstKey]) {
        return {
          description: subq[firstKey].description || "",
          measure: subq[firstKey].measure || 0,
          unit: subq[firstKey].unit || "UND",
          unitValue: subq[firstKey].unitValue || 0,
        };
      }
    }
    return { description: "", measure: 0, unit: "UND", unitValue: 0 };
  };

  const initialSubq = getInitialSubq();

  // Form State
  const [externalName, setExternalName] = useState(initExtName);
  const [externalIdentifier, setExternalIdentifier] = useState(initExtId);
  const [description, setDescription] = useState(initialSubq.description);
  const [measure, setMeasure] = useState(initialSubq.measure);
  const [unit, setUnit] = useState(initialSubq.unit);
  const [unitValue, setUnitValue] = useState(initialSubq.unitValue);
  const [materialsDesc, setMaterialsDesc] = useState(initMaterials?.description || "");

  // Display State
  const [measureDisplay, setMeasureDisplay] = useState(initialSubq.measure > 0 ? initialSubq.measure.toLocaleString("es-CO") : "");
  const [unitValueDisplay, setUnitValueDisplay] = useState(initialSubq.unitValue > 0 ? initialSubq.unitValue.toLocaleString("es-CO") : "");

  // Tax/AIU State
  const [administrationPerc, setAdministrationPerc] = useState(initAdmin);
  const [contingenciesPerc, setContingenciesPerc] = useState(initCont);
  const [profitPerc, setProfitPerc] = useState(initProfit);
  const [taxType, setTaxType] = useState<"none" | "iva" | "aiu">(
    initVat ? (initAdmin > 0 ? "aiu" : "iva") : "none"
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCostInput = (
    value: string,
    setDisplay: (v: string) => void,
    setNumeric: (v: number) => void
  ) => {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    const numeric = Number(digitsOnly) || 0;
    setNumeric(numeric);
    const formatted = numeric > 0 ? numeric.toLocaleString("es-CO") : "";
    setDisplay(formatted);
  };

  // Calculations
  const itemTotal = useMemo(() => measure * unitValue, [measure, unitValue]);
  const subtotal = itemTotal;

  const adminAmount = useMemo(() => (taxType === "aiu" ? subtotal * (administrationPerc / 100) : 0), [taxType, subtotal, administrationPerc]);
  const contingenciesAmount = useMemo(() => (taxType === "aiu" ? subtotal * (contingenciesPerc / 100) : 0), [taxType, subtotal, contingenciesPerc]);

  const totalDirectCost = useMemo(() => subtotal + adminAmount + contingenciesAmount, [subtotal, adminAmount, contingenciesAmount]);

  const profitAmount = useMemo(() => (taxType === "aiu" ? totalDirectCost * (profitPerc / 100) : 0), [taxType, totalDirectCost, profitPerc]);
  const ivaOnProfit = useMemo(() => (taxType === "aiu" ? profitAmount * (ivaPercent / 100) : 0), [taxType, profitAmount, ivaPercent]);

  const taxAmount = useMemo(() => {
    if (taxType === "iva") return subtotal * (ivaPercent / 100);
    if (taxType === "aiu") return adminAmount + contingenciesAmount + profitAmount + ivaOnProfit;
    return 0;
  }, [taxType, subtotal, ivaPercent, adminAmount, contingenciesAmount, profitAmount, ivaOnProfit]);

  const totalContractor = subtotal + taxAmount;

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "No disponible";
    return new Date(date).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (isExternal) {
      if (!externalName.trim()) newErrors.externalName = "Requerido";
      if (!externalIdentifier.trim()) newErrors.externalIdentifier = "Requerido";
    }
    if (!description.trim()) newErrors.description = "Requerido";
    if (measure <= 0) newErrors.measure = "Debe ser mayor a 0";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (submitting) return;

    const payload = {
      itemId: Number(item.id),
      subquotations: {
        item_1: { id: 1, description, measure, unit, unitValue, totalValue: itemTotal }
      },
      totalContractor: Number(totalContractor.toFixed(2)),
      materials: materialsDesc ? { description: materialsDesc } : null,
      materialCost: null, // Removed as requested
      subtotal: Number(subtotal.toFixed(2)),
      managementPercentage: null,
      administrationPercentage: taxType === "aiu" ? administrationPerc : null,
      contingenciesPercentage: taxType === "aiu" ? contingenciesPerc : null,
      profitPercentage: taxType === "aiu" ? profitPerc : null,
      agValue: taxType !== "none" ? Number(taxAmount.toFixed(2)) : null,
      vat: taxType !== "none",
      assignedContractorId: isExternal ? null : (currentUser?.id || null),
      ...(isExternal && {
        externalContractorName: externalName.trim(),
        externalContractorIdentifier: externalIdentifier.trim(),
      }),
    };

    try {
      let result;
      if (isEditing && initial?.id) {
        result = await updateQuoteItem(initial.id, payload as any);
      } else {
        result = await createQuoteItem(payload as any);
      }
      onSaved?.(result);
    } catch (err: any) {
      toast.error(err?.message || "Error al procesar");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ── Sección de Cotización y Materiales ── */}
      <div className="space-y-6">
        {/* Contratista Externo (si aplica) */}
        {isExternal && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-400 uppercase">Nombre Completo</Label>
              <Input
                value={externalName}
                onChange={(e) => setExternalName(e.target.value)}
                className={`h-9 text-sm ${errors.externalName ? "border-red-500" : "border-gray-200"}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-400 uppercase">Identificación</Label>
              <Input
                value={externalIdentifier}
                onChange={(e) => setExternalIdentifier(e.target.value)}
                className={`h-9 text-sm ${errors.externalIdentifier ? "border-red-500" : "border-gray-200"}`}
              />
            </div>
          </div>
        )}

        {/* Detalles de la Actividad */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-gray-400 uppercase">Agrega la descripcion de la actividad a realizar <span className="text-red-500">*</span></Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describa brevemente la actividad..."
              rows={2}
              className={`text-sm resize-none ${errors.description ? "border-red-500" : "border-gray-200 focus:border-purple-400 focus:ring-0"}`}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-400 uppercase">Cantidad</Label>
              <Input
                value={measureDisplay}
                onChange={(e) => handleCostInput(e.target.value, setMeasureDisplay, setMeasure)}
                className={`h-9 text-sm ${errors.measure ? "border-red-500" : "border-gray-200 focus:border-purple-400 focus:ring-0"}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-400 uppercase">Unidad</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="h-9 text-sm border-gray-200 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-sm">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-400 uppercase">Valor Unitario</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                <Input
                  value={unitValueDisplay}
                  onChange={(e) => handleCostInput(e.target.value, setUnitValueDisplay, setUnitValue)}
                  className="h-9 text-sm pl-7 border-gray-200 focus:border-purple-400 focus:ring-0"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-400 uppercase">Subtotal</Label>
              <div className="h-9 px-3 flex items-center rounded-md border border-gray-50 bg-gray-50/50 text-sm font-bold text-gray-600">
                ${itemTotal.toLocaleString("es-CO")}
              </div>
            </div>
          </div>
        </div>

        {/* Materiales y Observaciones */}
        <div className="space-y-1.5 pt-2">
          <Label className="text-[10px] font-bold text-gray-400 uppercase">Materiales y/u Observaciones (Opcional)</Label>
          <Textarea
            value={materialsDesc}
            onChange={(e) => setMaterialsDesc(e.target.value)}
            placeholder="Si requiere materiales específicos u observaciones adicionales, lístelos aquí..."
            rows={4}
            className="text-sm border-gray-200 focus:border-purple-400 focus:ring-0 resize-none"
          />
        </div>

        {/* Impuestos / AIU */}
        <div className="pt-4 space-y-4 border-t border-gray-50">
          <div className="flex gap-6 items-center">
            <div className="flex items-center space-x-2">
              <Checkbox id="iva" checked={taxType === "iva"} onCheckedChange={(c) => setTaxType(c ? "iva" : "none")} className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600" />
              <Label htmlFor="iva" className="text-[11px] font-bold text-gray-500 cursor-pointer">IVA ({ivaPercent}%)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="aiu" checked={taxType === "aiu"} onCheckedChange={(c) => setTaxType(c ? "aiu" : "none")} className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600" />
              <Label htmlFor="aiu" className="text-[11px] font-bold text-gray-500 cursor-pointer">Esquema AIU</Label>
            </div>
          </div>

          {taxType === "aiu" && (
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Admin %</Label>
                <Input
                  type="number"
                  value={administrationPerc || ""}
                  onChange={(e) => setAdministrationPerc(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="h-8 text-xs border-gray-200 focus:ring-0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Impr. %</Label>
                <Input
                  type="number"
                  value={contingenciesPerc || ""}
                  onChange={(e) => setContingenciesPerc(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="h-8 text-xs border-gray-200 focus:ring-0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Util. %</Label>
                <Input
                  type="number"
                  value={profitPerc || ""}
                  onChange={(e) => setProfitPerc(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="h-8 text-xs border-gray-200 focus:ring-0"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Resumen Final ── */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center gap-2 border-b border-purple-100 pb-2">
          <h2 className="text-lg font-bold text-gray-800">3. Resumen</h2>
        </div>

        <div className="bg-gray-50/50 rounded-lg p-5 space-y-3">
          <div className="flex justify-between text-xs font-bold text-gray-500">
            <span>Subtotal de ítems:</span>
            <span className="tabular-nums">${itemTotal.toLocaleString("es-CO")}</span>
          </div>

          {taxType === "iva" && (
            <div className="flex justify-between text-xs font-bold text-purple-600">
              <span>IVA ({ivaPercent}%):</span>
              <span className="tabular-nums">+${taxAmount.toLocaleString("es-CO")}</span>
            </div>
          )}

          {taxType === "aiu" && (
            <div className="space-y-2 text-[11px] text-gray-600 pt-1 border-t border-gray-100">
              <div className="flex justify-between">
                <span>Administración ({administrationPerc}%):</span>
                <span className="tabular-nums">${adminAmount.toLocaleString("es-CO")}</span>
              </div>
              <div className="flex justify-between">
                <span>Imprevistos ({contingenciesPerc}%):</span>
                <span className="tabular-nums">${contingenciesAmount.toLocaleString("es-CO")}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-700 pt-1">
                <span>Total Costo Directo:</span>
                <span className="tabular-nums">${totalDirectCost.toLocaleString("es-CO")}</span>
              </div>
              <div className="flex justify-between text-purple-600">
                <span>Utilidad ({profitPerc}% sobre Costo Directo):</span>
                <span className="tabular-nums">${profitAmount.toLocaleString("es-CO")}</span>
              </div>
              <div className="flex justify-between text-purple-600">
                <span>IVA sobre Utilidad (19%):</span>
                <span className="tabular-nums">${ivaOnProfit.toLocaleString("es-CO")}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center bg-purple-600 p-4 rounded-lg shadow-sm text-white mt-4">
            <span className="text-xs font-bold uppercase tracking-widest">Total Cotización</span>
            <span className="text-xl font-bold tabular-nums">
              ${totalContractor.toLocaleString("es-CO")}
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto h-11 px-10 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-lg transition-all"
          >
            {submitting ? (
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? "Actualizar Cotización" : "Enviar Cotización"}
          </Button>
        </div>
      </div>

    </form>
  );
}