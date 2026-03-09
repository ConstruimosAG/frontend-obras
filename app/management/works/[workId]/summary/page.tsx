"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Pencil, TrendingUp, AlertCircle, Users, Wrench, ClipboardList, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useItems } from "@/hooks/items/useItems";
import { toast } from "sonner";

interface WorkSummaryPageProps {
    params: Promise<{ workId: string }>;
}

export default function WorkSummaryPage({ params }: WorkSummaryPageProps) {
    const { workId } = use(params);
    const router = useRouter();
    const numericWorkId = Number.parseInt(workId);

    const { items, loading: itemsLoading } = useItems(numericWorkId);
    const [work, setWork] = useState<any>(null);
    const [quoteWork, setQuoteWork] = useState<any>(null);
    const [loadingWork, setLoadingWork] = useState(true);
    const [loadingQuoteWork, setLoadingQuoteWork] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Estados para IVA/AIU
    const [useIVA, setUseIVA] = useState(false);
    const [useAIU, setUseAIU] = useState(false);
    const [administrationPercentage, setAdministrationPercentage] = useState<number>(0);
    const [contingenciesPercentage, setContingenciesPercentage] = useState<number>(0);
    const [profitPercentage, setProfitPercentage] = useState<number>(0);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingWork(true);
                setLoadingQuoteWork(true);
                const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

                // Cargar Work
                const workRes = await fetch(`${baseUrl}/api/works/${numericWorkId}`, {
                    credentials: "include",
                });

                if (workRes.ok) {
                    const workData = await workRes.json();
                    setWork(workData?.data ?? workData);
                }

                // Cargar QuoteWork
                const quoteWorkRes = await fetch(`${baseUrl}/api/quote-works?workId=${numericWorkId}`, {
                    credentials: "include",
                });

                if (quoteWorkRes.ok) {
                    const quoteWorkData = await quoteWorkRes.json();
                    const works = quoteWorkData?.data?.quoteWorks ?? quoteWorkData?.data ?? quoteWorkData;
                    const qw = Array.isArray(works) ? works[0] : works;

                    if (qw) {
                        setQuoteWork(qw);
                        // Cargar configuración de IVA/AIU
                        setUseIVA(qw.vat || false);
                        setUseAIU(!!(qw.administrationPercentage || qw.contingenciesPercentage || qw.profitPercentage));
                        setAdministrationPercentage(Number(qw.administrationPercentage || 0));
                        setContingenciesPercentage(Number(qw.contingenciesPercentage || 0));
                        setProfitPercentage(Number(qw.profitPercentage || 0));
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingWork(false);
                setLoadingQuoteWork(false);
            }
        };

        void loadData();
    }, [numericWorkId]);

    const finishedItems = items.filter((item: any) =>
        item.quoteItems?.some((q: any) => q.quoteWorkId !== null)
    );

    const pendingItems = items.filter((item: any) =>
        !item.quoteItems?.some((q: any) => q.quoteWorkId !== null)
    );
    // Calcular subtotal (suma de todos los items finalizados)
    const calculateSubtotal = () => {
        let subtotal = 0;
        finishedItems.forEach((item: any) => {
            const finalizedQuote = item.quoteItems?.find((q: any) => q.quoteWorkId !== null);
            if (finalizedQuote) {
                const itemTotal =
                    Number(finalizedQuote.subtotal || 0) +
                    Number(finalizedQuote.materialCost || 0) +
                    Number(finalizedQuote.agValue || 0);
                subtotal += itemTotal;
            }
        });
        return subtotal;
    };

    // Calcular subtotal
    const calculateSubtotalUtility = () => {
        let subtotalUtility = 0;
        finishedItems.forEach((item: any) => {
            const finalizedQuote = item.quoteItems?.find((q: any) => q.quoteWorkId !== null);
            if (finalizedQuote) {
                const itemTotal =
                    Number(finalizedQuote.subtotal || 0) +
                    Number(finalizedQuote.materialCost || 0)
                subtotalUtility += itemTotal;
            }
        });
        return subtotalUtility;
    };

    // Calcular total según IVA o AIU
    const calculateTotal = () => {
        const subtotal = calculateSubtotal();

        if (useIVA) {
            // IVA simple
            return Math.round(subtotal * 1.19);
        } else if (useAIU) {
            // AIU
            const admin = administrationPercentage / 100;
            const contingencies = contingenciesPercentage / 100;
            const profit = profitPercentage / 100;

            const aiuValue = subtotal * (admin + contingencies);
            const profitValue = (subtotal + aiuValue) * profit;
            const ivaOnProfit = profitValue * 0.19;

            return Math.round(subtotal + aiuValue + profitValue + ivaOnProfit);
        }

        return subtotal;
    };

    // Calcular utilidad
    const calculateProfit = () => {
        const total = calculateSubtotal();
        const subtotal = calculateSubtotalUtility();
        return total - subtotal;
    };

    const calculateTax = () => {
        const total = calculateSubtotal();

        if (useIVA) {
            return Math.round(total * 0.19);
        } else if (useAIU) {
            // AIU
            const admin = administrationPercentage / 100;
            const contingencies = contingenciesPercentage / 100;
            const profit = profitPercentage / 100;

            const aiuValue = total * (admin + contingencies);
            const profitValue = (total + aiuValue) * profit;
            const ivaOnProfit = profitValue * 0.19;

            return Math.round(aiuValue + profitValue + ivaOnProfit);
        }

        return 0;
    }

    const handleIVAChange = (checked: boolean) => {
        if (checked) {
            setUseIVA(true);
            setUseAIU(false);
        } else {
            setUseIVA(false);
        }
    };

    const handleAIUChange = (checked: boolean) => {
        if (checked) {
            setUseAIU(true);
            setUseIVA(false);
        } else {
            setUseAIU(false);
            setAdministrationPercentage(0);
            setContingenciesPercentage(0);
            setProfitPercentage(0);
        }
    };

    const handleUpdateQuoteWork = async () => {
        try {
            setUpdating(true);
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

            const payload: any = {
                subtotal: calculateSubtotal(),
                total: calculateTotal(),
                vat: useIVA,
                administrationPercentage: useAIU ? administrationPercentage : null,
                contingenciesPercentage: useAIU ? contingenciesPercentage : null,
                profitPercentage: useAIU ? profitPercentage : null,
            };

            if (quoteWork) {
                // Actualizar existente
                await fetch(`${baseUrl}/api/quote-works/${quoteWork.id}`, {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } else {
                // Crear nuevo
                await fetch(`${baseUrl}/api/quote-works`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...payload,
                        workId: numericWorkId,
                    }),
                });
            }

            toast.success("Configuración actualizada correctamente");
            window.location.reload();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al actualizar");
        } finally {
            setUpdating(false);
        }
    };

    const handleEditItem = (itemId: number, quoteId: number) => {
        router.push(`/management/works/${numericWorkId}/items/${itemId}/quote/${quoteId}`);
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString("es-CO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    if (itemsLoading || loadingWork || loadingQuoteWork) {
        return (
            <main className="min-h-screen bg-background">
                <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin mb-4 text-orange-500" />
                        <p className="text-muted-foreground">Cargando resumen...</p>
                    </div>
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
                        onClick={() => router.push(`/management/works/${numericWorkId}`)}
                        className="shrink-0 mt-1"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                            Resumen de Cotización
                        </h1>
                        {work && (
                            <p className="text-sm sm:text-base text-muted-foreground">
                                {work.code}
                            </p>
                        )}
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Ítems Pendientes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-yellow-500" />
                                <p className="text-3xl font-bold">{pendingItems.length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Subtotal Actual
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-blue-600">
                                ${formatCurrency(calculateSubtotal())}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Utilidad Total
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-green-500" />
                                <p className="text-3xl font-bold text-green-600">
                                    ${formatCurrency(calculateProfit())}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Personal y Adicionales de Obra */}
                {(work?.personnelRequired || work?.extras) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Personal Requerido */}
                        <Card className="border-l-4 border-l-blue-500 shadow-sm overflow-hidden">
                            <CardHeader className="flex flex-row items-center space-x-3 pb-2 bg-blue-50/30">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <CardTitle className="text-lg font-bold">Personal Requerido</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-2 sm:grid-cols-2 gap-6">
                                    {(work.personnelRequired?.oficiales > 0) && (
                                        <div className="flex flex-col p-3 bg-blue-50/20 rounded-xl border border-blue-100">
                                            <span className="text-xs text-blue-600 uppercase tracking-widest font-bold mb-1">Oficiales</span>
                                            <span className="text-2xl font-black text-blue-900">{work.personnelRequired.oficiales}</span>
                                        </div>
                                    )}
                                    {(work.personnelRequired?.ayudantes > 0) && (
                                        <div className="flex flex-col p-3 bg-blue-50/20 rounded-xl border border-blue-100">
                                            <span className="text-xs text-blue-600 uppercase tracking-widest font-bold mb-1">Ayudantes</span>
                                            <span className="text-2xl font-black text-blue-900">{work.personnelRequired.ayudantes}</span>
                                        </div>
                                    )}
                                    {(work.personnelRequired?.mediaCuchara > 0) && (
                                        <div className="flex flex-col p-3 bg-blue-50/20 rounded-xl border border-blue-100">
                                            <span className="text-xs text-blue-600 uppercase tracking-widest font-bold mb-1">M. Cuchara</span>
                                            <span className="text-2xl font-black text-blue-900">{work.personnelRequired.mediaCuchara}</span>
                                        </div>
                                    )}
                                    {(work.personnelRequired?.siso > 0) && (
                                        <div className="flex flex-col p-3 bg-blue-50/20 rounded-xl border border-blue-100">
                                            <span className="text-xs text-blue-600 uppercase tracking-widest font-bold mb-1">SISO</span>
                                            <span className="text-2xl font-black text-blue-900">{work.personnelRequired.siso}</span>
                                        </div>
                                    )}
                                    {work.personnelRequired?.otroName && (
                                        <div className="flex flex-col col-span-2 p-3 bg-blue-600/5 rounded-xl border border-blue-600/10">
                                            <span className="text-xs text-blue-600 uppercase tracking-widest font-bold mb-1">{work.personnelRequired.otroName}</span>
                                            <span className="text-xl font-black text-blue-900">{work.personnelRequired.otroQuantity || 1}</span>
                                        </div>
                                    )}
                                    {(!work.personnelRequired || Object.keys(work.personnelRequired).filter(k => work.personnelRequired[k]).length === 0) && (
                                        <div className="col-span-2 flex flex-col items-center justify-center py-6 text-muted-foreground bg-muted/5 rounded-lg border border-dashed">
                                            <Users className="h-8 w-8 mb-2 opacity-20" />
                                            <p className="text-sm italic">No se ha especificado personal.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Adicionales y Notas */}
                        <Card className="border-l-4 border-l-orange-500 shadow-sm overflow-hidden">
                            <CardHeader className="flex flex-row items-center space-x-3 pb-2 bg-orange-50/30">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Wrench className="h-5 w-5 text-orange-600" />
                                </div>
                                <CardTitle className="text-lg font-bold">Adicionales y Logística</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {work.extras?.andamio > 0 && (
                                        <div className="flex justify-between items-center bg-orange-50/20 p-3 rounded-lg border border-orange-100">
                                            <span className="text-sm font-semibold text-orange-900">Andamios</span>
                                            <span className="bg-orange-600 text-white px-2.5 py-1 rounded-md text-xs font-black">{work.extras.andamio}</span>
                                        </div>
                                    )}
                                    {work.extras?.equiposDeAltura > 0 && (
                                        <div className="flex justify-between items-center bg-orange-50/20 p-3 rounded-lg border border-orange-100">
                                            <span className="text-sm font-semibold text-orange-900">Eq. Altura</span>
                                            <span className="bg-orange-600 text-white px-2.5 py-1 rounded-md text-xs font-black">{work.extras.equiposDeAltura}</span>
                                        </div>
                                    )}
                                    {work.extras?.volqueta > 0 && (
                                        <div className="flex justify-between items-center bg-orange-50/20 p-3 rounded-lg border border-orange-100">
                                            <span className="text-sm font-semibold text-orange-900">Volquetas</span>
                                            <span className="bg-orange-600 text-white px-2.5 py-1 rounded-md text-xs font-black">{work.extras.volqueta}</span>
                                        </div>
                                    )}
                                    {work.extras?.acarreoYTransporte > 0 && (
                                        <div className="flex justify-between items-center bg-orange-50/20 p-3 rounded-lg border border-orange-100">
                                            <span className="text-sm font-semibold text-orange-900">Acarreo</span>
                                            <span className="bg-orange-600 text-white px-2.5 py-1 rounded-md text-xs font-black">{work.extras.acarreoYTransporte}</span>
                                        </div>
                                    )}
                                    {work.extras?.herramientaEspecial > 0 && (
                                        <div className="flex justify-between items-center bg-orange-50/20 p-3 rounded-lg border border-orange-100">
                                            <span className="text-sm font-semibold text-orange-900">Herr. Especial</span>
                                            <span className="bg-orange-600 text-white px-2.5 py-1 rounded-md text-xs font-black">{work.extras.herramientaEspecial}</span>
                                        </div>
                                    )}
                                    {work.extras?.otroName && (
                                        <div className="flex justify-between items-center bg-orange-600/5 p-3 rounded-lg border border-dashed border-orange-300 col-span-1 sm:col-span-2">
                                            <span className="text-sm font-bold text-orange-900">{work.extras.otroName}</span>
                                            <span className="bg-orange-600 text-white px-2.5 py-1 rounded-md text-xs font-black">{work.extras.otroQuantity || 1}</span>
                                        </div>
                                    )}
                                </div>

                                {work.extras?.notes && (
                                    <div className="pt-4 border-t border-orange-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <ClipboardList className="h-4 w-4 text-orange-600" />
                                            <span className="text-xs font-black uppercase tracking-widest text-orange-800">Notas de información de proyectos</span>
                                        </div>
                                        <div className="bg-white dark:bg-black/20 p-4 rounded-xl border border-orange-100 shadow-inner">
                                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{work.extras.notes}</p>
                                        </div>
                                    </div>
                                )}

                                {(!work.extras || Object.keys(work.extras).filter(k => work.extras[k]).length === 0) && (
                                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground bg-muted/5 rounded-lg border border-dashed">
                                        <Wrench className="h-8 w-8 mb-2 opacity-20" />
                                        <p className="text-sm italic">No se han especificado adicionales.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tabla de items finalizados */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Ítems Finalizados ({finishedItems.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {finishedItems.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">#</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead>Unidad</TableHead>
                                            <TableHead className="text-right">Cantidad</TableHead>
                                            <TableHead className="text-right">V. Unitario (AG)</TableHead>
                                            <TableHead className="text-right">Materiales (AG)</TableHead>
                                            <TableHead className="text-right">V. Total (AG)</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {finishedItems.map((item: any, index: number) => {
                                            const finalizedQuote = item.quoteItems?.find(
                                                (q: any) => q.quoteWorkId !== null
                                            );

                                            // Calcular factor de ajuste AG (ej: 50% -> 1.5)
                                            console.log(finalizedQuote)
                                            const agPercentage = Number(finalizedQuote?.managementPercentage || 0);
                                            const factor = 1 + (agPercentage / 100);

                                            const subquotas = finalizedQuote?.subquotations || {};
                                            const mainSubquota = subquotas.item_1 || Object.values(subquotas)[0] || {};

                                            // Actividad ajustada
                                            const unitValueAdjusted = Number(mainSubquota.unitValue || 0) * factor;
                                            const activityTotalAdjusted = Number(mainSubquota.totalValue || 0) * factor;

                                            // Materiales ajustados
                                            const materialCostAdjusted = Number(finalizedQuote?.materialCost || 0) * factor;

                                            // Total final (Actividad + Materiales)
                                            const finalTotal = activityTotalAdjusted + materialCostAdjusted;

                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                                    <TableCell className="max-w-[200px] truncate">
                                                        {item.description}
                                                    </TableCell>
                                                    <TableCell>{mainSubquota.unit || "UND"}</TableCell>
                                                    <TableCell className="text-right">{mainSubquota.measure || 0}</TableCell>
                                                    <TableCell className="text-right">
                                                        ${formatCurrency(unitValueAdjusted)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        ${formatCurrency(materialCostAdjusted)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        ${formatCurrency(finalTotal)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleEditItem(item.id, finalizedQuote.id)
                                                            }
                                                        >
                                                            <Pencil className="h-3.5 w-3.5 mr-1" />
                                                            Editar
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No hay ítems finalizados aún</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Configuración IVA/AIU */}
                <Card>
                    <CardHeader>
                        <CardTitle>Configuración de Impuestos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="iva"
                                checked={useIVA}
                                onCheckedChange={handleIVAChange}
                            />
                            <Label htmlFor="iva" className="font-medium">
                                IVA (19%)
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="aiu"
                                checked={useAIU}
                                onCheckedChange={handleAIUChange}
                            />
                            <Label htmlFor="aiu" className="font-medium">
                                AIU (Administración, Imprevistos, Utilidad)
                            </Label>
                        </div>

                        {useAIU && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pl-6">
                                <div>
                                    <Label>Administración (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={administrationPercentage || ""}
                                        onChange={(e) =>
                                            setAdministrationPercentage(Number.parseFloat(e.target.value) || 0)
                                        }
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <Label>Imprevistos (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={contingenciesPercentage || ""}
                                        onChange={(e) =>
                                            setContingenciesPercentage(Number.parseFloat(e.target.value) || 0)
                                        }
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <Label>Utilidad (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={profitPercentage || ""}
                                        onChange={(e) =>
                                            setProfitPercentage(Number.parseFloat(e.target.value) || 0)
                                        }
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        )}

                        <Separator />

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span className="font-medium">${formatCurrency(calculateSubtotal())}</span>
                            </div>
                            {(useIVA || useAIU) && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {useIVA ? "IVA (19%):" : "AIU + IVA:"}
                                    </span>
                                    <span className="font-medium text-blue-600">
                                        +${formatCurrency(calculateTax())}
                                    </span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total:</span>
                                <span className="text-green-600">${formatCurrency(calculateTotal())}</span>
                            </div>
                        </div>

                        <Button
                            onClick={handleUpdateQuoteWork}
                            className="w-full bg-orange-500 hover:bg-orange-600"
                            disabled={updating}
                        >
                            {updating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Actualizando...
                                </>
                            ) : (
                                "Guardar Configuración"
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}