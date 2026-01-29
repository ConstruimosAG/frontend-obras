"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { QuoteItemForm } from "@/components/contractor/quote-item-form";
import { Loader2 } from "lucide-react";

interface ExternContractorPageProps {
  params: Promise<{ token: string; itemId: string }>;
}

export default function ExternContractorPage({ params }: ExternContractorPageProps) {
  const { token, itemId } = use(params);
  const numericItemId = Number.parseInt(itemId);

  const [item, setItem] = useState<any>(null);
  const [work, setWork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quotationExpired, setQuotationExpired] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        
        // Validar token
        const decodedToken = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
        const [timestampStr, tokenItemId] = decodedToken.split('-');
        
        if (Number(tokenItemId) !== numericItemId) {
          setError("Token inválido");
          setLoading(false);
          return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        
        // Fetch item
        const itemRes = await fetch(`${baseUrl}/api/items/${numericItemId}`, {
          credentials: "include",
        });

        if (!itemRes.ok) {
          setError("Item no encontrado");
          setLoading(false);
          return;
        }

        const itemData = await itemRes.json();
        const fetchedItem = itemData?.data ?? itemData;
        setItem(fetchedItem);

        // Fetch work
        const workRes = await fetch(`${baseUrl}/api/works/${fetchedItem.workId}`, {
          credentials: "include",
        });

        if (!workRes.ok) {
          setError("Obra no encontrada");
          setLoading(false);
          return;
        }

        const workData = await workRes.json();
        const fetchedWork = workData?.data ?? workData;
        setWork(fetchedWork);

        // Validar fecha límite de cotización
        if (fetchedWork.quotationDeadline) {
          const deadline = new Date(fetchedWork.quotationDeadline);
          const now = new Date();
          if (now > deadline) {
            setQuotationExpired(true);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching item:", error);
        setError("Error al cargar la información");
        setLoading(false);
      }
    };

    void fetchItem();
  }, [token, numericItemId]);

  const handleQuotationSaved = () => {
    setShowSuccess(true);
  };

  const handleNewQuotation = () => {
    setShowSuccess(false);
    window.location.reload();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Cargando información del ítem...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !item || !work) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="text-center py-12 text-destructive">
            <p className="text-xl font-semibold mb-2">Error</p>
            <p>{error || "No se pudo cargar la información"}</p>
          </div>
        </div>
      </main>
    );
  }

  if (quotationExpired) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="max-w-2xl mx-auto">
            <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
              <div className="bg-red-500 text-white px-6 py-4">
                <h1 className="text-xl font-semibold">
                  Plazo de cotización vencido
                </h1>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <svg
                      className="w-12 h-12 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-medium mb-2">
                      Lo sentimos, el plazo para cotizar ha expirado
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      La fecha límite para presentar cotizaciones para este ítem era el{" "}
                      {new Date(work.quotationDeadline).toLocaleDateString("es-CO", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      .
                    </p>
                    <div className="mt-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-sm font-medium mb-1">Ítem: {item.description}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Obra: {work.code}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (showSuccess) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="max-w-2xl mx-auto">
            <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
              <div className="bg-green-500 text-white px-6 py-4">
                <h1 className="text-xl font-semibold">
                  ¡Cotización enviada exitosamente!
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
                      ¡Gracias por cotizar!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Tu cotización ha sido guardada correctamente. El equipo revisará
                      tu propuesta y se pondrá en contacto contigo pronto.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Nota:</strong> Si necesitas enviar una nueva cotización
                        o modificar tu propuesta, puedes actualizar esta página para
                        enviar una nueva.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <button
                    onClick={handleNewQuotation}
                    className="w-full px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Enviar nueva cotización
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
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Cotizar Ítem
            </h1>
            <p className="text-muted-foreground">
              Completa el formulario para enviar tu cotización
            </p>
            {work.quotationDeadline && (
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                Fecha límite:{" "}
                {new Date(work.quotationDeadline).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Detalles del Item - Sidebar */}
            <div className="lg:col-span-1 space-y-4">
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
                      <p className="text-sm">{item.estimatedExecutionTime} días</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Obra asociada
                    </p>
                    <p className="text-sm font-medium">{work.code}</p>
                  </div>
                </div>
              </div>

              {item.personnelRequired &&
                Object.keys(item.personnelRequired).length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
                      <h3 className="font-semibold text-sm">Personal Requerido</h3>
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
            </div>

            {/* Formulario de Cotización */}
            <div className="lg:col-span-2">
              <QuoteItemForm
                item={item}
                currentUser={null}
                ivaPercent={19}
                onSaved={handleQuotationSaved}
                isExternal={true}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}