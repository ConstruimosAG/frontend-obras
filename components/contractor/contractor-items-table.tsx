"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Eye,
  ArrowLeft,
  Calendar,
  User,
  Clock,
  FileText,
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
import type { Item } from "@/lib/types";

interface ContractorItemsTableProps {
  items: Item[];
  loading?: boolean;
  user: any;
  contractorName?: string;
  currentUserId?: number | null;
}

export function ContractorItemsTable({
  items,
  loading = false,
  user,
  contractorName,
  currentUserId,
}: ContractorItemsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

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
    const entries: string[] = [];
    Object.entries(personnel).forEach(([key, value]) => {
      if (typeof value === "number" && value > 0) {
        entries.push(`${key}: ${value}`);
      }
    });
    return entries.join(", ") || "No asignado";
  };

  const formatEstimatedTime = (hours: number | null) => {
    if (!hours) return "No establecido";
    if (hours < 24) return `${hours} horas`;
    const days = Math.floor(hours / 8);
    return `${days} día${days > 1 ? "s" : ""}`;
  };

  const hasQuoted = (item: Item) => {
    return user.assignedQuoteItems?.some(
      (quote: any) => quote.itemId === item.id
    );
  };

  const handleViewDetails = (itemId: number) => {
    router.push(`/contractor/items/${itemId}`);
  };

  const handleQuote = (itemId: number) => {
    router.push(`/contractor/items/${itemId}/quote`);
  };

  if (loading) {
    return (
      <div className="text-center py-8 sm:py-12 text-muted-foreground">
        <p>Cargando ítems...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground wrap-break-word">
            Mis Ítems Asignados
          </h1>
          {contractorName && (
            <p className="text-sm sm:text-base text-muted-foreground">
              Contratista: {contractorName}
            </p>
          )}
          <p className="text-sm sm:text-base text-muted-foreground">
            {items.length} ítem{items.length !== 1 ? "s" : ""} asignado{items.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por descripción o personal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
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
                  <TableHead className="whitespace-nowrap">Obra</TableHead>
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
                {filteredItems.map((item: Item) => {
                  const hasQuotedItem = hasQuoted(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        #{item.id}
                      </TableCell>
                      <TableCell className="max-w-62.5">
                        <p className="truncate">{item.description}</p>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {(item as any).work?.code || `Work #${item.workId}`}
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

                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleQuote(item.id)}
                            className="h-8 px-2 bg-orange-500 hover:bg-orange-600"
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            <span className="hidden lg:inline">{!hasQuotedItem ? "Cotizar" : "Ver cotización"}</span>
                            <span className="sr-only lg:hidden">{!hasQuotedItem ? "Cotizar" : "Ver cotización"}</span>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Card view for mobile */}
          <div className="md:hidden space-y-3">
            {filteredItems.map((item: Item) => {
              const hasQuotedItem = hasQuoted(item);
              return (
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
                        {hasQuotedItem && (
                          <Badge className="bg-blue-500 hover:bg-blue-600">
                            Cotizado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">
                        {item.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Obra: {(item as any).work?.code || `Work #${item.workId}`}
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

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleQuote(item.id)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      {!hasQuotedItem ? "Cotizar" : "Ver cotización"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(item.id)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detalles
                    </Button>
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
            <p>No tienes ítems asignados.</p>
          )}
        </div>
      )}
    </div>
  );
}