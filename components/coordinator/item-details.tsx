"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  FileText,
  Info,
  Building2,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Item, Work } from "@/lib/types";
import { useUsers } from "@/hooks/users/useUsers";

interface ItemDetailsProps {
  work: Work;
  item: Item & {
    contractor?: { id: number; identifier: string } | null;
    quoteItems?: Array<{ id: number; subtotal: string }>;
  };
  backUrl?: string;
  backLabel?: string;
}

export function ItemDetails({
  work,
  item,
  backUrl,
  backLabel = "Volver a ítems",
}: ItemDetailsProps) {
  const router = useRouter();
  const defaultBackUrl = `/coordinator/works/${work.id}`;
  const finalBackUrl = backUrl || defaultBackUrl;

  const { users, currentUser } = useUsers();

  const isAuditor = currentUser?.role === "project_info" || currentUser?.role === "administrative_assistant";
  const creator = users.find((u) => u.id === item.createdById);
  const updater = users.find((u) => u.id === item.updatedById);

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatEstimatedTime = (hours: number | null) => {
    if (!hours) return "No se asignó un tiempo estimado";
    if (hours < 24) return `${hours} horas`;
    const days = Math.floor(hours / 8);
    return `${days} día${days > 1 ? "s" : ""} (${hours} horas)`;
  };

  const notes = "";

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(finalBackUrl)}
          className="shrink-0 mt-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Detalles del Ítem
            </h1>
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
          <p className="text-sm sm:text-base text-muted-foreground wrap-break-word">
            Obra: {work.code}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-card border rounded-lg divide-y">
        {/* Description */}
        <div className="p-4 sm:p-6 space-y-3">
          <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-foreground" />
            Descripción
          </h2>
          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
            {item.description}
          </p>
        </div>

        {/* Removed Personnel Requerido and Adicionales blocks */}

        {/* Información Principal */}
        <div className="p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-foreground" />
            Información Principal
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 mt-0.5 shrink-0 text-purple-500" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Tiempo Estimado</p>
                <p className="font-medium">
                  {formatEstimatedTime(item.estimatedExecutionTime)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 mt-0.5 shrink-0 text-purple-500" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Contratista</p>
                <p className="font-medium">
                  {item.quoteItems?.some((q: any) => q.ConstruimosAG)
                    ? "Construimos AG"
                    : (item.contractor?.name || "No se ha asignado un contratista")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Creado El</p>
                <p className="font-medium text-sm sm:text-base">
                  {formatDate(item.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Actualizado El</p>
                <p className="font-medium text-sm sm:text-base">
                  {formatDate(item.updatedAt)}
                </p>
              </div>
            </div>
            {isAuditor && item.createdById && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 mt-0.5 shrink-0 text-purple-500" />
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Creado Por</p>
                  <p className="font-medium text-sm sm:text-base">
                    {creator?.name || `Usuario ID: ${item.createdById}`}
                  </p>
                </div>
              </div>
            )}
            {isAuditor && item.updatedById && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 mt-0.5 shrink-0 text-purple-500" />
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Actualizado Por</p>
                  <p className="font-medium text-sm sm:text-base">
                    {updater?.name || `Usuario ID: ${item.updatedById}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quote Items 
        {item.quoteItems && item.quoteItems.length > 0 && (
          <div className="p-4 sm:p-6 space-y-4">
            <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Cotizaciones
            </h2>
            <div className="grid gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {item.quoteItems.map((quoteItem) => (
                <div
                  key={quoteItem.id}
                  className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0 last:pb-0"
                >
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Cotización #{quoteItem.id}
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 font-semibold">
                    ${Number(quoteItem.subtotal).toLocaleString("es-ES")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
          */}
      </div>

      {/* Actions */}
      <div className="flex">
        <Button
          onClick={() => router.push(finalBackUrl)}
          className="w-full sm:w-auto bg-purple-500 hover:bg-purple-600 text-white"
        >
          {backLabel}
        </Button>
      </div>
    </div>
  );
}
