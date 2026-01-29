"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { useContractorItems } from "@/hooks/items/useContractorItems";
import { useUsers } from "@/hooks/users/useUsers";
import { useWorks } from "@/hooks/work/useWorks";
import { QuoteItemForm } from "@/components/contractor/quote-item-form";

interface ContractorQuoteItemPageProps {
    params: Promise<{ itemId: string }>;
}

export default function ContractorQuoteItemPage({
    params,
}: ContractorQuoteItemPageProps) {
    const { itemId } = use(params);
    const router = useRouter();
    const numericItemId = Number.parseInt(itemId);

    const { currentUser, getCurrentUser, loading: userLoading } = useUsers();
    const { getItem, loading: itemLoading } = useContractorItems();
    const { works, loading: worksLoading } = useWorks();

    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void getCurrentUser();
    }, [getCurrentUser]);

    useEffect(() => {
        const fetchItem = async () => {
            try {
                setLoading(true);
                const fetchedItem = await getItem(numericItemId);
                if (!fetchedItem) {
                    router.push("/contractor");
                    return;
                }

                // Verify the item belongs to the current contractor
                if ((fetchedItem as any).contractorId !== currentUser?.id) {
                    router.push("/contractor");
                    return;
                }

                setItem(fetchedItem);
            } catch (error) {
                console.error("Error fetching item:", error);
                router.push("/contractor");
            } finally {
                setLoading(false);
            }
        };

        if (currentUser && !userLoading) {
            void fetchItem();
        }
    }, [currentUser, userLoading, numericItemId, getItem, router]);

    if (userLoading || itemLoading || worksLoading || loading) {
        return (
            <main className="min-h-screen bg-background">
                <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
                    <div className="text-center py-8 sm:py-12 text-muted-foreground">
                        <p>Cargando detalles del ítem...</p>
                    </div>
                </div>
            </main>
        );
    }

    if (!item || !currentUser) {
        notFound();
    }

    const work = works.find((w) => w.id === item.workId);

    if (!work) {
        return (
            <main className="min-h-screen bg-background">
                <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
                    <div className="text-center py-8 sm:py-12 text-destructive">
                        <p>No se pudo encontrar la obra asociada a este ítem.</p>
                    </div>
                </div>
            </main>
        );
    }

    if (!userLoading && !currentUser) {
        router.push("/");
        return null;
    }

    // Verificar si el contratista ya cotizó este item
    const hasExistingQuote = item.quoteItems?.some(
        (quote: any) => quote.assignedContractorId === currentUser?.id
    );

    // Si ya cotizó, mostrar pantalla de "ya cotizado"
    if (hasExistingQuote) {
        const existingQuote = item.quoteItems.find(
            (quote: any) => quote.assignedContractorId === currentUser?.id
        );

        return (
            <main className="min-h-screen bg-background">
                <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
                    <div className="max-w-2xl mx-auto">
                        <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                            <div className="bg-orange-500 text-white px-6 py-4">
                                <h1 className="text-xl font-semibold">
                                    Cotización ya enviada
                                </h1>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="shrink-0">
                                        <svg
                                            className="w-12 h-12 text-green-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-lg font-medium mb-2">
                                            Ya has enviado una cotización para este ítem
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                                            Has cotizado el ítem "{item.description}" el{" "}
                                            {new Date(existingQuote.createdAt).toLocaleDateString(
                                                "es-CO",
                                                {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                }
                                            )}
                                            .
                                        </p>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                                <strong>Nota:</strong> No puedes enviar una nueva
                                                cotización para este ítem. Si necesitas modificar
                                                tu cotización, por favor contacta al
                                                administrador.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Resumen de tu cotización
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
                                        {/* Items cotizados */}
                                        {existingQuote.subquotations && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                                    Ítems cotizados
                                                </p>
                                                {typeof existingQuote.subquotations === "object" &&
                                                    Object.values(existingQuote.subquotations).map(
                                                        (subitem: any, idx: number) => (
                                                            <div
                                                                key={idx}
                                                                className="bg-white dark:bg-gray-900 rounded p-3 text-sm"
                                                            >
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                                        {subitem.description ||
                                                                            `Ítem ${idx + 1}`}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                                                    <span>
                                                                        {subitem.measure} {subitem.unit} ×
                                                                        $
                                                                        {Number(
                                                                            subitem.unitValue
                                                                        ).toLocaleString("es-CO")}
                                                                    </span>
                                                                    <span className="font-medium">
                                                                        $
                                                                        {Number(
                                                                            subitem.totalValue
                                                                        ).toLocaleString("es-CO", {
                                                                            minimumFractionDigits: 2,
                                                                        })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                            </div>
                                        )}

                                        <hr className="border-gray-300 dark:border-gray-600" />

                                        {/* Materiales */}
                                        {existingQuote.materials?.description && (
                                            <>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                                                        Materiales
                                                    </p>
                                                    <div className="bg-white dark:bg-gray-900 rounded p-3">
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                                            {existingQuote.materials.description}
                                                        </p>
                                                        {existingQuote.materialCost && (
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-600 dark:text-gray-400">
                                                                    Costo:
                                                                </span>
                                                                <span className="font-medium">
                                                                    $
                                                                    {Number(
                                                                        existingQuote.materialCost
                                                                    ).toLocaleString("es-CO", {
                                                                        minimumFractionDigits: 2,
                                                                    })}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <hr className="border-gray-300 dark:border-gray-600" />
                                            </>
                                        )}

                                        {/* Subtotal */}
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                Subtotal:
                                            </span>
                                            <span className="font-semibold">
                                                $
                                                {Number(existingQuote.subtotal).toLocaleString(
                                                    "es-CO",
                                                    { minimumFractionDigits: 2 }
                                                )}
                                            </span>
                                        </div>

                                        {/* Impuestos - AIU */}
                                        {existingQuote.administrationPercentage > 0 ||
                                            existingQuote.contingenciesPercentage > 0 ||
                                            existingQuote.profitPercentage > 0 ? (
                                            <>
                                                <div className="space-y-2 bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                                                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 uppercase tracking-wide">
                                                        AIU (Administración, Imprevistos, Utilidad)
                                                    </p>
                                                    {existingQuote.administrationPercentage > 0 && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600 dark:text-gray-400">
                                                                Administración (
                                                                {Number(
                                                                    existingQuote.administrationPercentage
                                                                ).toFixed(2)}
                                                                %):
                                                            </span>
                                                            <span className="font-medium">
                                                                $
                                                                {(
                                                                    Number(existingQuote.subtotal) *
                                                                    (Number(
                                                                        existingQuote.administrationPercentage
                                                                    ) /
                                                                        100)
                                                                ).toLocaleString("es-CO", {
                                                                    minimumFractionDigits: 2,
                                                                })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {existingQuote.contingenciesPercentage > 0 && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600 dark:text-gray-400">
                                                                Imprevistos (
                                                                {Number(
                                                                    existingQuote.contingenciesPercentage
                                                                ).toFixed(2)}
                                                                %):
                                                            </span>
                                                            <span className="font-medium">
                                                                $
                                                                {(
                                                                    Number(existingQuote.subtotal) *
                                                                    (Number(
                                                                        existingQuote.contingenciesPercentage
                                                                    ) /
                                                                        100)
                                                                ).toLocaleString("es-CO", {
                                                                    minimumFractionDigits: 2,
                                                                })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {existingQuote.profitPercentage > 0 && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600 dark:text-gray-400">
                                                                Utilidad (
                                                                {Number(
                                                                    existingQuote.profitPercentage
                                                                ).toFixed(2)}
                                                                %):
                                                            </span>
                                                            <span className="font-medium">
                                                                $
                                                                {(
                                                                    Number(existingQuote.subtotal) *
                                                                    (Number(
                                                                        existingQuote.profitPercentage
                                                                    ) /
                                                                        100)
                                                                ).toLocaleString("es-CO", {
                                                                    minimumFractionDigits: 2,
                                                                })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {existingQuote.agValue > 0 && (
                                                        <>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-600 dark:text-gray-400">
                                                                    IVA sobre Utilidad (19%):
                                                                </span>
                                                                <span className="font-medium">
                                                                    $
                                                                    {(
                                                                        Number(existingQuote.subtotal) *
                                                                        (Number(
                                                                            existingQuote.profitPercentage
                                                                        ) /
                                                                            100) *
                                                                        0.19
                                                                    ).toLocaleString("es-CO", {
                                                                        minimumFractionDigits: 2,
                                                                    })}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between text-sm pt-2 border-t border-blue-200 dark:border-blue-800">
                                                                <span className="font-semibold text-blue-800 dark:text-blue-200">
                                                                    Total AIU + IVA:
                                                                </span>
                                                                <span className="font-bold">
                                                                    $
                                                                    {Number(
                                                                        existingQuote.agValue
                                                                    ).toLocaleString("es-CO", {
                                                                        minimumFractionDigits: 2,
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            // IVA simple (sin AIU)
                                            existingQuote.vat && (
                                                <div className="flex justify-between text-sm bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        IVA (19%):
                                                    </span>
                                                    <span className="font-medium">
                                                        $
                                                        {(Number(existingQuote.subtotal) * 0.19).toLocaleString(
                                                            "es-CO",
                                                            { minimumFractionDigits: 2 }
                                                        )}
                                                    </span>
                                                </div>
                                            )
                                        )}

                                        <hr className="border-gray-300 dark:border-gray-600" />

                                        {/* Total final */}
                                        <div className="flex justify-between pt-2">
                                            <span className="font-bold text-lg text-gray-900 dark:text-white">
                                                Total Contratista:
                                            </span>
                                            <span className="font-bold text-xl text-orange-600 dark:text-orange-400">
                                                $
                                                {Number(
                                                    existingQuote.totalContractor
                                                ).toLocaleString("es-CO", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                    <button
                                        onClick={() => router.push("/contractor")}
                                        className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                                    >
                                        Ver todos los ítems
                                    </button>
                                    <button
                                        onClick={() =>
                                            router.push(`/contractor/items/${item.id}/details`)
                                        }
                                        className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Ver detalles del ítem
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
                <h1 className="text-xl sm:text-2xl font-semibold mb-6">
                    Cotizar ítem: {item.description}
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Detalles del Item - Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Información básica */}
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-orange-500 text-white px-4 py-3">
                                <h2 className="font-semibold text-sm">Información del Ítem</h2>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">
                                        Descripción
                                    </p>
                                    <p className="text-sm">{item.description}</p>
                                </div>

                                {item.estimatedExecutionTime && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 mb-1">
                                            Tiempo estimado de ejecución
                                        </p>
                                        <p className="text-sm">
                                            {item.estimatedExecutionTime} días
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">
                                        ID del Ítem
                                    </p>
                                    <p className="text-sm font-mono">#{item.id}</p>
                                </div>

                                {work && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 mb-1">
                                            Obra asociada
                                        </p>
                                        <p className="text-sm font-medium">{work.code}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Personal requerido */}
                        {item.personnelRequired &&
                            Object.keys(item.personnelRequired).length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
                                        <h3 className="font-semibold text-sm">
                                            Personal Requerido
                                        </h3>
                                    </div>
                                    <div className="p-4">
                                        <div className="space-y-2">
                                            {Object.entries(item.personnelRequired).map(
                                                ([key, value]) => (
                                                    <div
                                                        key={key}
                                                        className="flex justify-between items-center text-sm"
                                                    >
                                                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                                                            {key.replace(/([A-Z])/g, " $1").trim()}
                                                        </span>
                                                        <span className="font-medium">
                                                            {typeof value === "object"
                                                                ? JSON.stringify(value)
                                                                : String(value)}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        {/* Extras */}
                        {item.extras && Object.keys(item.extras).length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
                                    <h3 className="font-semibold text-sm">
                                        Información Adicional
                                    </h3>
                                </div>
                                <div className="p-4">
                                    <div className="space-y-2">
                                        {Object.entries(item.extras).map(([key, value]) => (
                                            <div
                                                key={key}
                                                className="flex justify-between items-center text-sm"
                                            >
                                                <span className="text-gray-600 dark:text-gray-400 capitalize">
                                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                                </span>
                                                <span className="font-medium">
                                                    {typeof value === "object"
                                                        ? JSON.stringify(value)
                                                        : String(value)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Fechas */}
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
                                <h3 className="font-semibold text-sm">Fechas</h3>
                            </div>
                            <div className="p-4 space-y-3">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">
                                        Creado
                                    </p>
                                    <p className="text-sm">
                                        {new Date(item.createdAt).toLocaleDateString("es-CO", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">
                                        Última actualización
                                    </p>
                                    <p className="text-sm">
                                        {new Date(item.updatedAt).toLocaleDateString("es-CO", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Formulario de Cotización */}
                    <div className="lg:col-span-2">
                        <QuoteItemForm
                            item={item}
                            currentUser={currentUser}
                            ivaPercent={19} // o pásalo desde getConfigService si deberías
                            onSaved={() => {
                                // opcionalmente redirigir o refrescar
                                router.push("/contractor");
                            }}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}