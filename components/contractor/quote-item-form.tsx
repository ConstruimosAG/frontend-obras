"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
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

interface LineItem {
  description: string;
  measure: number;
  unit: string;
  unitValue: number;
  measureDisplay: string;
  unitValueDisplay: string;
}

const emptyLineItem = (): LineItem => ({
  description: "",
  measure: 0,
  unit: "UND",
  unitValue: 0,
  measureDisplay: "",
  unitValueDisplay: "",
});

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

  const getInitialLineItems = (): LineItem[] => {
    // Editing mode: load all existing items from the JSON
    if (rawSubq) {
      const subq = typeof rawSubq === "string" ? JSON.parse(rawSubq) : rawSubq;
      const keys = Object.keys(subq).sort();
      if (keys.length > 0) {
        return keys.map((key) => {
          const d = subq[key];
          return {
            description: d.description || "",
            measure: d.measure || 0,
            unit: d.unit || "UND",
            unitValue: d.unitValue || 0,
            measureDisplay: d.measure > 0 ? String(d.measure) : "",
            unitValueDisplay: d.unitValue > 0 ? String(d.unitValue) : "",
          };
        });
      }
    }

    // External contractors always start fresh
    if (isExternal) return [emptyLineItem()];

    // Internal contractor: preload first item from the reference quote
    if (item?.quoteItems?.length > 0) {
      const ref =
        item.quoteItems.find((q: any) => q.assignedContractorId === currentUser?.id) ||
        item.quoteItems.find((q: any) => !q.assignedContractorId && !q.ConstruimosAG) ||
        item.quoteItems.find((q: any) => q.ConstruimosAG);

      if (ref) {
        let subqData = ref.subquotations;
        if (typeof subqData === "string") try { subqData = JSON.parse(subqData); } catch { subqData = {}; }
        const firstKey = Object.keys(subqData)[0];
        const data = subqData[firstKey] || {};
        return [{
          description: data.description || "",
          measure: data.measure || 0,
          unit: data.unit || "UND",
          unitValue: data.unitValue || 0,
          measureDisplay: data.measure > 0 ? String(data.measure) : "",
          unitValueDisplay: data.unitValue > 0 ? String(data.unitValue) : "",
        }];
      }
    }

    return [emptyLineItem()];
  };

  const getInitialMaterials = (): string => {
    if (initMaterials?.description) return initMaterials.description;
    if (!isExternal && item?.quoteItems?.length > 0) {
      const ref =
        item.quoteItems.find((q: any) => q.assignedContractorId === currentUser?.id) ||
        item.quoteItems.find((q: any) => !q.assignedContractorId && !q.ConstruimosAG) ||
        item.quoteItems.find((q: any) => q.ConstruimosAG);
      if (ref) {
        let mats = ref.materials;
        if (typeof mats === "string") try { mats = JSON.parse(mats); } catch { mats = {}; }
        return mats?.description || "";
      }
    }
    return "";
  };

  // States
  const [externalName, setExternalName] = useState(initExtName);
  const [externalIdentifier, setExternalIdentifier] = useState(initExtId);
  const [lineItems, setLineItems] = useState<LineItem[]>(getInitialLineItems);
  const [materialsDesc, setMaterialsDesc] = useState(getInitialMaterials);
  const [referenceQuoteId, setReferenceQuoteId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tax states
  const [administrationPerc, setAdministrationPerc] = useState(initAdmin);
  const [contingenciesPerc, setContingenciesPerc] = useState(initCont);
  const [profitPerc, setProfitPerc] = useState(initProfit);
  const [taxType, setTaxType] = useState<"none" | "iva" | "aiu">(
    initVat ? (initAdmin > 0 ? "aiu" : "iva") : "none"
  );

  // Sync reference quote ID for internal contractors
  useEffect(() => {
    if (isExternal) return;
    if (item?.quoteItems?.length > 0) {
      const ref =
        item.quoteItems.find((q: any) => q.assignedContractorId === currentUser?.id) ||
        item.quoteItems.find((q: any) => !q.assignedContractorId && !q.ConstruimosAG) ||
        item.quoteItems.find((q: any) => q.ConstruimosAG);
      if (ref) setReferenceQuoteId(ref.id);
    }
  }, [item, currentUser]);

  // Input helpers
  const parseCostInput = (inputValue: string): { numeric: number; displayValue: string } => {
    const raw = inputValue.replace(/\./g, "").replace(/[^0-9,]/g, "");
    const commaIdx = raw.indexOf(",");
    let intStr: string;
    let decStr = "";
    let hasDecimal = false;
    if (commaIdx !== -1) {
      intStr = raw.substring(0, commaIdx);
      decStr = raw.substring(commaIdx + 1).replace(/,/g, "");
      hasDecimal = true;
    } else {
      intStr = raw;
    }
    const intNum = Number(intStr) || 0;
    const numeric = hasDecimal ? parseFloat(`${intStr || "0"}.${decStr}`) || 0 : intNum;
    const formattedInt =
      intNum > 0
        ? intNum.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
        : intStr === "" ? "" : "0";
    const displayValue = hasDecimal ? `${formattedInt},${decStr}` : formattedInt;
    return { numeric, displayValue };
  };

  const updateLineItem = (index: number, patch: Partial<LineItem>) => {
    setLineItems((prev) => prev.map((li, i) => (i === index ? { ...li, ...patch } : li)));
  };

  const handleMeasureInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const { numeric, displayValue } = parseCostInput(input.value);
    updateLineItem(index, { measure: numeric, measureDisplay: displayValue });
    requestAnimationFrame(() => {
      input.selectionStart = displayValue.length;
      input.selectionEnd = displayValue.length;
    });
  };

  const handleUnitValueInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const { numeric, displayValue } = parseCostInput(input.value);
    updateLineItem(index, { unitValue: numeric, unitValueDisplay: displayValue });
    requestAnimationFrame(() => {
      input.selectionStart = displayValue.length;
      input.selectionEnd = displayValue.length;
    });
  };

  const handleFocus = (index: number, field: "measure" | "unitValue") => {
    const numeric = lineItems[index][field];
    const raw = numeric === 0 ? "" : Number.isInteger(numeric) ? String(numeric) : String(numeric).replace(".", ",");
    updateLineItem(index, field === "measure" ? { measureDisplay: raw } : { unitValueDisplay: raw });
  };

  const addLineItem = () => setLineItems((prev) => [...prev, emptyLineItem()]);

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const lineSubtotals = useMemo(() => lineItems.map((li) => li.measure * li.unitValue), [lineItems]);
  const subtotal = useMemo(() => lineSubtotals.reduce((sum, s) => sum + s, 0), [lineSubtotals]);

  const adminAmount = useMemo(() => (taxType === "aiu" ? subtotal * (administrationPerc / 100) : 0), [taxType, subtotal, administrationPerc]);
  const contingenciesAmount = useMemo(() => (taxType === "aiu" ? subtotal * (contingenciesPerc / 100) : 0), [taxType, subtotal, contingenciesPerc]);
  const totalDirectCost = useMemo(() => subtotal + adminAmount + contingenciesAmount, [subtotal, adminAmount, contingenciesAmount]);
  const profitAmount = useMemo(() => (taxType === "aiu" ? subtotal * (profitPerc / 100) : 0), [taxType, subtotal, profitPerc]);
  const ivaOnProfit = useMemo(() => (taxType === "aiu" ? profitAmount * (ivaPercent / 100) : 0), [taxType, profitAmount, ivaPercent]);
  const taxAmount = useMemo(() => {
    if (taxType === "iva") return subtotal * (ivaPercent / 100);
    if (taxType === "aiu") return adminAmount + contingenciesAmount + profitAmount + ivaOnProfit;
    return 0;
  }, [taxType, subtotal, ivaPercent, adminAmount, contingenciesAmount, profitAmount, ivaOnProfit]);
  const totalContractor = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (isExternal) {
      if (!externalName.trim()) newErrors.externalName = "Requerido";
      if (!externalIdentifier.trim()) newErrors.externalIdentifier = "Requerido";
    }

    lineItems.forEach((li, i) => {
      if (!li.description.trim()) newErrors[`desc_${i}`] = "Requerido";
      if (li.measure <= 0) newErrors[`measure_${i}`] = "Debe ser mayor a 0";
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (submitting) return;

    const subquotations: Record<string, any> = {};
    lineItems.forEach((li, i) => {
      subquotations[`item_${i + 1}`] = {
        id: i + 1,
        description: li.description,
        measure: li.measure,
        unit: li.unit,
        unitValue: li.unitValue,
        totalValue: li.measure * li.unitValue,
      };
    });

    const payload = {
      itemId: Number(item.id),
      subquotations,
      totalContractor: Number(totalContractor.toFixed(2)),
      materials: materialsDesc ? { description: materialsDesc } : null,
      materialCost: null,
      subtotal: Number(subtotal.toFixed(2)),
      managementPercentage: null,
      administrationPercentage: taxType === "aiu" ? administrationPerc : null,
      contingenciesPercentage: taxType === "aiu" ? contingenciesPerc : null,
      profitPercentage: taxType === "aiu" ? profitPerc : null,
      agValue: taxType !== "none" ? Number(taxAmount.toFixed(2)) : null,
      vat: taxType !== "none",
      assignedContractorId: isExternal ? null : (currentUser?.id || null),
      ConstruimosAG: false,
      ...(isExternal && {
        externalContractorName: externalName.trim(),
        externalContractorIdentifier: externalIdentifier.trim(),
      }),
    };

    try {
      const targetId = (isEditing && initial?.id) ? initial.id : referenceQuoteId;
      const result = targetId
        ? await updateQuoteItem(targetId, payload as any)
        : await createQuoteItem(payload as any);
      onSaved?.(result);
    } catch (err: any) {
      toast.error(err?.message || "Error al procesar");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Contratista Externo */}
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

      {/* Ítems de cotización */}
      <div className="space-y-3">
        {lineItems.map((li, index) => (
          <div key={index} className="rounded-lg border border-gray-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Ítem {index + 1}</span>
              {lineItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLineItem(index)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-400 uppercase">
                Descripción de la actividad <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={li.description}
                onChange={(e) => updateLineItem(index, { description: e.target.value })}
                placeholder="Describa brevemente la actividad..."
                rows={2}
                className={`text-sm resize-none ${errors[`desc_${index}`] ? "border-red-500" : "border-gray-200 focus:border-purple-400 focus:ring-0"}`}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">Cantidad</Label>
                <Input
                  value={li.measureDisplay}
                  onChange={(e) => handleMeasureInput(index, e)}
                  onFocus={() => handleFocus(index, "measure")}
                  className={`h-9 text-sm ${errors[`measure_${index}`] ? "border-red-500" : "border-gray-200 focus:border-purple-400 focus:ring-0"}`}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">Unidad</Label>
                <Select value={li.unit} onValueChange={(v) => updateLineItem(index, { unit: v })}>
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
                    value={li.unitValueDisplay}
                    onChange={(e) => handleUnitValueInput(index, e)}
                    onFocus={() => handleFocus(index, "unitValue")}
                    className="h-9 text-sm pl-7 border-gray-200 focus:border-purple-400 focus:ring-0"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">Subtotal</Label>
                <div className="h-9 px-3 flex items-center rounded-md border border-gray-50 bg-gray-50/50 text-sm font-bold text-gray-600">
                  ${lineSubtotals[index].toLocaleString("es-CO")}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Agregar ítem */}
        <button
          type="button"
          onClick={addLineItem}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-purple-300 py-2.5 text-sm font-semibold text-purple-500 hover:bg-purple-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Agregar ítem
        </button>
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
              <Input type="number" value={administrationPerc || ""} onChange={(e) => setAdministrationPerc(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))} className="h-8 text-xs border-gray-200 focus:ring-0" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-gray-400 uppercase">Impr. %</Label>
              <Input type="number" value={contingenciesPerc || ""} onChange={(e) => setContingenciesPerc(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))} className="h-8 text-xs border-gray-200 focus:ring-0" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-gray-400 uppercase">Util. %</Label>
              <Input type="number" value={profitPerc || ""} onChange={(e) => setProfitPerc(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))} className="h-8 text-xs border-gray-200 focus:ring-0" />
            </div>
          </div>
        )}
      </div>

      {/* Resumen Final */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center gap-2 border-b border-purple-100 pb-2">
          <h2 className="text-lg font-bold text-gray-800">Resumen</h2>
        </div>

        <div className="bg-gray-50/50 rounded-lg p-5 space-y-2">
          {/* Detalle por ítem */}
          {lineItems.map((li, i) => (
            <div key={i} className="flex justify-between text-xs text-gray-500">
              <span className="truncate max-w-[65%]">
                <span className="font-bold text-gray-400 mr-1">Ítem {i + 1}:</span>
                {li.description || <span className="italic text-gray-300">Sin descripción</span>}
              </span>
              <span className="tabular-nums font-semibold">${lineSubtotals[i].toLocaleString("es-CO")}</span>
            </div>
          ))}

          {/* Subtotal general */}
          <div className="flex justify-between text-xs font-bold text-gray-700 border-t border-gray-200 pt-2 mt-1">
            <span>Subtotal</span>
            <span className="tabular-nums">${subtotal.toLocaleString("es-CO")}</span>
          </div>

          {/* IVA */}
          {taxType === "iva" && (
            <div className="flex justify-between text-xs font-bold text-purple-600">
              <span>IVA ({ivaPercent}%):</span>
              <span className="tabular-nums">+${taxAmount.toLocaleString("es-CO")}</span>
            </div>
          )}

          {/* AIU */}
          {taxType === "aiu" && (
            <div className="space-y-1.5 text-[11px] text-gray-600 pt-1 border-t border-gray-100">
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

          {/* Total */}
          <div className="flex justify-between items-center bg-purple-600 p-4 rounded-lg shadow-sm text-white mt-3">
            <span className="text-xs font-bold uppercase tracking-widest">Total Cotización</span>
            <span className="text-xl font-bold tabular-nums">${totalContractor.toLocaleString("es-CO")}</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto h-11 px-10 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-lg transition-all"
          >
            {submitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isEditing ? "Actualizar Cotización" : "Enviar Cotización"}
          </Button>
        </div>
      </div>

    </form>
  );
}
