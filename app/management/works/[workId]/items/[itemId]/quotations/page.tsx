"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, User, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuoteItems } from "@/hooks/items/useQuoteItems";

interface ItemQuotationsPageProps {
    params: Promise<{ workId: string; itemId: string }>;
}

export default function ItemQuotationsPage({ params }: ItemQuotationsPageProps) {
    const { workId, itemId } = use(params);
    const router = useRouter();
    const numericWorkId = Number.parseInt(workId);
    const numericItemId = Number.parseInt(itemId);

    const { quoteItems, loading, fetchQuoteItems } = useQuoteItems();
    const [item, setItem] = useState<any>(null);
    const [loadingItem, setLoadingItem] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingItem(true);

                // Fetch item details
                const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
                const itemRes = await fetch(`${baseUrl}/api/items/${numericItemId}`, {
                    credentials: "include",
                });

                if (!itemRes.ok) throw new Error("Error al cargar el ítem");

                const itemData = await itemRes.json();
                setItem(itemData?.data ?? itemData);

                // Fetch quote items for this item
                await fetchQuoteItems({ itemId: numericItemId });
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingItem(false);
            }
        };

        void loadData();
    }, [numericItemId, fetchQuoteItems]);

    const handleSelectQuotation = (quoteId: number) => {
        router.push(`/management/works/${numericWorkId}/items/${numericItemId}/quote/${quoteId}`);
    };

    const formatDate = (date: string | Date) => {
        const d = typeof date === "string" ? new Date(date) : date;
        return d.toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
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

    if (loading || loadingItem) {
        return (
            <main className="min-h-screen bg-background">
                <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin mb-4 text-orange-500" />
                        <p className="text-muted-foreground">Cargando cotizaciones...</p>
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
                            Cotizaciones del Ítem
                        </h1>
                        {item && (
                            <p className="text-sm sm:text-base text-muted-foreground">
                                {item.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Lista de cotizaciones */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">
                        Cotizaciones Recibidas ({quoteItems.length})
                    </h2>

                    {quoteItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {quoteItems.map((quote: any) => (
                                <Card
                                    key={quote.id}
                                    className="hover:shadow-lg transition-shadow"
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-base">
                                                Cotización #{quote.id}
                                            </CardTitle>
                                            {quote.quoteWorkId && (
                                                <Badge className="bg-green-500 hover:bg-green-600">
                                                    Seleccionada
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {/* Contratista */}
                                        <div className="flex items-start gap-2">
                                            <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs text-muted-foreground">Contratista</p>
                                                <p className="text-sm font-medium truncate">
                                                    {getContractorName(quote)}
                                                </p>
                                                {quote.externalContractorIdentifier && (
                                                    <p className="text-xs text-muted-foreground">
                                                        ID: {quote.externalContractorIdentifier}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Fecha */}
                                        <div className="flex items-start gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs text-muted-foreground">Fecha</p>
                                                <p className="text-sm">{formatDate(quote.createdAt)}</p>
                                            </div>
                                        </div>

                                        {/* Totales */}
                                        <div className="space-y-2 pt-3 border-t">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Subtotal:</span>
                                                <span className="font-medium">
                                                    $
                                                    {Number(quote.subtotal).toLocaleString("es-CO", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </div>
                                            {quote.materialCost > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Materiales:</span>
                                                    <span className="font-medium">
                                                        $
                                                        {Number(quote.materialCost).toLocaleString("es-CO", {
                                                            minimumFractionDigits: 2,
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm font-bold pt-2 border-t">
                                                <span>Total:</span>
                                                <span className="text-orange-600">
                                                    $
                                                    {Number(quote.totalContractor).toLocaleString("es-CO", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Botón seleccionar */}
                                        <Button
                                            onClick={() => handleSelectQuotation(quote.id)}
                                            className="w-full bg-orange-500 hover:bg-orange-600"
                                            disabled={!!quote.quoteWorkId}
                                        >
                                            {quote.quoteWorkId ? (
                                                <>
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    Ya Seleccionada
                                                </>
                                            ) : (
                                                "Seleccionar"
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">
                                    No hay cotizaciones para este ítem
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Las cotizaciones aparecerán aquí cuando los contratistas las envíen
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </main>
    );
}