"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para ajustes de gerencia
  const [agPercentage, setAgPercentage] = useState<number>(0);
  const [materialsDesc, setMaterialsDesc] = useState<string>("");
  const [materialCost, setMaterialCost] = useState<number>(0);
  const [materialCostDisplay, setMaterialCostDisplay] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Cargar QuoteItem (sin verificar si está finalizado)
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseNumberFromDisplay = (value: string) => {
    // Remover puntos y reemplazar coma por punto
    const cleaned = value.replace(/\./g, "").replace(",", ".");
    return Number.parseFloat(cleaned) || 0;
  };

  const handleMaterialCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaterialCostDisplay(value);

    // Parsear para guardar el valor numérico
    const numericValue = parseNumberFromDisplay(value);
    if (numericValue < 0) {
      setMaterialCost(0);
      toast.warning("El costo de materiales no puede ser negativo");
    } else {
      setMaterialCost(numericValue);
    }
  };

  const handleMaterialCostBlur = () => {
    // Al salir del campo, formatear con miles
    setMaterialCostDisplay(formatNumberWithThousands(materialCost));
  };

  const calculateSubtotal = () => {
    if (!quote) return 0;
    // Subtotal es del contratista, no cambia
    return Number(quote.subtotal);
  };

  const calculateTotalContractor = () => {
    const subtotal = calculateSubtotal();
    // Total Contractor = subtotal + materialCost
    return subtotal + materialCost;
  };

  const calculateAGValue = () => {
    const totalContractor = calculateTotalContractor();
    // AG Value = totalContractor * (managementPercentage / 100)
    return Math.round(totalContractor * (agPercentage / 100));
  };

  const calculateTotalContractorWithAG = () => {
    const totalContractor = calculateTotalContractor();
    const agValue = calculateAGValue();
    // Total final = totalContractor + agValue
    return totalContractor + agValue;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
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

      // 1. Calcular valores
      const agValue = calculateAGValue();
      const totalContractorFinal = calculateTotalContractorWithAG();

      // 2. Actualizar el QuoteItem con los valores de gerencia
      await updateQuoteItem(numericQuoteId, {
        managementPercentage: agPercentage,
        agValue: agValue,
        totalContractor: totalContractorFinal,
        materialCost: materialCost,
        materials: materialsDesc ? { description: materialsDesc } : null,
      } as any);

      // 3. Verificar si existe QuoteWork para esta obra
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
      } catch (err) {
      }

      // 4. Si no existe QuoteWork, crearlo
      if (!quoteWork) {
        const createRes = await fetch(`${baseUrl}/api/quote-works`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workId: numericWorkId,
            subtotal: 0,
            total: 0,
          }),
        });

        if (!createRes.ok) {
          throw new Error("Error al crear QuoteWork");
        }

        const createdData = await createRes.json();
        quoteWork = createdData?.data ?? createdData;
      }

      // 5. Asignar el QuoteItem al QuoteWork (si no está asignado)
      if (!quote.quoteWorkId) {
        await updateQuoteItem(numericQuoteId, {
          quoteWorkId: quoteWork.id,
        } as any);
      }

      // 6. Obtener todos los QuoteItems del QuoteWork
      const quoteItemsRes = await fetch(`${baseUrl}/api/quote-items?quoteWorkId=${quoteWork.id}`, {
        credentials: "include",
      });

      if (!quoteItemsRes.ok) {
        throw new Error("Error al obtener QuoteItems del QuoteWork");
      }

      const quoteItemsData = await quoteItemsRes.json();
      const allQuoteItems = quoteItemsData?.data?.quoteItems ?? quoteItemsData?.data ?? quoteItemsData;

      // 7. Validar items activos y calcular totales
      let subtotalQuoteWork = 0;
      const activeQuoteItemIds: number[] = [];

      for (const qi of allQuoteItems) {
        // Verificar si el item está activo
        const itemRes = await fetch(`${baseUrl}/api/items/${qi.itemId}`, {
          credentials: "include",
        });

        if (itemRes.ok) {
          const itemData = await itemRes.json();
          const item = itemData?.data ?? itemData;

          if (item.active) {
            // Item activo, incluirlo en el cálculo
            // subtotal + materialCost + agValue
            const itemTotal =
              Number(qi.subtotal || 0) +
              Number(qi.materialCost || 0) +
              Number(qi.agValue || 0);
            subtotalQuoteWork += itemTotal;
            activeQuoteItemIds.push(qi.id);
          } else {
            // Item inactivo, removerlo del QuoteWork
            await updateQuoteItem(qi.id, {
              quoteWorkId: null,
            } as any);
          }
        }
      }

      // 8. Calcular total del QuoteWork según IVA/AIU
      const quoteWorkData = await fetch(`${baseUrl}/api/quote-works/${quoteWork.id}`, {
        credentials: "include",
      });

      let totalQuoteWork = subtotalQuoteWork;

      if (quoteWorkData.ok) {
        const qw = await quoteWorkData.json();
        const quoteWorkInfo = qw?.data ?? qw;

        if (quoteWorkInfo.vat) {
          // IVA simple
          totalQuoteWork = Math.round(subtotalQuoteWork * 1.19);
        } else if (
          quoteWorkInfo.administrationPercentage ||
          quoteWorkInfo.contingenciesPercentage ||
          quoteWorkInfo.profitPercentage
        ) {
          // AIU
          const admin = Number(quoteWorkInfo.administrationPercentage || 0) / 100;
          const contingencies = Number(quoteWorkInfo.contingenciesPercentage || 0) / 100;
          const profit = Number(quoteWorkInfo.profitPercentage || 0) / 100;

          const aiuValue = subtotalQuoteWork * (admin + contingencies);
          const profitValue = (subtotalQuoteWork + aiuValue) * profit;
          const ivaOnProfit = profitValue * 0.19;

          totalQuoteWork = Math.round(
            subtotalQuoteWork + aiuValue + profitValue + ivaOnProfit
          );
        }
      }

      // 9. Actualizar QuoteWork con los totales finales
      const updateRes = await fetch(`${baseUrl}/api/quote-works/${quoteWork.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotal: subtotalQuoteWork,
          total: totalQuoteWork,
        }),
      });

      if (!updateRes.ok) {
        throw new Error("Error al actualizar QuoteWork");
      }

      toast.success("Cotización actualizada correctamente");
      router.push(`/management/works/${numericWorkId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al finalizar la cotización");
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getContractorName = (quote: any) => {
    if (quote.externalContractorName) {
      return `${quote.externalContractorName} (Externo)`;
    }
    if (quote.assignedContractor) {
      return `${quote.assignedContractor.firstName || ""} ${quote.assignedContractor.lastName || ""}`.trim();
    }
    return "Contratista no especificado";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-orange-500" />
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
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="bg-red-500 text-white">
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-destructive">{error || "No se pudo cargar la información"}</p>
                <Button
                  onClick={() => router.push(`/management/works/${numericWorkId}`)}
                  variant="outline"
                >
                  Volver
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex items-start gap-3 sm:gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/management/works/${numericWorkId}/items/${numericItemId}/quotations`)}
            className="shrink-0 mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              {quote.quoteWorkId ? "Editar Cotización" : "Ajustar Cotización"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {item.description}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información de la cotización seleccionada */}
          <Card>
            <CardHeader>
              <CardTitle>Cotización Seleccionada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Contratista
                  </label>
                  <Input
                    value={getContractorName(quote)}
                    className="bg-gray-50"
                    readOnly
                  />
                </div>
                {quote.externalContractorIdentifier && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Identificación
                    </label>
                    <Input
                      value={quote.externalContractorIdentifier}
                      className="bg-gray-50"
                      readOnly
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Items de la cotización */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  Procesos Cotizados
                </h3>
                {quote.subquotations && Object.values(quote.subquotations).map((item: any, idx: number) => (
                  <div key={idx} className="space-y-2 mb-4">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Descripción</span>
                        <p className="font-medium">{item.description}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Valor Unitario</span>
                        <p className="font-medium">${formatCurrency(Number(item.unitValue))}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Medida</span>
                        <p className="font-medium">{item.measure} {item.unit}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total</span>
                        <p className="font-medium">${formatCurrency(Number(item.totalValue))}</p>
                      </div>
                    </div>
                    {idx < Object.values(quote.subquotations).length - 1 && <Separator className="mt-2" />}
                  </div>
                ))}
              </div>

              {quote.materials?.description && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Materiales (Original)
                    </label>
                    <Textarea
                      value={quote.materials.description}
                      className="bg-gray-50 mt-1"
                      rows={2}
                      readOnly
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Puedes modificar esto en "Ajustes de Gerencia"
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Subtotal Contratista
                  </label>
                  <Input
                    value={`$${formatCurrency(Number(quote.subtotal))}`}
                    className="bg-gray-50 font-semibold"
                    readOnly
                  />
                </div>
                {quote.vat && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {quote.agValue ? "AIU + IVA" : "IVA (19%)"}
                    </label>
                    <Badge className={quote.agValue ? "bg-blue-500" : "bg-green-500"}>
                      Incluido
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ajustes de Gerencia */}
          <Card>
            <CardHeader>
              <CardTitle>Ajustes de Gerencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Descripción de Materiales
                </label>
                <Textarea
                  value={materialsDesc}
                  onChange={(e) => setMaterialsDesc(e.target.value)}
                  placeholder="Descripción de los materiales requeridos..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Modifica la descripción de materiales si es necesario
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Costo de Materiales <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={materialCostDisplay}
                    onChange={handleMaterialCostChange}
                    onBlur={handleMaterialCostBlur}
                    placeholder="0,00"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ajusta el costo de materiales (se mostrará con formato de miles)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Porcentaje AG <span className="text-red-500">*</span>
                  </label>
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
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Porcentaje de administración y gestión (máximo 100%)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen Final</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal Contratista:</span>
                <span className="font-medium">${formatCurrency(calculateSubtotal())}</span>
              </div>

              {materialCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Materiales:</span>
                  <span className="font-medium text-blue-600">
                    +${formatCurrency(materialCost)}
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Contratista (base):</span>
                <span className="font-medium">${formatCurrency(calculateTotalContractor())}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">AG ({agPercentage}%):</span>
                <span className="font-medium text-orange-600">
                  +${formatCurrency(calculateAGValue())}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg">
                <span className="font-bold">Subtotal:</span>
                <span className="font-bold text-green-600">
                  ${formatCurrency(calculateTotalContractorWithAG())}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/management/works/${numericWorkId}/items/${numericItemId}/quotations`)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
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
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}