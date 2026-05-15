"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Building2, User, DollarSign, Percent, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuoteItems } from "@/hooks/items/useQuoteItems";
import { toast } from "sonner";

interface ManagementQuoteFormProps {
  params: Promise<{ workId: string; itemId: string; quoteId: string }>;
}

export default function ManagementQuoteForm({ params }: ManagementQuoteFormProps) {
  const { workId, itemId, quoteId } = use(params);
  const router = useRouter();
  const numericWorkId = Number.parseInt(workId);
  const numericItemId = Number.parseInt(itemId);
  const numericQuoteId = Number.parseInt(quoteId);

  const { getQuoteItem, updateQuoteItem, submitting } = useQuoteItems();

  const [quote, setQuote] = useState<any>(null);
  console.log(quote);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para ajustes de gerencia
  const [agPercentage, setAgPercentage] = useState<number>(0);
  const [materialsDesc, setMaterialsDesc] = useState<string>("");
  const [materialCost, setMaterialCost] = useState<number>(0);
  const [materialCostDisplay, setMaterialCostDisplay] = useState<string>("");

  // Estados para edición de subquotation (solo ConstruimosAG)
  const [editDescripcion, setEditDescripcion] = useState<string>("");
  const [editUnidad, setEditUnidad] = useState<string>("");
  const [editCantidad, setEditCantidad] = useState<number>(0);
  const [editCantidadDisplay, setEditCantidadDisplay] = useState<string>("");
  const [editPrecioUnitario, setEditPrecioUnitario] = useState<number>(0);
  const [editPrecioUnitarioDisplay, setEditPrecioUnitarioDisplay] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const quoteData = await getQuoteItem(numericQuoteId);
        setQuote(quoteData);

        // Cargar valores iniciales de materials y materialCost
        if (quoteData.materials?.description) {
          setMaterialsDesc(quoteData.materials.description);
        }
        if (quoteData.materialCost) {
          const cost = Number(quoteData.materialCost);
          setMaterialCost(cost);
          setMaterialCostDisplay(formatNumberWithThousands(cost));
        }
        if (quoteData.managementPercentage) {
          setAgPercentage(Number(quoteData.managementPercentage));
        }

        // Si es ConstruimosAG, cargar datos de subquotation para edición
        if (quoteData.ConstruimosAG) {
          let subq = quoteData.subquotations;
          if (typeof subq === "string") {
            try { subq = JSON.parse(subq); } catch { subq = {}; }
          }
          const sq = subq?.item_1 || {};
          setEditDescripcion(sq.description || "");
          setEditUnidad(sq.unit || "");
          const qty = Number(sq.measure || 0);
          const uv = Number(sq.unitValue || 0);
          setEditCantidad(qty);
          setEditCantidadDisplay(qty > 0 ? formatNumberWithThousands(qty) : "");
          setEditPrecioUnitario(uv);
          setEditPrecioUnitarioDisplay(uv > 0 ? formatNumberWithThousands(uv) : "");
        }

        // Cargar item
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const itemRes = await fetch(`${baseUrl}/api/items/${numericItemId}`, {
          credentials: "include",
        });

        if (!itemRes.ok) throw new Error("Error al cargar el ítem");

        const itemData = await itemRes.json();
        setItem(itemData?.data ?? itemData);

        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al cargar los datos");
        setLoading(false);
      }
    };

    void loadData();
  }, [numericQuoteId, numericItemId, getQuoteItem]);

  const formatNumberWithThousands = (value: number) => {
    return value.toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseNumberFromDisplay = (value: string) => {
    const cleaned = value.replace(/\./g, "").replace(",", ".");
    return Number.parseFloat(cleaned) || 0;
  };

  const handleCostInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setDisplay: (v: string) => void,
    setNumeric: (v: number) => void
  ) => {
    const input = e.target;
    const digitsOnly = input.value.replace(/[^0-9]/g, "");
    const numeric = Number(digitsOnly) || 0;
    setNumeric(numeric);
    const formatted = numeric > 0
      ? numeric.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : "";
    setDisplay(formatted);
    // Siempre mover cursor al final para evitar que el punto de miles quede en posición errónea
    requestAnimationFrame(() => {
      input.selectionStart = formatted.length;
      input.selectionEnd = formatted.length;
    });
  };

  const handleCostBlur = (_numeric: number, _setDisplay: (v: string) => void) => {
    // El formato ya se aplica en tiempo real en handleCostInput
  };

  // Al hacer foco muestra dígitos crudos para que el parser no confunda el punto de miles con decimal
  const handleCostFocus = (numeric: number, setDisplay: (v: string) => void) => {
    setDisplay(numeric > 0 ? String(numeric) : "");
  };

  // --- Derived values ---
  const isAG = quote?.ConstruimosAG === true;

  // For AG quotes: subtotal is calculated from edited fields
  const agEditedSubtotal = isAG
    ? Math.round(editCantidad * editPrecioUnitario)
    : 0;

  const calculateSubtotal = () => {
    if (!quote) return 0;
    if (isAG) return agEditedSubtotal;

    const subtotal_base = Number(quote.subtotal || 0);
    const adminPct = Number(quote.administrationPercentage || 0);
    const contPct = Number(quote.contingenciesPercentage || 0);
    const profitPct = Number(quote.profitPercentage || 0);
    const isAIU = adminPct > 0 || contPct > 0 || profitPct > 0;

    let contractorTaxes = 0;
    if (isAIU) {
      const aVal = subtotal_base * (adminPct / 100);
      const iVal = subtotal_base * (contPct / 100);
      const subAI = subtotal_base + aVal + iVal;
      const uVal = subAI * (profitPct / 100);
      const vatOnU = quote.vat ? (uVal * 0.19) : 0;
      contractorTaxes = aVal + iVal + uVal + vatOnU;
    } else if (quote.vat && !quote.ConstruimosAG) {
      contractorTaxes = subtotal_base * 0.19;
    }

    return subtotal_base + contractorTaxes;
  };

  const calculateTotalContractor = () => {
    return calculateSubtotal() + materialCost;
  };

  const calculateAGValue = () => {
    return Math.round(calculateTotalContractor() * (agPercentage / 100));
  };

  const calculateTotalContractorWithAG = () => {
    return calculateTotalContractor() + calculateAGValue();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (agPercentage <= 0) {
      toast.error("Debes ingresar un porcentaje AG válido");
      return;
    }
    if (agPercentage > 100) {
      toast.error("El porcentaje AG no puede ser mayor a 100");
      return;
    }
    if (materialCost < 0) {
      toast.error("El costo de materiales no puede ser negativo");
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const agValue = calculateAGValue();
      const totalContractorFinal = calculateTotalContractorWithAG();
      const subtotalFinal = calculateSubtotal();

      let updatePayload: any = {
        managementPercentage: agPercentage,
        agValue,
        totalContractor: totalContractorFinal,
        materialCost,
        materials: materialsDesc ? { description: materialsDesc } : null,
      };

      // For ConstruimosAG: also update subquotation data and subtotal
      if (isAG) {
        updatePayload = {
          ...updatePayload,
          subquotations: {
            item_1: {
              id: 1,
              description: editDescripcion,
              measure: editCantidad,
              unit: editUnidad,
              unitValue: editPrecioUnitario,
              totalValue: agEditedSubtotal,
            },
          },
          subtotal: subtotalFinal,
        };
      }

      await updateQuoteItem(numericQuoteId, updatePayload as any);

      // QuoteWork handling
      let quoteWork: any = null;
      try {
        const quoteWorkRes = await fetch(`${baseUrl}/api/quote-works?workId=${numericWorkId}`, {
          credentials: "include",
        });
        if (quoteWorkRes.ok) {
          const quoteWorkData = await quoteWorkRes.json();
          const works = quoteWorkData?.data?.quoteWorks ?? quoteWorkData?.data ?? quoteWorkData;
          quoteWork = Array.isArray(works) ? works[0] : works;
        }
      } catch { /* ignored */ }

      if (!quoteWork) {
        const createRes = await fetch(`${baseUrl}/api/quote-works`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workId: numericWorkId, subtotal: 0, total: 0 }),
        });
        if (!createRes.ok) throw new Error("Error al crear QuoteWork");
        const createdData = await createRes.json();
        quoteWork = createdData?.data ?? createdData;
      }

      if (!quote.quoteWorkId) {
        await updateQuoteItem(numericQuoteId, { quoteWorkId: quoteWork.id } as any);
      }

      // Recalculate QuoteWork totals
      const quoteItemsRes = await fetch(`${baseUrl}/api/quote-items?quoteWorkId=${quoteWork.id}`, {
        credentials: "include",
      });
      if (!quoteItemsRes.ok) throw new Error("Error al obtener QuoteItems del QuoteWork");
      const quoteItemsData = await quoteItemsRes.json();
      const allQuoteItems = quoteItemsData?.data?.quoteItems ?? quoteItemsData?.data ?? quoteItemsData;

      let subtotalQuoteWork = 0;
      for (const qi of allQuoteItems) {
        const itemRes = await fetch(`${baseUrl}/api/items/${qi.itemId}`, { credentials: "include" });
        if (itemRes.ok) {
          const itemData = await itemRes.json();
          const it = itemData?.data ?? itemData;
          if (it.active) {
            subtotalQuoteWork +=
              Number(qi.subtotal || 0) + Number(qi.materialCost || 0) + Number(qi.agValue || 0);
          } else {
            await updateQuoteItem(qi.id, { quoteWorkId: null } as any);
          }
        }
      }

      const qwRes = await fetch(`${baseUrl}/api/quote-works/${quoteWork.id}`, { credentials: "include" });
      let totalQuoteWork = subtotalQuoteWork;
      if (qwRes.ok) {
        const qw = await qwRes.json();
        const qwInfo = qw?.data ?? qw;
        if (qwInfo.vat) {
          totalQuoteWork = Math.round(subtotalQuoteWork * 1.19);
        } else if (qwInfo.administrationPercentage || qwInfo.contingenciesPercentage || qwInfo.profitPercentage) {
          const admin = Number(qwInfo.administrationPercentage || 0) / 100;
          const contingencies = Number(qwInfo.contingenciesPercentage || 0) / 100;
          const profit = Number(qwInfo.profitPercentage || 0) / 100;
          const aiuValue = subtotalQuoteWork * (admin + contingencies);
          const profitValue = (subtotalQuoteWork + aiuValue) * profit;
          const ivaOnProfit = profitValue * 0.19;
          totalQuoteWork = Math.round(subtotalQuoteWork + aiuValue + profitValue + ivaOnProfit);
        }
      }

      await fetch(`${baseUrl}/api/quote-works/${quoteWork.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtotal: subtotalQuoteWork, total: totalQuoteWork }),
      });

      toast.success("Cotización guardada correctamente");
      router.push(`/management/works/${numericWorkId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al finalizar la cotización");
    }
  };

  const getContractorName = (quote: any) => {
    if (quote.ConstruimosAG) return "Construimos AG";
    if (quote.externalContractorName) return `${quote.externalContractorName} (Externo)`;
    if (quote.assignedContractor) {
      return `${quote.assignedContractor.name || ""} (Contratista)`.trim();
    }
    return "Contratista no especificado";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-purple-500" />
            <p className="text-muted-foreground">Cargando cotización...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !quote || !item) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <Card className="max-w-2xl mx-auto border-red-200">
            <CardHeader className="bg-red-500 text-white rounded-t-lg">
              <CardTitle>Error al cargar</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-destructive">{error || "No se pudo cargar la información"}</p>
              <Button onClick={() => router.push(`/management/works/${numericWorkId}`)} variant="outline">
                Volver
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Parse subquotation for display
  let subqDisplay: any = quote.subquotations;
  if (typeof subqDisplay === "string") {
    try { subqDisplay = JSON.parse(subqDisplay); } catch { subqDisplay = {}; }
  }
  const subqItems = subqDisplay ? Object.values(subqDisplay) : [];

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/management/works/${numericWorkId}/items/${numericItemId}/quotations`)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {quote.quoteWorkId ? "Editar Cotización" : "Ajustar Cotización"}
              </h1>
              {isAG ? (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  <Building2 className="h-3 w-3 mr-1" />
                  Construimos AG
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <User className="h-3 w-3 mr-1" />
                  Contratista
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{item.description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── SECCIÓN 1: INFORMACIÓN DE LA COTIZACIÓN ── */}
          <Card className="overflow-hidden">
            <CardHeader className={`py-4 px-6 ${isAG ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white" : "bg-gradient-to-r from-orange-600 to-orange-700 text-white"}`}>
              <div className="flex items-center gap-2">
                {isAG ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                <CardTitle className="text-white text-base">
                  {isAG ? "Cotización — Construimos AG" : `Cotización — ${getContractorName(quote)}`}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">

              {/* Contratista (read-only) */}
              {!isAG && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                      Contratista
                    </Label>
                    <Input value={getContractorName(quote)} className="bg-muted/30 font-medium" readOnly />
                  </div>
                  {quote.externalContractorIdentifier && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                        Identificación
                      </Label>
                      <Input value={quote.externalContractorIdentifier} className="bg-muted/30" readOnly />
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Procesos cotizados */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Procesos Cotizados
                </h3>

                {isAG ? (
                  /* ConstruimosAG: editable fields */
                  <div className="rounded-lg border bg-purple-50/50 dark:bg-purple-900/10 p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                          Descripción <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          value={editDescripcion}
                          onChange={(e) => setEditDescripcion(e.target.value)}
                          placeholder="Descripción de la actividad..."
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                          Unidad <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={editUnidad}
                          onValueChange={(value) => setEditUnidad(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UND">UND</SelectItem>
                            <SelectItem value="M2">M2</SelectItem>
                            <SelectItem value="M3">M3</SelectItem>
                            <SelectItem value="ML">ML</SelectItem>
                            <SelectItem value="KM">KM</SelectItem>
                            <SelectItem value="KG">KG</SelectItem>
                            <SelectItem value="LT">LT</SelectItem>
                            <SelectItem value="GLB">GLB</SelectItem>
                            <SelectItem value="HR">HR</SelectItem>
                            <SelectItem value="DIA">DIA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                          Cantidad <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          value={editCantidadDisplay}
                          onChange={(e) =>
                            handleCostInput(e, setEditCantidadDisplay, setEditCantidad)
                          }
                          onFocus={() => handleCostFocus(editCantidad, setEditCantidadDisplay)}
                          onBlur={() => handleCostBlur(editCantidad, setEditCantidadDisplay)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                          Valor Unitario <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="text"
                            value={editPrecioUnitarioDisplay}
                            onChange={(e) =>
                              handleCostInput(e, setEditPrecioUnitarioDisplay, setEditPrecioUnitario)
                            }
                            onFocus={() => handleCostFocus(editPrecioUnitario, setEditPrecioUnitarioDisplay)}
                            onBlur={() => handleCostBlur(editPrecioUnitario, setEditPrecioUnitarioDisplay)}
                            placeholder="0"
                            className="pl-7"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                          Valor Total (calculado)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            value={formatNumberWithThousands(agEditedSubtotal)}
                            className="bg-muted/30 font-bold text-purple-700 dark:text-purple-400 pl-7"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* External contractor: read-only display */
                  <div className="space-y-3">
                    {subqItems.map((sq: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-lg border bg-muted/20 p-4 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-sm"
                      >
                        <div className="col-span-2 sm:col-span-4">
                          <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                            Descripción
                          </span>
                          <p className="font-medium mt-0.5">{sq.description}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                            Unidad
                          </span>
                          <p className="font-medium mt-0.5">{sq.unit}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                            Cantidad
                          </span>
                          <p className="font-medium mt-0.5">{formatCurrency(Number(sq.measure))}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                            V. Unitario
                          </span>
                          <p className="font-medium mt-0.5">${formatCurrency(Number(sq.unitValue))}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                            V. Total
                          </span>
                          <p className="font-bold text-purple-700 dark:text-purple-400 mt-0.5">
                            ${formatCurrency(Number(sq.totalValue))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subtotal del contratista (read only for external, calculated for AG) */}
              <div className="space-y-2 mt-4">
                {!isAG && quote.vat && (
                  <div className="flex items-center justify-between px-1 text-sm">
                    <span className="text-muted-foreground">
                      + {quote.administrationPercentage || quote.contingenciesPercentage || quote.profitPercentage ? "Impuestos AIU " : "IVA "}
                      del contratista:
                    </span>
                    <span className="font-medium text-foreground">
                      +${formatCurrency(Number(quote.agValue || 0))}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3 border">
                  <span className="text-sm font-medium text-muted-foreground">
                    Subtotal Contratista {(!isAG && quote.vat) ? "(incl. impuestos)" : ""}
                  </span>
                  <span className="text-lg font-bold tabular-nums">
                    ${formatCurrency(calculateSubtotal())}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── SECCIÓN 2: AJUSTES DE GERENCIA ── */}
          <Card className="overflow-hidden">
            <CardHeader className="py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <CardTitle className="text-white text-base">Ajustes de Gerencia</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">

              {/* Descripción de materiales */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Descripción de Materiales
                </Label>
                <Textarea
                  value={materialsDesc}
                  onChange={(e) => setMaterialsDesc(e.target.value)}
                  placeholder={isAG ? "Descripción de materiales de Construimos AG..." : "Descripción de los materiales requeridos..."}
                  rows={3}
                  className="resize-none"
                />
                {!isAG && quote.materials?.description && (
                  <p className="text-xs text-muted-foreground">
                    Original del contratista: <em>{quote.materials.description}</em>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Costo de Materiales */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Costo de Materiales
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="text"
                      value={materialCostDisplay}
                      onChange={(e) =>
                        handleCostInput(e, setMaterialCostDisplay, setMaterialCost)
                      }
                      onFocus={() => handleCostFocus(materialCost, setMaterialCostDisplay)}
                      onBlur={() => handleCostBlur(materialCost, setMaterialCostDisplay)}
                      placeholder="0"
                      className="pl-7"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Escribe el valor; se formateará con puntos de miles</p>
                </div>

                {/* Porcentaje AG */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Porcentaje AG <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={agPercentage || ""}
                      onChange={(e) => {
                        const value = Number.parseFloat(e.target.value) || 0;
                        if (value > 100) {
                          setAgPercentage(100);
                          toast.warning("El porcentaje AG no puede ser mayor a 100%");
                        } else {
                          setAgPercentage(value);
                        }
                      }}
                      placeholder="0.00"
                      className="pr-8"
                      required
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Porcentaje de administración y gestión (máx. 100%)</p>
                </div>
              </div>

              {/* Valor unitario AG actual */}
              {(() => {
                const qty = isAG ? editCantidad : Number((subqItems[0] as any)?.measure || 0);
                const total = calculateTotalContractorWithAG();
                if (qty <= 0 || total <= 0) return null;
                const unitValue = total / qty;
                return (
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 mt-2">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Valor unitario AG actual:
                    </span>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                      ${formatCurrency(unitValue)}
                    </span>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* ── SECCIÓN 3: RESUMEN FINAL ── */}
          <Card className="overflow-hidden border-2 border-green-200 dark:border-green-800">
            <CardHeader className="py-4 px-6 bg-gradient-to-r from-green-600 to-green-700 text-white">
              <CardTitle className="text-white text-base">Resumen Final</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Subtotal contratista {(!isAG && quote.vat) ? "(incl. impuestos)" : ""}:</span>
                  <span className="font-semibold tabular-nums">${formatCurrency(calculateSubtotal())}</span>
                </div>

                {materialCost > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">+ Materiales:</span>
                    <span className="font-semibold text-blue-600 tabular-nums">
                      +${formatCurrency(materialCost)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Base total contratista:</span>
                  <span className="font-semibold tabular-nums">${formatCurrency(calculateTotalContractor())}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span>+ AG</span>
                    <Badge variant="outline" className="text-[10px] py-0 h-4">
                      {agPercentage}%
                    </Badge>
                  </div>
                  <span className="font-semibold text-purple-600 tabular-nums">
                    +${formatCurrency(calculateAGValue())}
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-base font-bold">Subtotal Final:</span>
                  <span className="text-2xl font-bold text-green-600 tabular-nums">
                    ${formatCurrency(calculateTotalContractorWithAG())}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex justify-end gap-3 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(`/management/works/${numericWorkId}/items/${numericItemId}/quotations`)
              }
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white min-w-[180px]"
              disabled={submitting || agPercentage <= 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {quote.quoteWorkId ? "Actualizar Cotización" : "Finalizar Cotización"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}