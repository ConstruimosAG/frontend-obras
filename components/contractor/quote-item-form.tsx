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
  { value: "M", label: "M" },
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
  const subtotal = itemTotal; // Contractor no longer sets materialCost

  const adminAmount = useMemo(() => (taxType === "aiu" ? subtotal * (administrationPerc / 100) : 0), [taxType, subtotal, administrationPerc]);
  const contingenciesAmount = useMemo(() => (taxType === "aiu" ? subtotal * (contingenciesPerc / 100) : 0), [taxType, subtotal, contingenciesPerc]);
  const profitAmount = useMemo(() => (taxType === "aiu" ? subtotal * (profitPerc / 100) : 0), [taxType, subtotal, profitPerc]);
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
      agValue: null,
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
        toast.success("Cotización actualizada");
      } else {
        result = await createQuoteItem(payload as any);
        toast.success("Cotización enviada");
      }
      onSaved?.(result);
    } catch (err: any) {
      toast.error(err?.message || "Error al procesar");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      
      {/* ── Context ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-slate-200 dark:bg-slate-800 p-2 rounded text-slate-600">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{(item as any).work?.code || "Obra"}</h3>
            <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{item.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-slate-950 px-3 py-1.5 rounded border border-slate-200 shadow-sm">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span className="text-slate-400">Asignado:</span>
          <span className="text-slate-700 dark:text-slate-300">{formatDate(item.createdAt)}</span>
        </div>
      </div>

      {/* ── Contratista Externo ── */}
      {isExternal && (
        <Card className="shadow-none border-slate-200">
          <CardHeader className="bg-slate-50/50 py-3 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center gap-2">
              <Info className="w-3.5 h-3.5" /> Identificación de Contratista
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Completo</Label>
              <Input
                value={externalName}
                onChange={(e) => setExternalName(e.target.value)}
                className={`h-9 text-sm ${errors.externalName ? "border-red-500" : "border-slate-200"}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase">Documento / Identificación</Label>
              <Input
                value={externalIdentifier}
                onChange={(e) => setExternalIdentifier(e.target.value)}
                className={`h-9 text-sm ${errors.externalIdentifier ? "border-red-500" : "border-slate-200"}`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Detalles del Ítem ── */}
      <Card className="shadow-none border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-800 py-3 border-b">
          <CardTitle className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Detalles del Ítem a Cotizar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-400 uppercase">Descripción del Trabajo <span className="text-red-500">*</span></Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Especifique el alcance de su trabajo..."
              rows={3}
              className={`text-sm ${errors.description ? "border-red-500" : "border-slate-200"}`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase">Cantidad</Label>
              <Input
                value={measureDisplay}
                onChange={(e) => handleCostInput(e.target.value, setMeasureDisplay, setMeasure)}
                className={`h-9 text-sm ${errors.measure ? "border-red-500" : "border-slate-200"}`}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase">Unidad</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="h-9 text-sm border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-sm">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase">Valor Unitario</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                <Input
                  value={unitValueDisplay}
                  onChange={(e) => handleCostInput(e.target.value, setUnitValueDisplay, setUnitValue)}
                  className="h-9 text-sm pl-7 border-slate-200"
                />
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-3 lg:col-span-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase">Total Actividad</Label>
              <div className="h-9 px-3 flex items-center rounded-md border border-slate-100 bg-slate-50 text-sm font-bold text-slate-600 tabular-nums">
                ${itemTotal.toLocaleString("es-CO")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Observaciones de Materiales ── */}
      <div className="space-y-2 px-1">
        <Label className="text-[10px] font-bold text-slate-400 uppercase">Notas sobre Materiales / Observaciones (Opcional)</Label>
        <Textarea
          value={materialsDesc}
          onChange={(e) => setMaterialsDesc(e.target.value)}
          placeholder="Si requiere materiales específicos, lístelos aquí..."
          rows={2}
          className="text-sm border-slate-200 bg-slate-50/30"
        />
      </div>

      {/* ── Impuestos y AIU ── */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap gap-5 items-center">
          <div className="flex items-center space-x-2">
            <Checkbox id="iva" checked={taxType === "iva"} onCheckedChange={(c) => setTaxType(c ? "iva" : "none")} />
            <Label htmlFor="iva" className="text-xs font-semibold text-slate-600 cursor-pointer">IVA ({ivaPercent}%)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="aiu" checked={taxType === "aiu"} onCheckedChange={(c) => setTaxType(c ? "aiu" : "none")} />
            <Label htmlFor="aiu" className="text-xs font-semibold text-slate-600 cursor-pointer">Esquema AIU</Label>
          </div>
        </div>

        {taxType === "aiu" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t">
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-slate-400 uppercase">Admin (%)</Label>
              <Input
                type="number"
                value={administrationPerc || ""}
                onChange={(e) => setAdministrationPerc(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                className="h-8 text-xs border-slate-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-slate-400 uppercase">Imprevistos (%)</Label>
              <Input
                type="number"
                value={contingenciesPerc || ""}
                onChange={(e) => setContingenciesPerc(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                className="h-8 text-xs border-slate-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-slate-400 uppercase">Utilidad (%)</Label>
              <Input
                type="number"
                value={profitPerc || ""}
                onChange={(e) => setProfitPerc(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                className="h-8 text-xs border-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Resumen ── */}
      <Card className="shadow-none border-blue-100 bg-blue-50/30">
        <CardContent className="p-5">
           <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Subtotal de ítems:</span>
                <span className="tabular-nums">${itemTotal.toLocaleString("es-CO")}</span>
              </div>
              
              {taxType !== "none" && (
                <div className="flex justify-between text-xs font-semibold text-blue-600">
                  <span>{taxType === "iva" ? "IVA:" : "AIU + IVA:"}</span>
                  <span className="tabular-nums">+${taxAmount.toLocaleString("es-CO", { minimumFractionDigits: 0 })}</span>
                </div>
              )}
              
              <Separator className="my-1 bg-blue-100" />
              
              <div className="flex justify-between items-center bg-blue-100/50 p-3 rounded-lg">
                <span className="text-xs font-extrabold text-blue-700 uppercase tracking-widest">Total Cotización:</span>
                <span className="text-xl font-black text-blue-900 tabular-nums">
                  ${totalContractor.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                </span>
              </div>
           </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2 pb-10">
        <Button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto min-w-[180px] h-11 bg-slate-900 hover:bg-black text-white text-sm font-bold shadow-lg transition-transform active:scale-95"
        >
          {submitting ? (
            <Loader2 className="animate-spin w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isEditing ? "Actualizar Cotización" : "Enviar Cotización"}
        </Button>
      </div>

    </form>
  );
}