"use client";

import { useState, useMemo } from "react";
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
import { ItemModal } from "./item-modal";
import { ConfirmModal } from "./confirm-modal";
import { useItems } from "@/hooks/items/useItems";
import { toast } from "sonner";
import type { Item, Work } from "@/lib/types";

interface ItemsTableProps {
  work: Work;
  coordinator?: boolean;
}

export function ItemsTable({ work, coordinator = true }: ItemsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [permanentDeleteModalOpen, setPermanentDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const { items, submitting, createItem, updateItem, toggleActive, deleteItem } =
    useItems(work.id);

  // Generar token único para enlace externo
  const generateExternalToken = (item: Item) => {
    const timestamp = new Date(item.createdAt).getTime();
    const data = `${timestamp}-${item.id}`;
    // Usar btoa para navegadores (equivalente a Buffer.from().toString('base64'))
    return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const copyExternalLink = (item: Item) => {
    const token = generateExternalToken(item);
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/extern-contractor/${token}/${item.id}`;

    navigator.clipboard.writeText(link);
    toast.success("Link copiado al portapapeles");
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

  const getPersonnelDisplay = (personnel: Record<string, unknown>) => {
    const values = Object.values(personnel).filter(
      (v) => typeof v === "string",
    );
    return values.join(", ") || "Not assigned";
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
    coordinator ? router.push(`/coordinator/works/${work.id}/items/${itemId}`) : router.push(`/admin/works/${work.id}/items/${itemId}`)
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
        // Error is already handled by the hook with toast
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
          onClick={() => router.push("/coordinator")}
          className="shrink-0 mt-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
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
        {coordinator && (<Button
          onClick={handleCreateItem}
          className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4" />
          Crear Ítem
        </Button>)}
      </div>

      {filteredItems.length > 0 ? (
        <>
          {/* Table view for medium and large screens */}
          <div className="hidden md:block border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="whitespace-nowrap">ID</TableHead>
                  <TableHead className="min-w-50">Descripción</TableHead>
                  <TableHead className="whitespace-nowrap">Creado</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Tiempo Est.
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Personal</TableHead>
                  <TableHead className="whitespace-nowrap">Estado</TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item: Item) => (
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
                        {getPersonnelDisplay(item.personnelRequired)}
                      </p>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {!coordinator && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyExternalLink(item)}
                            className="h-8 px-2 text-blue-600 hover:text-blue-700"
                            title="Copiar link para contratista externo"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Copiar link externo</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="h-8 px-2"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(item.id)}
                          className="h-8 px-2"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="sr-only">Ver detalles</span>
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
                              <span className="sr-only">Desactivar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePermanentDelete(item)}
                              className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={submitting}
                            >
                              <CircleX className="h-4 w-4" />
                              <span className="sr-only">Eliminar permanentemente</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Card view for mobile */}
          <div className="md:hidden space-y-3">
            {filteredItems.map((item: Item) => (
              <div
                key={item.id}
                className="border rounded-lg bg-card p-4 space-y-3"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
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
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Item info */}
                <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span>
                      {formatEstimatedTime(item.estimatedExecutionTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">
                      {getPersonnelDisplay(item.personnelRequired)}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  {!coordinator && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyExternalLink(item)}
                      className="flex-1 text-blue-600 hover:text-blue-700"
                    >
                      <Link2 className="h-4 w-4 mr-1" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(item.id)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
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
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={submitting}
                      >
                        <CircleX className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8 sm:py-12 text-muted-foreground border rounded-lg">
          {searchTerm ? (
            <p>No se encontraron ítems que coincidan con "{searchTerm}"</p>
          ) : (
            <p>No hay ítems registrados. {coordinator && "Crea uno nuevo para comenzar."}</p>
          )}
        </div>
      )}

      {/* Modals */}
      <ItemModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        item={selectedItem}
        workId={work.id}
        onSubmit={handleEditSubmit}
        isSubmitting={submitting}
        coordinator={false}
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
        description={`¿Estás seguro de que deseas eliminar permanentemente el ítem #${selectedItem?.id}? Esta acción no se puede deshacer.`}
        onConfirm={handlePermanentDeleteConfirm}
      />
    </div>
  );
}