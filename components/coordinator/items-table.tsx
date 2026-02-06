"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Eye,
  X,
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Check,
  CircleX,
  Link2,
  FileText,
  Ban,
  Download,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ItemModal } from "./item-modal";
import { ConfirmModal } from "./confirm-modal";
import { useItems } from "@/hooks/items/useItems";
import { toast } from "sonner";
import type { Item, Work } from "@/lib/types";
import { useUsers } from "@/hooks/users/useUsers";

interface ItemsTableProps {
  work: Work;
  coordinator?: boolean;
  path?: string;
  management?: boolean;
}

export function ItemsTable({
  work,
  coordinator = true,
  path = "admin",
  management = false
}: ItemsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [permanentDeleteModalOpen, setPermanentDeleteModalOpen] = useState(false);
  const [deactivateQuoteModalOpen, setDeactivateQuoteModalOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [deactivatingQuote, setDeactivatingQuote] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const { users } = useUsers();
  const contractors = users.filter((u) => u.role === "contractor");

  // Estados para validación PDF
  const [quoteWork, setQuoteWork] = useState<any>(null);
  const [pdfReady, setPdfReady] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<string[]>([]);

  // Formulario PDF
  const [pdfFormData, setPdfFormData] = useState({
    clientName: "UNIVERSIDAD DE LOS ANDES",
    attn: "",
    executeIn: "",
    department: "OBRAS",
    validityDays: "30",
    deliveryTime: "30 DÍAS CALENDARIO",
    paymentTerms: quoteWork?.subtotal > 10000000 ? "50% ANTICIPO, 50% CONTRA ENTREGA" : "CONTRA ENTREGA",
  });

  const { items, submitting, createItem, updateItem, toggleActive, deleteItem } =
    useItems(work.id);

  const isAdmin = !coordinator && !management;

  // Validar condiciones para PDF
  useEffect(() => {
    if (!isAdmin || items.length === 0) return;

    const validatePDF = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const finishedItems = items.filter((item: any) =>
          item.quoteItems?.some((q: any) => q.quoteWorkId !== null)
        );
        const pendingCount = items.length - finishedItems.length;

        const status: string[] = [];
        let ready = true;

        // 1. Verificar items finalizados
        if (pendingCount > 0) {
          status.push(`Faltan ${pendingCount} ítem${pendingCount > 1 ? 's' : ''} por finalizar`);
          ready = false;
        } else {
          status.push("Todos los ítems finalizados");
        }

        // 2. Obtener QuoteWork
        const qwRes = await fetch(`${baseUrl}/api/quote-works?workId=${work.id}`, {
          credentials: "include",
        });

        if (qwRes.ok) {
          const data = await qwRes.json();
          const works = data?.data?.quoteWorks ?? data?.data ?? data;
          const qw = Array.isArray(works) ? works[0] : works;
          setQuoteWork(qw);

          if (qw) {
            // 3. Verificar IVA/AIU
            const hasIVAorAIU = !!(
              qw.vat ||
              qw.administrationPercentage ||
              qw.contingenciesPercentage ||
              qw.profitPercentage
            );

            if (hasIVAorAIU) {
              status.push("IVA/AIU asignado");
            } else {
              status.push("Falta asignar IVA o AIU");
              ready = false;
            }

            // 4. Validar y actualizar totales si es necesario
            if (finishedItems.length > 0) {
              let calculatedSubtotal = 0;
              finishedItems.forEach((item: any) => {
                const quote = item.quoteItems?.find((q: any) => q.quoteWorkId !== null);
                if (quote) {
                  calculatedSubtotal +=
                    Number(quote.subtotal || 0) +
                    Number(quote.materialCost || 0) +
                    Number(quote.agValue || 0);
                }
              });

              let calculatedTotal = calculatedSubtotal;
              if (qw.vat) {
                calculatedTotal = Math.round(calculatedSubtotal * 1.19);
              } else if (hasIVAorAIU) {
                const admin = Number(qw.administrationPercentage || 0) / 100;
                const cont = Number(qw.contingenciesPercentage || 0) / 100;
                const profit = Number(qw.profitPercentage || 0) / 100;
                const aiuValue = calculatedSubtotal * (admin + cont);
                const profitValue = (calculatedSubtotal + aiuValue) * profit;
                const ivaOnProfit = profitValue * 0.19;
                calculatedTotal = Math.round(
                  calculatedSubtotal + aiuValue + profitValue + ivaOnProfit
                );
              }

              // Si no coinciden, actualizar
              if (Math.abs(Number(qw.subtotal) - calculatedSubtotal) > 1) {
                await fetch(`${baseUrl}/api/quote-works/${qw.id}`, {
                  method: "PUT",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    subtotal: calculatedSubtotal,
                    total: calculatedTotal,
                  }),
                });
                status.push("Totales actualizados");
              } else {
                status.push("Totales correctos");
              }
            }
          } else {
            status.push("No existe QuoteWork");
            ready = false;
          }
        } else {
          status.push("No existe QuoteWork");
          ready = false;
        }

        setPdfReady(ready);
        setPdfStatus(status);
      } catch (error) {
        console.error("Error validando PDF:", error);
        setPdfReady(false);
      }
    };

    validatePDF();
  }, [items, work.id, isAdmin]);

  const handleDownloadPDF = async () => {
    if (!quoteWork) return;

    try {
      setDownloadingPDF(true);
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

      const response = await fetch(
        `${baseUrl}/api/quote-works/${quoteWork.id}/pdf`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientName: pdfFormData.clientName,
            department: pdfFormData.department,
            attn: pdfFormData.attn,
            executeIn: pdfFormData.executeIn,
            validityDays: Number(pdfFormData.validityDays),
            deliveryTime: pdfFormData.deliveryTime,
            paymentTerms: pdfFormData.paymentTerms,
          }),
        }
      );

      if (!response.ok) throw new Error("Error al generar PDF");

      const pdfBlob = await response.blob();
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `COTIZACION ${work.code} - CONSTRUIMOS AG SAS.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF descargado exitosamente");
      setPdfModalOpen(false);
      setPdfFormData({
        clientName: "UNIVERSIDAD DE LOS ANDES",
        department: "OBRAS",
        attn: "",
        executeIn: "",
        validityDays: "30",
        deliveryTime: "30 DÍAS CALENDARIO",
        paymentTerms: "50% ANTICIPO, 50% CONTRA ENTREGA",
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al descargar PDF");
    } finally {
      setDownloadingPDF(false);
    }
  };

  const generateExternalToken = (item: Item) => {
    const timestamp = new Date(item.createdAt).getTime();
    const data = `${timestamp}-${item.id}`;
    return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const copyExternalLink = (item: Item) => {
    const token = generateExternalToken(item);
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/extern-contractor/${token}/${item.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado al portapapeles");
  };

  const hasFinishedQuotation = (item: Item) => {
    return item.quoteItems?.some((quote: any) => quote.quoteWorkId !== null);
  };

  const handleDeactivateQuote = (item: Item) => {
    setSelectedItem(item);
    setDeactivateQuoteModalOpen(true);
  };

  const handleDeactivateQuoteConfirm = async () => {
    if (!selectedItem) return;

    try {
      setDeactivatingQuote(true);
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const finalizedQuote = selectedItem.quoteItems?.find(
        (q: any) => q.quoteWorkId !== null
      );

      if (!finalizedQuote) {
        toast.error("No hay cotización finalizada");
        return;
      }

      const quoteWorkId = finalizedQuote.quoteWorkId;

      await fetch(`${baseUrl}/api/quote-items/${finalizedQuote.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteWorkId: null }),
      });

      const qiRes = await fetch(
        `${baseUrl}/api/quote-items?quoteWorkId=${quoteWorkId}`,
        { credentials: "include" }
      );

      if (qiRes.ok) {
        const data = await qiRes.json();
        const remaining = data?.data?.quoteItems ?? data?.data ?? data;
        let subtotal = 0;

        for (const qi of remaining) {
          const itemRes = await fetch(`${baseUrl}/api/items/${qi.itemId}`, {
            credentials: "include",
          });
          if (itemRes.ok) {
            const itemData = await itemRes.json();
            const item = itemData?.data ?? itemData;
            if (item.active) {
              subtotal +=
                Number(qi.subtotal || 0) +
                Number(qi.materialCost || 0) +
                Number(qi.agValue || 0);
            }
          }
        }

        const qwRes = await fetch(`${baseUrl}/api/quote-works/${quoteWorkId}`, {
          credentials: "include",
        });

        let total = subtotal;
        if (qwRes.ok) {
          const qwData = await qwRes.json();
          const qw = qwData?.data ?? qwData;

          if (qw.vat) {
            total = Math.round(subtotal * 1.19);
          } else if (
            qw.administrationPercentage ||
            qw.contingenciesPercentage ||
            qw.profitPercentage
          ) {
            const admin = Number(qw.administrationPercentage || 0) / 100;
            const cont = Number(qw.contingenciesPercentage || 0) / 100;
            const profit = Number(qw.profitPercentage || 0) / 100;
            const aiuValue = subtotal * (admin + cont);
            const profitValue = (subtotal + aiuValue) * profit;
            const ivaOnProfit = profitValue * 0.19;
            total = Math.round(subtotal + aiuValue + profitValue + ivaOnProfit);
          }
        }

        await fetch(`${baseUrl}/api/quote-works/${quoteWorkId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subtotal, total }),
        });
      }

      toast.success("Cotización desactivada");
      setDeactivateQuoteModalOpen(false);
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al desactivar");
    } finally {
      setDeactivatingQuote(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter((item: Item) => {
      const personnelStr = JSON.stringify(item.personnelRequired).toLowerCase();
      return (
        item.description.toLowerCase().includes(term) ||
        personnelStr.includes(term)
      );
    });
  }, [items, searchTerm]);

  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateLong = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPersonnelDisplay = (contractor: { name?: string } | null) => {
    return contractor && contractor.name ? contractor.name : "No se ha asignado un contratista";
  };

  const formatEstimatedTime = (hours: number | null) => {
    if (!hours) return "Not set";
    if (hours < 24) return `${hours} hours`;
    const days = Math.floor(hours / 8);
    return `${days} day${days > 1 ? "s" : ""}`;
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };

  const handleDelete = (item: Item) => {
    setSelectedItem(item);
    setDeleteModalOpen(true);
  };

  const handleViewDetails = (itemId: number) => {
    coordinator
      ? router.push(`/coordinator/works/${work.id}/items/${itemId}`)
      : router.push(`/${path}/works/${work.id}/items/${itemId}`);
  };

  const handleViewQuotations = (itemId: number) => {
    router.push(`/${path}/works/${work.id}/items/${itemId}/quotations`);
  };

  const handleCreateItem = () => {
    setSelectedItem(null);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (data: any) => {
    if (selectedItem) {
      await updateItem(selectedItem.id, data);
    } else {
      await createItem({ ...data, workId: work.id });
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedItem) {
      await toggleActive(selectedItem.id, !selectedItem.active);
      setDeleteModalOpen(false);
    }
  };

  const handlePermanentDelete = (item: Item) => {
    setSelectedItem(item);
    setPermanentDeleteModalOpen(true);
  };

  const handlePermanentDeleteConfirm = async () => {
    if (selectedItem) {
      try {
        await deleteItem(selectedItem.id);
        setPermanentDeleteModalOpen(false);
        setSelectedItem(null);
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/${path}`)}
          className="shrink-0 mt-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground wrap-break-word">
            Obra: {work.code}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {items.length} ítems registrados
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción o personal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Botón PDF - Solo Admin */}
          {isAdmin && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  onClick={() => pdfReady && setPdfModalOpen(true)}
                  disabled={!pdfReady}
                  className={`text-black ${pdfReady
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-400 cursor-not-allowed"
                    }`}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Descargar PDF
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Estado del PDF</h4>
                  <div className="space-y-2">
                    {pdfStatus.map((status, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {pdfReady ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span>{status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {management && (
            <Button
              onClick={() => router.push(`/${path}/works/${work.id}/summary`)}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-black"
            >
              <FileText className="h-4 w-4 mr-1" />
              Resumen
            </Button>
          )}
          {!management && (
            <Button
              onClick={handleCreateItem}
              className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Crear Ítem
            </Button>
          )}
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="whitespace-nowrap">ID</TableHead>
                  <TableHead className="min-w-50">Descripción</TableHead>
                  <TableHead className="whitespace-nowrap">Creado</TableHead>
                  <TableHead className="whitespace-nowrap">Tiempo Est.</TableHead>
                  <TableHead className="whitespace-nowrap">Personal</TableHead>
                  <TableHead className="whitespace-nowrap">Estado</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item: Item) => {
                  const isFinished = hasFinishedQuotation(item);

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        #{item.id}
                      </TableCell>
                      <TableCell className="max-w-62.5">
                        <p className="truncate">{item.description}</p>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDateLong(item.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatEstimatedTime(item.estimatedExecutionTime)}
                      </TableCell>
                      <TableCell className="max-w-37.5">
                        <p className="truncate">
                          {getPersonnelDisplay(item.contractor ?? null)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Badge
                            variant={item.active ? "default" : "secondary"}
                            className={
                              item.active
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-red-500 hover:bg-red-600 text-white"
                            }
                          >
                            {item.active ? "Activo" : "Inactivo"}
                          </Badge>
                          {management && isFinished && (
                            <Badge className="bg-blue-500 hover:bg-blue-600">
                              Finalizado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {management && !isFinished && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleViewQuotations(item.id)}
                              className="h-8 px-2 bg-orange-500 hover:bg-orange-600"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {management && isFinished && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivateQuote(item)}
                              className="h-8 px-2 text-red-600 hover:text-red-700"
                              disabled={deactivatingQuote}
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(item.id)}
                            className="h-8 px-2"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {!management && (
                            <>
                              {!coordinator && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyExternalLink(item)}
                                  className="h-8 px-2 text-blue-600 hover:text-blue-700"
                                >
                                  <Link2 className="h-3.5 w-3.5" />
                                </Button>
                              )}



                              {!coordinator && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(item)}
                                    className="h-8 px-2"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(item)}
                                    className="h-8 px-2 text-destructive hover:text-destructive"
                                  >
                                    {item.active ? (
                                      <X className="h-4 w-4" />
                                    ) : (
                                      <Check className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePermanentDelete(item)}
                                    className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    disabled={submitting}
                                  >
                                    <CircleX className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredItems.map((item: Item) => {
              const isFinished = hasFinishedQuotation(item);

              return (
                <div key={item.id} className="border rounded-lg bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className="bg-purple-700">#{item.id}</Badge>
                        <Badge
                          variant={item.active ? "default" : "secondary"}
                          className={
                            item.active
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-red-500 hover:bg-red-600 text-white"
                          }
                        >
                          {item.active ? "Activo" : "Inactivo"}
                        </Badge>
                        {management && isFinished && (
                          <Badge className="bg-blue-500 hover:bg-blue-600">
                            Finalizado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{formatDate(item.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary shrink-0" />
                      <span>{formatEstimatedTime(item.estimatedExecutionTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">
                        {getPersonnelDisplay(item.contractor ?? null)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
                    {management ? (
                      <>
                        {!isFinished && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleViewQuotations(item.id)}
                            className="flex-1 bg-orange-500 hover:bg-orange-600"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Cotizaciones
                          </Button>
                        )}
                        {isFinished && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivateQuote(item)}
                            className="flex-1 text-red-600 hover:text-red-700"
                            disabled={deactivatingQuote}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Desactivar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(item.id)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalles
                        </Button>
                      </>
                    ) : (
                      <>
                        {!coordinator && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyExternalLink(item)}
                            className="flex-1 text-blue-600 hover:text-blue-700"
                          >
                            <Link2 className="h-4 w-4 mr-1" />
                            Link
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(item.id)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalles
                        </Button>
                        {!coordinator && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="flex-1"
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item)}
                              className={
                                item.active
                                  ? "text-destructive hover:text-destructive"
                                  : "text-green-500 hover:text-green-600"
                              }
                            >
                              {item.active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePermanentDelete(item)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={submitting}
                            >
                              <CircleX className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-8 sm:py-12 text-muted-foreground border rounded-lg">
          {searchTerm ? (
            <p>No se encontraron ítems que coincidan con "{searchTerm}"</p>
          ) : (
            <p>
              No hay ítems registrados.{" "}
              {coordinator && "Crea uno nuevo para comenzar."}
            </p>
          )}
        </div>
      )}

      {/* Modal PDF */}
      <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generar PDF de Cotización</DialogTitle>
            <DialogDescription>
              Completa los datos para generar el PDF de la obra {work.code}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleDownloadPDF();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="clientName">
                Nombre del Cliente <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clientName"
                value={pdfFormData.clientName}
                onChange={(e) =>
                  setPdfFormData({ ...pdfFormData, clientName: e.target.value })
                }
                placeholder="Ej: EMPRESA ABC S.A.S"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">
                Departamento <span className="text-red-500">*</span>
              </Label>
              <Input
                id="department"
                value={pdfFormData.department}
                onChange={(e) =>
                  setPdfFormData({ ...pdfFormData, department: e.target.value })
                }
                placeholder="Ej: INFRAESTRUCTURA"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attn">
                Attn <span className="text-red-500">*</span>
              </Label>
              <Input
                id="attn"
                value={pdfFormData.attn}
                onChange={(e) =>
                  setPdfFormData({ ...pdfFormData, attn: e.target.value })
                }
                placeholder="Ej: Arquitecto"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="executeIn">
                Ejecutar en <span className="text-red-500">*</span>
              </Label>
              <Input
                id="executeIn"
                value={pdfFormData.executeIn}
                onChange={(e) =>
                  setPdfFormData({ ...pdfFormData, executeIn: e.target.value })
                }
                placeholder="Ej: ML-200"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validityDays">Vigencia (días)</Label>
                <Input
                  id="validityDays"
                  type="number"
                  min="1"
                  value={pdfFormData.validityDays}
                  onChange={(e) =>
                    setPdfFormData({ ...pdfFormData, validityDays: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="deliveryTime">Tiempo de Entrega</Label>
                <Input
                  id="deliveryTime"
                  value={pdfFormData.deliveryTime}
                  onChange={(e) =>
                    setPdfFormData({ ...pdfFormData, deliveryTime: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Condiciones de Pago</Label>
              <Textarea
                id="paymentTerms"
                value={pdfFormData.paymentTerms}
                onChange={(e) =>
                  setPdfFormData({ ...pdfFormData, paymentTerms: e.target.value })
                }
                rows={2}
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPdfModalOpen(false)}
                disabled={downloadingPDF}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-black"
                disabled={downloadingPDF}
              >
                {downloadingPDF ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-pulse" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Otros Modals */}
      <ItemModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        item={selectedItem}
        workId={work.id}
        onSubmit={handleEditSubmit}
        isSubmitting={submitting}
        coordinator={false}
        contractors={contractors}
      />
      <ConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Activar/Desactivar Ítem"
        description={`¿Estás seguro de que deseas activar/desactivar el ítem #${selectedItem?.id}?`}
        onConfirm={handleDeleteConfirm}
      />
      <ConfirmModal
        open={permanentDeleteModalOpen}
        onOpenChange={setPermanentDeleteModalOpen}
        title="Eliminar Ítem Permanentemente"
        description={`¿Estás seguro de que deseas eliminar permanentemente el ítem #${selectedItem?.id}?`}
        onConfirm={handlePermanentDeleteConfirm}
      />
      <ConfirmModal
        open={deactivateQuoteModalOpen}
        onOpenChange={setDeactivateQuoteModalOpen}
        title="Desactivar Cotización"
        description={`¿Estás seguro de que deseas desactivar la cotización del ítem #${selectedItem?.id}?`}
        onConfirm={handleDeactivateQuoteConfirm}
      />
    </div>
  );
}