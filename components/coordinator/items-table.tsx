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
  DollarSign,
  Loader2,
  Save,
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
import { WorkExtrasModal } from "./work-extras-modal";
import { ConfirmModal } from "./confirm-modal";
import { useItems } from "@/hooks/items/useItems";
import { toast } from "sonner";
import type { Item, Work } from "@/lib/types";
import { useUsers } from "@/hooks/users/useUsers";
import { useQuoteItems } from "@/hooks/items/useQuoteItems";

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
  const [extrasModalOpen, setExtrasModalOpen] = useState(false);
  const [updatingExtras, setUpdatingExtras] = useState(false);
  const [deactivatingQuote, setDeactivatingQuote] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [editingQuoteItem, setEditingQuoteItem] = useState<any>(null);
  const [localTitles, setLocalTitles] = useState<string[]>(work.titles || []);
  const [newTitleModalOpen, setNewTitleModalOpen] = useState(false);
  const [newTitleValue, setNewTitleValue] = useState("");
  const [addingTitle, setAddingTitle] = useState(false);
  const [selectedTitleForNewItem, setSelectedTitleForNewItem] = useState<string>("");
  const [editTitleModalOpen, setEditTitleModalOpen] = useState(false);
  const [oldTitleValue, setOldTitleValue] = useState("");
  const [updatingTitle, setUpdatingTitle] = useState(false);
  const [deletingTitle, setDeletingTitle] = useState(false);
  const { users, currentUser } = useUsers();
  const contractors = users.filter((u) => u.role === "contractor");

  // Estados masivos
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkEdits, setBulkEdits] = useState<Record<number, { materialCost: number; managementPercentage: number }>>({});
  const [savingBulk, setSavingBulk] = useState(false);

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

  const { items, submitting: hookSubmitting, createItem, updateItem, toggleActive, deleteItem, fetchItems } =
    useItems(work.id);
  const { updateQuoteItem } = useQuoteItems();

  const [localSubmitting, setLocalSubmitting] = useState(false);
  const submitting = hookSubmitting || localSubmitting;

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

  const handleBulkSave = async () => {
    const quoteIds = Object.keys(bulkEdits);
    if (quoteIds.length === 0) {
      setIsBulkEditing(false);
      return;
    }

    // Validación previa
    for (const qIdStr of quoteIds) {
      const edits = bulkEdits[Number(qIdStr)];
      if (edits.managementPercentage <= 0 || edits.managementPercentage > 100) {
        toast.error("El porcentaje AG debe ser mayor a 0 y máximo 100");
        return;
      }
    }

    setSavingBulk(true);
    try {
      for (const qIdStr of quoteIds) {
        const qId = Number(qIdStr);
        const edits = bulkEdits[qId];

        // Buscar la cotización original para obtener el subtotal
        const originalQuote = items
          .flatMap(i => i.quoteItems || [])
          .find((q: any) => q.id === qId);

        if (!originalQuote) continue;

        const subtotal = Number(originalQuote.subtotal || 0);
        const materialCost = Number(edits.materialCost || 0);
        const agPercentage = Number(edits.managementPercentage || 0);

        const totalContractor = subtotal + materialCost;
        const agValue = Math.round(totalContractor * (agPercentage / 100));
        const totalContractorWithAG = totalContractor + agValue;

        await updateQuoteItem(qId, {
          materialCost,
          managementPercentage: agPercentage,
          agValue,
          totalContractor: totalContractorWithAG,
        });
      }
      toast.success("Cambios masivos guardados correctamente.");
      setIsBulkEditing(false);
      setBulkEdits({});
      fetchItems(); // Recargar la tabla
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al guardar algunos cambios masivos.");
    } finally {
      setSavingBulk(false);
    }
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
    let result = items;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = items.filter((item: Item) => {
        return item.description.toLowerCase().includes(term);
      });
    }
    // Reverse order
    return [...result].reverse();
  }, [items, searchTerm]);

  const groupedItems = useMemo(() => {
    const groups: { title: string; items: Item[] }[] = [];
    localTitles.forEach((t) => {
      groups.push({ title: t, items: [] });
    });
    filteredItems.forEach((item) => {
      if (item.title && localTitles.includes(item.title)) {
        const group = groups.find((g) => g.title === item.title);
        if (group) group.items.push(item);
      }
    });
    return groups;
  }, [filteredItems, localTitles]);

  const handleCreateItem = (title: string = "") => {
    setSelectedItem(null);
    setEditingQuoteItem(null);
    setSelectedTitleForNewItem(title);
    setEditModalOpen(true);
  };

  const handleAddTitle = async () => {
    if (!newTitleValue.trim()) return;
    try {
      setAddingTitle(true);
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await fetch(`${baseUrl}/api/works/${work.id}/titles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: newTitleValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.message || "Error al agregar título");
      }
      toast.success("Título agregado exitosamente a la obra");
      setLocalTitles(data.data?.titles || [...localTitles, newTitleValue.trim()]);
      setNewTitleModalOpen(false);
      setNewTitleValue("");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al agregar título");
    } finally {
      setAddingTitle(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!newTitleValue.trim() || !oldTitleValue) return;
    try {
      setUpdatingTitle(true);
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await fetch(`${baseUrl}/api/works/${work.id}/titles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          oldTitle: oldTitleValue,
          newTitle: newTitleValue.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.message || "Error al actualizar título");
      }

      // Pre-optimistic update in local state
      const updatedTitles = localTitles.map((t) =>
        t === oldTitleValue ? newTitleValue.trim() : t
      );
      setLocalTitles(updatedTitles);

      // Now update all items that had the old title
      const itemsToUpdate = items.filter((item) => item.title === oldTitleValue);
      for (const item of itemsToUpdate) {
        await updateItem(item.id, { title: newTitleValue.trim() });
      }

      toast.success("Título y sus ítems actualizados exitosamente");
      setEditTitleModalOpen(false);
      setNewTitleValue("");
      setOldTitleValue("");
      window.location.reload(); // Refresh to ensure everything is synced
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al actualizar título");
    } finally {
      setUpdatingTitle(false);
    }
  };

  const handleDeleteTitle = async (titleToDelete: string) => {
    try {
      setDeletingTitle(true);
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await fetch(`${baseUrl}/api/works/${work.id}/titles`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: titleToDelete }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.message || "Error al eliminar título");
      }
      toast.success("Título eliminado de la obra");
      setLocalTitles(localTitles.filter((t) => t !== titleToDelete));
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al eliminar título");
    } finally {
      setDeletingTitle(false);
    }
  };

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

  const getPersonnelDisplay = (item: Item) => {
    const finalizedQuote = (item.quoteItems as any)?.find((q: any) => q.quoteWorkId !== null);
    if (finalizedQuote) {
      if (finalizedQuote.ConstruimosAG) return "Construimos AG";
      if (finalizedQuote.externalContractorName) return `${finalizedQuote.externalContractorName} (Externo)`;
      const c = finalizedQuote.assignedContractor || finalizedQuote.user;
      if (c) return c.name || "Sin nombre";
    }

    if (item.quoteItems?.some(q => q.ConstruimosAG)) {
      return "Construimos AG";
    }
    return item.contractor?.name || "No se ha asignado un contratista";
  };

  const formatEstimatedTime = (hours: number | null) => {
    if (!hours) return "No establecido";
    if (hours < 24) return `${hours} horas`;
    const days = Math.floor(hours / 8);
    return `${days} día${days > 1 ? "s" : ""}`;
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setEditingQuoteItem(null);
    setEditModalOpen(true);
  };

  const handleEditQuote = (item: Item, quoteComponent: any) => {
    setSelectedItem(item);
    setEditingQuoteItem({ ...quoteComponent });
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

  const handleEditSubmit = async (data: any) => {
    setLocalSubmitting(true);
    try {
      if (editingQuoteItem) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
          const { actividad, unidad, cantidad, precioUnitario, precioTotal, materialesObservaciones } = data.quoteData;

          const quotePayload = {
            subquotations: {
              item_1: {
                id: 1,
                description: actividad,
                measure: Number(cantidad),
                unit: unidad,
                unitValue: Number(precioUnitario),
                totalValue: Number(precioTotal),
              }
            },
            totalContractor: Number(Number(precioTotal).toFixed(2)),
            materials: materialesObservaciones ? { description: materialesObservaciones } : null,
            subtotal: Number(Number(precioTotal).toFixed(2)),
            ConstruimosAG: true, // preserve or enforce
          };

          const res = await fetch(`${baseUrl}/api/quote-items/${editingQuoteItem.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(quotePayload),
          });

          if (!res.ok) {
            toast.error("Error al actualizar cotización Construimos AG");
          } else {
            toast.success("Cotización Construimos AG actualizada");
            window.location.reload();
          }
        } catch (error) {
          console.error(error);
          toast.error("Ocurrió un error al actualizar la cotización");
        }
      } else if (selectedItem) {
        // El hook updateItem solo envía campos válidos al API
        await updateItem(selectedItem.id, data);
        toast.success("Ítem actualizado exitosamente");
        window.location.reload();
      } else {
        // Extraemos solo lo que necesitamos para el QuoteItem (no va al API de items)
        const { construimosAG, quoteData, ...itemPayload } = data;

        // El hook createItem solo envía campos válidos al API
        const createdItem = await createItem({ ...itemPayload, workId: work.id });

        if (construimosAG && quoteData && createdItem) {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const { actividad, unidad, cantidad, precioUnitario, precioTotal, materialesObservaciones } = quoteData;

            const quotePayload = {
              itemId: Number(createdItem.id),
              subquotations: {
                item_1: {
                  id: 1,
                  description: actividad,
                  measure: Number(cantidad),
                  unit: unidad,
                  unitValue: Number(precioUnitario),
                  totalValue: Number(precioTotal),
                }
              },
              totalContractor: Number(Number(precioTotal).toFixed(2)),
              materials: materialesObservaciones ? { description: materialesObservaciones } : null,
              materialCost: null,
              subtotal: Number(Number(precioTotal).toFixed(2)),
              managementPercentage: null,
              administrationPercentage: null,
              contingenciesPercentage: null,
              profitPercentage: null,
              agValue: null,
              vat: false,
              assignedContractorId: null,
              ConstruimosAG: true,
            };

            const res = await fetch(`${baseUrl}/api/quote-items`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(quotePayload),
            });

            if (!res.ok) {
              toast.error("Error al crear cotización Construimos AG");
            } else {
              toast.success("Cotización Construimos AG creada");
              window.location.reload();
            }
          } catch (error) {
            console.error(error);
          }
        }
      }
    } finally {
      setLocalSubmitting(false);
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

  const handleUpdateExtras = async (data: { personnelRequired: Record<string, unknown>; extras: Record<string, unknown> }) => {
    try {
      setUpdatingExtras(true);
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await fetch(`${baseUrl}/api/works/${work.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          personnelRequired: data.personnelRequired,
          extras: data.extras,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al guardar adicionales");
      }

      toast.success("Adicionales guardados correctamente");
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar adicionales");
    } finally {
      setUpdatingExtras(false);
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
            placeholder="Buscar por descripción..."
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
                  className={`${pdfReady
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
            <div className="flex gap-2">
              {!isBulkEditing ? (
                <>
                  <Button
                    onClick={() => setIsBulkEditing(true)}
                    className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    onClick={() => router.push(`/${path}/works/${work.id}/summary`)}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Resumen
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleBulkSave}
                    disabled={savingBulk}
                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                  >
                    {savingBulk ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Guardar Cambios
                  </Button>
                  <Button
                    onClick={() => {
                      setIsBulkEditing(false);
                      setBulkEdits({});
                    }}
                    variant="outline"
                    className="flex-1 sm:flex-none"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          )}
          {!management && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setExtrasModalOpen(true)}
                className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white"
              >
                {work.finalized ? (
                  <Eye className="h-4 w-4 mr-1" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                {work.finalized ? "Ver adicionales" : "Añadir adicionales"}
              </Button>

              {!work.finalized && (
                <Button
                  onClick={() => {
                    setNewTitleValue("");
                    setNewTitleModalOpen(true);
                  }}
                  className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nuevo Título
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {groupedItems.length > 0 ? (
        <div className="space-y-8">
          {groupedItems.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-foreground">{group.title}</h2>
                  {!work.finalized && !management && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          setOldTitleValue(group.title);
                          setNewTitleValue(group.title);
                          setEditTitleModalOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {group.items.length === 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteTitle(group.title)}
                          disabled={deletingTitle}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                {!work.finalized && !management && (
                  <Button
                    size="sm"
                    onClick={() => handleCreateItem(group.title)}
                    className="bg-green-500 hover:bg-green-600 text-white h-7 px-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ítem
                  </Button>
                )}
              </div>

              {group.items.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No hay ítems en este título aún.</p>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block rounded-lg overflow-x-auto border border-border">
                    <Table className="border-collapse w-full">
                      <TableHeader>
                        <TableRow className="bg-muted/60">
                          <TableHead className="border border-border w-48 min-w-[160px] text-xs text-center">Descripción</TableHead>
                          <TableHead className="border border-border w-32 text-xs text-center whitespace-nowrap">Personal</TableHead>
                          <TableHead className="border border-border w-28 text-xs text-center whitespace-nowrap">Tiempo Est.</TableHead>
                          <TableHead className="border border-border w-16 text-xs text-center">Und.</TableHead>
                          <TableHead className="border border-border w-16 text-xs text-center">Cant.</TableHead>
                          <TableHead className="border border-border w-24 text-xs text-center whitespace-nowrap">V. Unit.</TableHead>
                          <TableHead className="border border-border w-24 text-xs text-center whitespace-nowrap">V. Total</TableHead>
                          <TableHead className="border border-border w-36 text-xs text-center">Materiales</TableHead>
                          {management && (
                            <>
                              <TableHead className="border border-border w-24 text-xs text-center whitespace-nowrap">Costo Mat.</TableHead>
                              <TableHead className="border border-border w-16 text-xs text-center">% AG</TableHead>
                              <TableHead className="border border-border w-24 text-xs text-center whitespace-nowrap">V. Unit. AG</TableHead>
                              <TableHead className="border border-border w-24 text-xs text-center whitespace-nowrap">V. Total AG</TableHead>
                            </>
                          )}
                          <TableHead className="border border-border w-24 text-xs text-center whitespace-nowrap">Creado</TableHead>
                          <TableHead className="border border-border w-20 text-xs text-center whitespace-nowrap">Estado</TableHead>
                          <TableHead className="border border-border w-28 text-xs text-center whitespace-nowrap">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map((item: Item) => {
                          const isFinished = hasFinishedQuotation(item);
                          return (
                            <TableRow key={item.id} className="hover:bg-muted/30">
                              <TableCell className="border border-border align-middle py-2 min-w-[200px]">
                                <p className="font-medium text-xs break-words whitespace-normal text-left">{item.description}</p>
                              </TableCell>
                              <TableCell className="border border-border align-middle py-2 min-w-[100px]">
                                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 break-words whitespace-normal">
                                  {getPersonnelDisplay(item)}
                                </span>
                              </TableCell>
                              <TableCell className="border border-border align-middle text-xs py-2 whitespace-nowrap">
                                {formatEstimatedTime(item.estimatedExecutionTime)}
                              </TableCell>

                              {(() => {
                                const finalizedQuote = item.quoteItems?.find((q: any) => q.quoteWorkId !== null);
                                const agQuote = item.quoteItems?.find((q: any) => q.ConstruimosAG);
                                const displayQuote = finalizedQuote || agQuote;
                                const hasAnyQuote = (item.quoteItems?.length ?? 0) > 0;

                                if (displayQuote) {
                                  console.log(displayQuote);
                                  let subq: any = displayQuote.subquotations;
                                  if (typeof subq === "string") {
                                    try { subq = JSON.parse(subq); } catch (e) { subq = {}; }
                                  }
                                  let mats: any = displayQuote.materials;
                                  if (typeof mats === "string") {
                                    try { mats = JSON.parse(mats); } catch (e) { mats = {}; }
                                  }
                                  const data = subq?.item_1 || {};
                                  const materialsText = mats?.description || " ";

                                  return (
                                    <>
                                      <TableCell className="text-sm border border-border">{data.unit || "UND"}</TableCell>
                                      <TableCell className="text-sm border border-border">{Number(data.measure || 0).toLocaleString("es-CO")}</TableCell>
                                      {(() => {
                                        const subtotal = Number(data.totalValue || 0);
                                        const adminPct = Number(displayQuote.administrationPercentage || 0);
                                        const contPct = Number(displayQuote.contingenciesPercentage || 0);
                                        const profitPct = Number(displayQuote.profitPercentage || 0);
                                        const isAIU = adminPct > 0 || contPct > 0 || profitPct > 0;
                                        
                                        let totalValueInclTaxes = subtotal;
                                        if (isAIU) {
                                          const aVal = subtotal * (adminPct / 100);
                                          const iVal = subtotal * (contPct / 100);
                                          const subAI = subtotal + aVal + iVal;
                                          const uVal = subAI * (profitPct / 100);
                                          const vatOnU = displayQuote.vat ? (uVal * 0.19) : 0;
                                          totalValueInclTaxes = subtotal + aVal + iVal + uVal + vatOnU;
                                        } else if (displayQuote.vat && !displayQuote.ConstruimosAG) {
                                          totalValueInclTaxes = subtotal * 1.19;
                                        }

                                        const measure = Number(data.measure || 0);
                                        const unitValueInclTaxes = measure > 0 ? (totalValueInclTaxes / measure) : Number(data.unitValue || 0);
                                        
                                        return (
                                          <>
                                            <TableCell className="text-sm font-medium border border-border">
                                              ${unitValueInclTaxes.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-sm font-bold text-purple-600 border border-border">
                                              ${Math.round(totalValueInclTaxes).toLocaleString("es-CO")}
                                            </TableCell>
                                          </>
                                        );
                                      })()}
                                      <TableCell className="text-sm min-w-[150px] border border-border py-2">
                                        <p className="text-xs break-words whitespace-normal text-left">{materialsText}</p>
                                      </TableCell>
                                      {management && (
                                        <>
                                          <TableCell className="text-sm border border-border">
                                            {isBulkEditing && finalizedQuote ? (
                                              <div className="relative">
                                                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">$</span>
                                                <Input
                                                  className="h-7 text-xs pl-3 w-24"
                                                  type="text"
                                                  value={(() => {
                                                    const val = bulkEdits[finalizedQuote.id]?.materialCost ?? Number(finalizedQuote.materialCost || 0);
                                                    return val > 0 ? val.toLocaleString("es-CO") : "";
                                                  })()}
                                                  onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/\D/g, "");
                                                    const val = Number(rawValue) || 0;
                                                    setBulkEdits(prev => ({
                                                      ...prev,
                                                      [finalizedQuote.id]: {
                                                        managementPercentage: bulkEdits[finalizedQuote.id]?.managementPercentage ?? Number(finalizedQuote.managementPercentage || 0),
                                                        materialCost: val
                                                      }
                                                    }));
                                                  }}
                                                />
                                              </div>
                                            ) : (
                                              displayQuote.materialCost != null ? `$${Number(displayQuote.materialCost).toLocaleString()}` : " "
                                            )}
                                          </TableCell>
                                          <TableCell className="text-sm border border-border">
                                            {isBulkEditing && finalizedQuote ? (
                                              <div className="relative">
                                                <Input
                                                  className="h-7 text-xs w-16"
                                                  type="number"
                                                  min="0.01"
                                                  max="100"
                                                  value={bulkEdits[finalizedQuote.id]?.managementPercentage ?? Number(finalizedQuote.managementPercentage || 0)}
                                                  onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    if (val > 100) return;
                                                    setBulkEdits(prev => ({
                                                      ...prev,
                                                      [finalizedQuote.id]: {
                                                        materialCost: bulkEdits[finalizedQuote.id]?.materialCost ?? Number(finalizedQuote.materialCost || 0),
                                                        managementPercentage: val
                                                      }
                                                    }));
                                                  }}
                                                />
                                              </div>
                                            ) : (
                                              displayQuote.managementPercentage != null ? `${displayQuote.managementPercentage}%` : " "
                                            )}
                                          </TableCell>
                                          <TableCell className="text-sm font-medium text-blue-600 border border-border text-center">
                                            {(() => {
                                              const subtotal = Number(data.totalValue || 0);
                                              const adminPct = Number(displayQuote.administrationPercentage || 0);
                                              const contPct = Number(displayQuote.contingenciesPercentage || 0);
                                              const profitPct = Number(displayQuote.profitPercentage || 0);
                                              const isAIU = adminPct > 0 || contPct > 0 || profitPct > 0;
                                              let totalValueInclTaxes = subtotal;
                                              if (isAIU) {
                                                const aVal = subtotal * (adminPct / 100);
                                                const iVal = subtotal * (contPct / 100);
                                                const subAI = subtotal + aVal + iVal;
                                                const uVal = subAI * (profitPct / 100);
                                                const vatOnU = displayQuote.vat ? (uVal * 0.19) : 0;
                                                totalValueInclTaxes = subtotal + aVal + iVal + uVal + vatOnU;
                                              } else if (displayQuote.vat && !displayQuote.ConstruimosAG) {
                                                totalValueInclTaxes = subtotal * 1.19;
                                              }

                                              const currentMaterialCost = isBulkEditing && finalizedQuote
                                                ? (bulkEdits[finalizedQuote.id]?.materialCost ?? Number(finalizedQuote.materialCost || 0))
                                                : Number(displayQuote.materialCost || 0);

                                              const currentMgmtPct = isBulkEditing && finalizedQuote
                                                ? (bulkEdits[finalizedQuote.id]?.managementPercentage ?? Number(finalizedQuote.managementPercentage || 0))
                                                : Number(displayQuote.managementPercentage || 0);

                                              const currentMeasure = Number(data.measure || 0);
                                              const currentAgValue = Math.round((totalValueInclTaxes + currentMaterialCost) * (currentMgmtPct / 100));
                                              return currentMgmtPct != null && currentMgmtPct > 0 && currentMeasure > 0
                                                ? `$${Math.round((totalValueInclTaxes + currentMaterialCost + currentAgValue) / currentMeasure).toLocaleString()}`
                                                : "";
                                            })()}
                                          </TableCell>
                                          <TableCell className="text-sm font-bold text-blue-700 border border-border text-center">
                                            {(() => {
                                              const subtotal = Number(data.totalValue || 0);
                                              const adminPct = Number(displayQuote.administrationPercentage || 0);
                                              const contPct = Number(displayQuote.contingenciesPercentage || 0);
                                              const profitPct = Number(displayQuote.profitPercentage || 0);
                                              const isAIU = adminPct > 0 || contPct > 0 || profitPct > 0;
                                              let totalValueInclTaxes = subtotal;
                                              if (isAIU) {
                                                const aVal = subtotal * (adminPct / 100);
                                                const iVal = subtotal * (contPct / 100);
                                                const subAI = subtotal + aVal + iVal;
                                                const uVal = subAI * (profitPct / 100);
                                                const vatOnU = displayQuote.vat ? (uVal * 0.19) : 0;
                                                totalValueInclTaxes = subtotal + aVal + iVal + uVal + vatOnU;
                                              } else if (displayQuote.vat && !displayQuote.ConstruimosAG) {
                                                totalValueInclTaxes = subtotal * 1.19;
                                              }

                                              const currentMaterialCost = isBulkEditing && finalizedQuote
                                                ? (bulkEdits[finalizedQuote.id]?.materialCost ?? Number(finalizedQuote.materialCost || 0))
                                                : Number(displayQuote.materialCost || 0);

                                              const currentMgmtPct = isBulkEditing && finalizedQuote
                                                ? (bulkEdits[finalizedQuote.id]?.managementPercentage ?? Number(finalizedQuote.managementPercentage || 0))
                                                : Number(displayQuote.managementPercentage || 0);

                                              const currentAgValue = Math.round((totalValueInclTaxes + currentMaterialCost) * (currentMgmtPct / 100));

                                              return currentMgmtPct != null && currentMgmtPct > 0
                                                ? `$${Math.round(totalValueInclTaxes + currentMaterialCost + currentAgValue).toLocaleString()}`
                                                : "";
                                            })()}
                                          </TableCell>
                                        </>
                                      )}
                                    </>
                                  );
                                } else if (!coordinator && !management) {
                                  return (
                                    <TableCell colSpan={management ? 9 : 5} className="text-xs text-muted-foreground italic text-center">
                                      Cotización asignada a contratista
                                    </TableCell>
                                  );
                                } else if (management && !hasAnyQuote) {
                                  return (
                                    <TableCell colSpan={9} className="text-xs text-muted-foreground italic text-center">
                                      Esperando cotizaciones de contratistas
                                    </TableCell>
                                  );
                                } else if (management && hasAnyQuote) {
                                  return (
                                    <TableCell colSpan={9} className="text-xs text-amber-600 italic text-center font-medium">
                                      Esperando selección de cotización y asignación de precios
                                    </TableCell>
                                  );
                                } else {
                                  return (
                                    <TableCell colSpan={5} className="text-xs text-muted-foreground italic text-center">
                                      Esperando cotizaciones de contratistas
                                    </TableCell>
                                  );
                                }
                              })()}

                              <TableCell className="border border-border text-xs whitespace-nowrap text-muted-foreground py-2">
                                {formatDate(item.createdAt)}
                              </TableCell>
                              <TableCell className="border border-border py-2">
                                <div className="flex gap-1 flex-wrap">
                                  <Badge
                                    variant={item.active ? "default" : "secondary"}
                                    className={
                                      item.active
                                        ? "bg-green-500 hover:bg-green-600 border-none px-1.5 h-5 text-[10px]"
                                        : "bg-red-500 hover:bg-red-600 text-white border-none px-1.5 h-5 text-[10px]"
                                    }
                                  >
                                    {item.active ? "Activo" : "Inactivo"}
                                  </Badge>
                                  {management && isFinished && (
                                    <Badge className="bg-blue-500 hover:bg-blue-600 border-none px-1.5 h-5 text-[10px]">
                                      Finalizado
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="border border-border py-2">
                                <div className="flex items-center justify-center gap-1 flex-wrap">
                                  {management && !isFinished && (item.quoteItems?.length ?? 0) > 0 && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleViewQuotations(item.id)}
                                      className="h-8 px-2 bg-orange-500 hover:bg-orange-600"
                                      title="Seleccionar cotización"
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

                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(item)}
                                        className="h-8 px-2"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>

                                      {item.quoteItems?.some(q => q.ConstruimosAG) && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEditQuote(item, item.quoteItems!.find(q => q.ConstruimosAG))}
                                          title="Modificar Cotización"
                                          className="h-8 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                        >
                                          <DollarSign className="h-3.5 w-3.5" />
                                        </Button>
                                      )}

                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePermanentDelete(item)}
                                        className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        disabled={submitting}
                                      >
                                        <CircleX className="h-4 w-4" />
                                      </Button>

                                      {!coordinator && (
                                        <>
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
                    {group.items.map((item: Item) => {
                      const isFinished = hasFinishedQuotation(item);
                      return (
                        <div key={item.id} className="border rounded-lg bg-card p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge
                                  variant={item.active ? "default" : "secondary"}
                                  className={
                                    item.active
                                      ? "bg-green-500 hover:bg-green-600 border-none px-1.5 h-5 text-[10px]"
                                      : "bg-red-500 hover:bg-red-600 text-white border-none px-1.5 h-5 text-[10px]"
                                  }
                                >
                                  {item.active ? "Activo" : "Inactivo"}
                                </Badge>
                                {management && isFinished && (
                                  <Badge className="bg-blue-500 hover:bg-blue-600 border-none px-1.5 h-5 text-[10px]">
                                    Finalizado
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-foreground break-words whitespace-normal font-medium">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] uppercase text-muted-foreground font-bold">Personal</span>
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-purple-500" />
                                <span className="font-semibold text-purple-700">{getPersonnelDisplay(item)}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] uppercase text-muted-foreground font-bold">Tiempo Est.</span>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-purple-500" />
                                <span>{formatEstimatedTime(item.estimatedExecutionTime)}</span>
                              </div>
                            </div>

                            {(() => {
                              const finalizedQuote = (item.quoteItems as any)?.find((q: any) => q.quoteWorkId !== null);
                              const agQuote = item.quoteItems?.find((q: any) => q.ConstruimosAG);
                              const displayQuote = finalizedQuote || agQuote;
                              const hasAnyQuote = (item.quoteItems?.length ?? 0) > 0;

                              if (displayQuote) {
                                let subq: any = displayQuote.subquotations;
                                if (typeof subq === "string") {
                                  try { subq = JSON.parse(subq); } catch (e) { subq = {}; }
                                }
                                let mats: any = displayQuote.materials;
                                if (typeof mats === "string") {
                                  try { mats = JSON.parse(mats); } catch (e) { mats = {}; }
                                }
                                const data = subq?.item_1 || {};
                                const materialsText = mats?.description;

                                return (
                                  <>
                                    <div className="col-span-2 bg-purple-50 dark:bg-purple-900/10 p-2 rounded-md border border-purple-100 dark:border-purple-800 grid grid-cols-3 gap-2">
                                      <div className="flex flex-col">
                                        <span className="text-[9px] text-purple-600 font-bold uppercase">Cant/Und</span>
                                        <span className="text-xs">{Number(data.measure || 0).toLocaleString("es-CO")} {data.unit}</span>
                                      </div>
                                      {(() => {
                                        const subtotal = Number(data.totalValue || 0);
                                        const adminPct = Number(displayQuote.administrationPercentage || 0);
                                        const contPct = Number(displayQuote.contingenciesPercentage || 0);
                                        const profitPct = Number(displayQuote.profitPercentage || 0);
                                        const isAIU = adminPct > 0 || contPct > 0 || profitPct > 0;
                                        
                                        let totalValueInclTaxes = subtotal;
                                        if (isAIU) {
                                          const aVal = subtotal * (adminPct / 100);
                                          const iVal = subtotal * (contPct / 100);
                                          const subAI = subtotal + aVal + iVal;
                                          const uVal = subAI * (profitPct / 100);
                                          const vatOnU = displayQuote.vat ? (uVal * 0.19) : 0;
                                          totalValueInclTaxes = subtotal + aVal + iVal + uVal + vatOnU;
                                        } else if (displayQuote.vat && !displayQuote.ConstruimosAG) {
                                          totalValueInclTaxes = subtotal * 1.19;
                                        }

                                        const measure = Number(data.measure || 0);
                                        const unitValueInclTaxes = measure > 0 ? (totalValueInclTaxes / measure) : Number(data.unitValue || 0);
                                        
                                        return (
                                          <>
                                            <div className="flex flex-col text-center">
                                              <span className="text-[9px] text-purple-600 font-bold uppercase">V. Unit</span>
                                              <span className="text-xs font-medium">${unitValueInclTaxes.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex flex-col text-right">
                                              <span className="text-[9px] text-purple-600 font-bold uppercase">V. Total</span>
                                              <span className="text-xs font-bold text-purple-700">${Math.round(totalValueInclTaxes).toLocaleString("es-CO")}</span>
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                    {materialsText && (
                                      <div className="col-span-2 bg-muted/20 p-2 rounded-md border text-xs">
                                        <span className="text-[9px] text-muted-foreground font-bold uppercase block mb-0.5">Materiales</span>
                                        <span className="text-xs">{materialsText}</span>
                                      </div>
                                    )}
                                    {management && (
                                      <div className="col-span-2 bg-blue-50 dark:bg-blue-900/10 p-2 rounded-md border border-blue-100 dark:border-blue-800 grid grid-cols-2 gap-2">
                                        <div className="flex flex-col">
                                          <span className="text-[9px] text-blue-600 font-bold uppercase">Costo Mat.</span>
                                          {isBulkEditing && finalizedQuote ? (
                                            <div className="relative mt-0.5">
                                              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-muted-foreground text-[8px]">$</span>
                                              <Input
                                                className="h-6 text-[10px] pl-3 py-0"
                                                type="text"
                                                value={(() => {
                                                  const val = bulkEdits[finalizedQuote.id]?.materialCost ?? Number(finalizedQuote.materialCost || 0);
                                                  return val > 0 ? val.toLocaleString("es-CO") : "";
                                                })()}
                                                onChange={(e) => {
                                                  const rawValue = e.target.value.replace(/\D/g, "");
                                                  const val = Number(rawValue) || 0;
                                                  setBulkEdits((prev) => ({
                                                    ...prev,
                                                    [finalizedQuote.id]: {
                                                      managementPercentage:
                                                        bulkEdits[finalizedQuote.id]?.managementPercentage ??
                                                        Number(finalizedQuote.managementPercentage || 0),
                                                      materialCost: val,
                                                    },
                                                  }));
                                                }}
                                              />
                                            </div>
                                          ) : (
                                            <span className="text-xs">
                                              {displayQuote.materialCost != null
                                                ? `$${Number(displayQuote.materialCost).toLocaleString()}`
                                                : " "}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex flex-col text-right">
                                          <span className="text-[9px] text-blue-600 font-bold uppercase">% AG</span>
                                          {isBulkEditing && finalizedQuote ? (
                                            <Input
                                              className="h-6 text-[10px] text-right mt-0.5 py-0"
                                              type="number"
                                              min="0.01"
                                              max="100"
                                              value={bulkEdits[finalizedQuote.id]?.managementPercentage ?? Number(finalizedQuote.managementPercentage || 0)}
                                              onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val > 100) return;
                                                setBulkEdits((prev) => ({
                                                  ...prev,
                                                  [finalizedQuote.id]: {
                                                    materialCost:
                                                      bulkEdits[finalizedQuote.id]?.materialCost ??
                                                      Number(finalizedQuote.materialCost || 0),
                                                    managementPercentage: val,
                                                  },
                                                }));
                                              }}
                                            />
                                          ) : (
                                            <span className="text-xs">
                                              {displayQuote.managementPercentage != null
                                                ? `${displayQuote.managementPercentage}%`
                                                : " "}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-[9px] text-blue-600 font-bold uppercase">V. Unit. AG</span>
                                          <span className="text-xs font-medium text-blue-600">
                                            {(() => {
                                              const contractorTaxes = (displayQuote.vat && !displayQuote.ConstruimosAG) ? Number(displayQuote.agValue || 0) : 0;
                                              const currentMaterialCost =
                                                isBulkEditing && finalizedQuote
                                                  ? bulkEdits[finalizedQuote.id]?.materialCost ??
                                                  Number(finalizedQuote.materialCost || 0)
                                                  : Number(displayQuote.materialCost || 0);

                                              const currentMgmtPct =
                                                isBulkEditing && finalizedQuote
                                                  ? bulkEdits[finalizedQuote.id]?.managementPercentage ??
                                                  Number(finalizedQuote.managementPercentage || 0)
                                                  : Number(displayQuote.managementPercentage || 0);

                                              const currentSubtotal = Number(data.totalValue || 0) + contractorTaxes;
                                              const currentMeasure = Number(data.measure || 0);
                                              const currentAgValue = Math.round(
                                                (currentSubtotal + currentMaterialCost) * (currentMgmtPct / 100)
                                              );

                                              return currentMgmtPct != null && currentMgmtPct > 0 && currentMeasure > 0
                                                ? `$${Math.round(
                                                  (currentSubtotal + currentMaterialCost + currentAgValue) /
                                                  currentMeasure
                                                ).toLocaleString()}`
                                                : " ";
                                            })()}
                                          </span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                          <span className="text-[9px] text-blue-600 font-bold uppercase">V. Total AG</span>
                                          <span className="text-xs font-bold text-blue-700">
                                            {(() => {
                                              const contractorTaxes = (displayQuote.vat && !displayQuote.ConstruimosAG) ? Number(displayQuote.agValue || 0) : 0;
                                              const currentMaterialCost =
                                                isBulkEditing && finalizedQuote
                                                  ? bulkEdits[finalizedQuote.id]?.materialCost ??
                                                  Number(finalizedQuote.materialCost || 0)
                                                  : Number(displayQuote.materialCost || 0);

                                              const currentMgmtPct =
                                                isBulkEditing && finalizedQuote
                                                  ? bulkEdits[finalizedQuote.id]?.managementPercentage ??
                                                  Number(finalizedQuote.managementPercentage || 0)
                                                  : Number(displayQuote.managementPercentage || 0);

                                              const currentSubtotal = Number(data.totalValue || 0) + contractorTaxes;
                                              const currentAgValue = Math.round(
                                                (currentSubtotal + currentMaterialCost) * (currentMgmtPct / 100)
                                              );

                                              return currentMgmtPct != null && currentMgmtPct > 0
                                                ? `$${Math.round(
                                                  currentSubtotal + currentMaterialCost + currentAgValue
                                                ).toLocaleString()}`
                                                : " ";
                                            })()}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                );
                              } else if (management && !hasAnyQuote) {
                                return (
                                  <div className="col-span-2 bg-muted/30 p-2 rounded-md text-xs text-center italic text-muted-foreground">
                                    Esperando cotizaciones de contratistas
                                  </div>
                                );
                              } else if (management && hasAnyQuote) {
                                return (
                                  <div className="col-span-2 bg-amber-50 dark:bg-amber-900/10 p-2 rounded-md border border-amber-200 text-xs text-center italic text-amber-700 font-medium">
                                    Esperando selección y asignación de precios
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="col-span-2 bg-muted/30 p-2 rounded-md text-xs text-center italic text-muted-foreground">
                                    Cotización asignada a contratista
                                  </div>
                                );
                              }
                            })()}

                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span className="text-[11px]">{formatDate(item.createdAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
                            {management ? (
                              <>
                                {!isFinished && (item.quoteItems?.length ?? 0) > 0 && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleViewQuotations(item.id)}
                                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    Seleccionar Cot.
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
                                  onClick={() => handleEdit(item)}
                                  className="flex-1"
                                >
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>

                                {item.quoteItems?.some(q => q.ConstruimosAG) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditQuote(item, item.quoteItems!.find(q => q.ConstruimosAG))}
                                    className="flex-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                                  >
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    Mod. Cot.
                                  </Button>
                                )}

                                {!management && (<Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePermanentDelete(item)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={submitting}
                                >
                                  <CircleX className="h-4 w-4" />
                                </Button>)}

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
                                      onClick={() => handleDelete(item)}
                                      className={
                                        item.active
                                          ? "text-destructive hover:text-destructive"
                                          : "text-green-500 hover:text-green-600"
                                      }
                                    >
                                      {item.active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
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
              )}
            </div>
          ))}
        </div>
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
                className="bg-green-600 hover:bg-green-700"
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

      <Dialog open={newTitleModalOpen} onOpenChange={setNewTitleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Título</DialogTitle>
            <DialogDescription>Agrega una nueva agrupación para clasificar ítems.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre del Título</Label>
              <Input
                placeholder="Ej: Preparación..."
                value={newTitleValue}
                onChange={(e) => setNewTitleValue(e.target.value)}
                disabled={addingTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTitleValue.trim()) handleAddTitle();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNewTitleValue("");
              setNewTitleModalOpen(false);
            }} disabled={addingTitle}>Cancelar</Button>
            <Button onClick={handleAddTitle} className="bg-purple-500 hover:bg-purple-600 text-white" disabled={addingTitle || !newTitleValue.trim()}>
              {addingTitle ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Guardar Título
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editTitleModalOpen} onOpenChange={setEditTitleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Título</DialogTitle>
            <DialogDescription>Cambia el nombre de la agrupación. Todos los ítems asociados se actualizarán.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nuevo Nombre del Título</Label>
              <Input
                placeholder="Ej: Nueva Preparación..."
                value={newTitleValue}
                onChange={(e) => setNewTitleValue(e.target.value)}
                disabled={updatingTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTitleValue.trim()) handleUpdateTitle();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNewTitleValue("");
              setEditTitleModalOpen(false);
            }} disabled={updatingTitle}>Cancelar</Button>
            <Button onClick={handleUpdateTitle} className="bg-purple-500 hover:bg-purple-600 text-white" disabled={updatingTitle || !newTitleValue.trim()}>
              {updatingTitle ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Actualizar Título
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Otros Modals */}
      <ItemModal
        titles={localTitles}
        selectedTitle={selectedTitleForNewItem}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        item={selectedItem}
        workId={work.id}
        onSubmit={handleEditSubmit}
        coordinator={coordinator}
        contractors={contractors}
        editingQuoteItem={editingQuoteItem}
      />
      <ConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Activar/Desactivar Ítem"
        description={`¿Estás seguro de que deseas activar/desactivar el ítem actual?`}
        onConfirm={handleDeleteConfirm}
      />
      <ConfirmModal
        open={permanentDeleteModalOpen}
        onOpenChange={setPermanentDeleteModalOpen}
        title="Eliminar Ítem Permanentemente"
        description={`¿Estás seguro de que deseas eliminar permanentemente el ítem?`}
        onConfirm={handlePermanentDeleteConfirm}
      />
      <ConfirmModal
        open={deactivateQuoteModalOpen}
        onOpenChange={setDeactivateQuoteModalOpen}
        title="Desactivar Cotización"
        description={`¿Estás seguro de que deseas desactivar la cotización del ítem?`}
        onConfirm={handleDeactivateQuoteConfirm}
      />
      <WorkExtrasModal
        open={extrasModalOpen}
        onOpenChange={setExtrasModalOpen}
        work={work}
        onSubmit={handleUpdateExtras}
        isSubmitting={updatingExtras}
      />
    </div>
  );
}