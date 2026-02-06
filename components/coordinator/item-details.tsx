"use client";

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
    if (!hours) return "No establecido";
    if (hours < 24) return `${hours} horas`;
    const days = Math.floor(hours / 8);
    return `${days} día${days > 1 ? "s" : ""} (${hours} horas)`;
  };

  const formatPersonnelLabel = (key: string): string => {
    const labels: Record<string, string> = {
      oficiales: "OFICIALES",
      ayudantes: "AYUDANTES",
      mediaCuchara: "MEDIA CUCHARA",
      siso: "SISO",
      otroName: "OTRO",
      otroQuantity: "Cantidad",
      electricistas: "ELECTRICISTAS",
      pintores: "PINTORES",
    };
    return labels[key] || key.toUpperCase();
  };

  const formatExtrasLabel = (key: string): string => {
    const labels: Record<string, string> = {
      andamio: "ANDAMIO",
      andamios: "ANDAMIOS",
      equiposDeAltura: "EQUIPOS DE ALTURA",
      volqueta: "VOLQUETA",
      acarreoYTransporte: "ACARREO Y TRANSPORTE",
      herramientaEspecial: "HERRAMIENTA ESPECIAL",
      herramientas: "HERRAMIENTAS",
      transporte: "TRANSPORTE",
      otroName: "OTRO",
      otroQuantity: "Cantidad",
      notes: "NOTAS",
    };
    return labels[key] || key.toUpperCase();
  };

  const getPersonnelEntries = () => {
    const personnel = item.personnelRequired || {};
    const entries: Array<{ label: string; value: string | number }> = [];

    // Standard fields
    if (personnel.oficiales && typeof personnel.oficiales === "number") {
      entries.push({
        label: formatPersonnelLabel("oficiales"),
        value: personnel.oficiales,
      });
    }
    if (personnel.ayudantes && typeof personnel.ayudantes === "number") {
      entries.push({
        label: formatPersonnelLabel("ayudantes"),
        value: personnel.ayudantes,
      });
    }
    if (personnel.mediaCuchara && typeof personnel.mediaCuchara === "number") {
      entries.push({
        label: formatPersonnelLabel("mediaCuchara"),
        value: personnel.mediaCuchara,
      });
    }
    if (personnel.siso && typeof personnel.siso === "number") {
      entries.push({
        label: formatPersonnelLabel("siso"),
        value: personnel.siso,
      });
    }
    if (personnel.electricistas && typeof personnel.electricistas === "number") {
      entries.push({
        label: formatPersonnelLabel("electricistas"),
        value: personnel.electricistas,
      });
    }
    if (personnel.pintores && typeof personnel.pintores === "number") {
      entries.push({
        label: formatPersonnelLabel("pintores"),
        value: personnel.pintores,
      });
    }

    // Other custom fields
    if (personnel.otroName && typeof personnel.otroName === "string") {
      const otroQty = typeof personnel.otroQuantity === "number" ? personnel.otroQuantity : 0;
      entries.push({
        label: `${formatPersonnelLabel("otroName")}: ${personnel.otroName}`,
        value: otroQty,
      });
    }

    // Any other custom fields
    Object.entries(personnel).forEach(([key, value]) => {
      if (
        !["oficiales", "ayudantes", "mediaCuchara", "siso", "electricistas", "pintores", "otroName", "otroQuantity"].includes(key) &&
        typeof value === "number" &&
        value > 0
      ) {
        entries.push({
          label: formatPersonnelLabel(key),
          value: value,
        });
      }
    });

    return entries;
  };

  const getExtrasEntries = () => {
    const extras = item.extras || {};
    const entries: Array<{ label: string; value: string | number | boolean }> = [];

    // Standard fields
    if (extras.andamio) {
      const value = extras.andamio;
      if (typeof value === "number" || typeof value === "boolean") {
        entries.push({
          label: formatExtrasLabel("andamio"),
          value: value,
        });
      }
    }
    if (extras.andamios) {
      const value = extras.andamios;
      if (typeof value === "number" || typeof value === "boolean") {
        entries.push({
          label: formatExtrasLabel("andamios"),
          value: value,
        });
      }
    }
    if (extras.equiposDeAltura) {
      const value = extras.equiposDeAltura;
      if (typeof value === "number" || typeof value === "boolean") {
        entries.push({
          label: formatExtrasLabel("equiposDeAltura"),
          value: value,
        });
      }
    }
    if (extras.volqueta) {
      const value = extras.volqueta;
      if (typeof value === "number" || typeof value === "boolean") {
        entries.push({
          label: formatExtrasLabel("volqueta"),
          value: value,
        });
      }
    }
    if (extras.acarreoYTransporte) {
      const value = extras.acarreoYTransporte;
      if (typeof value === "number" || typeof value === "boolean") {
        entries.push({
          label: formatExtrasLabel("acarreoYTransporte"),
          value: value,
        });
      }
    }
    if (extras.herramientaEspecial) {
      const value = extras.herramientaEspecial;
      if (typeof value === "number" || typeof value === "boolean") {
        entries.push({
          label: formatExtrasLabel("herramientaEspecial"),
          value: value,
        });
      }
    }
    if (extras.herramientas) {
      const value = extras.herramientas;
      if (typeof value === "number" || typeof value === "boolean") {
        entries.push({
          label: formatExtrasLabel("herramientas"),
          value: value,
        });
      }
    }
    if (extras.transporte) {
      const value = extras.transporte;
      if (typeof value === "number" || typeof value === "boolean") {
        entries.push({
          label: formatExtrasLabel("transporte"),
          value: value,
        });
      }
    }

    // Other custom fields
    if (extras.otroName && typeof extras.otroName === "string") {
      const otroQty = typeof extras.otroQuantity === "number" ? extras.otroQuantity : 0;
      entries.push({
        label: `${formatExtrasLabel("otroName")}: ${extras.otroName}`,
        value: otroQty,
      });
    }

    // Any other custom fields
    Object.entries(extras).forEach(([key, value]) => {
      if (
        !["andamio", "andamios", "equiposDeAltura", "volqueta", "acarreoYTransporte", "herramientaEspecial", "herramientas", "transporte", "otroName", "otroQuantity", "notes", "images"].includes(key) &&
        (typeof value === "number" || typeof value === "boolean") &&
        (typeof value === "boolean" ? value === true : value > 0)
      ) {
        entries.push({
          label: formatExtrasLabel(key),
          value: value,
        });
      }
    });

    return entries;
  };

  const personnelEntries = getPersonnelEntries();
  const extrasEntries = getExtrasEntries();
  const notes = (item.extras?.notes as string) || null;

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

        {/* Personal Requerido */}
        <div className="p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-orange-500" />
            Personal Requerido
          </h2>
          {personnelEntries.length > 0 ? (
            <div className="grid gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {personnelEntries.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0 last:pb-0"
                >
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {entry.label}
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 font-semibold">
                    {typeof entry.value === "number" ? entry.value : String(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No se ha asignado personal</p>
          )}
        </div>

        {/* Adicionales */}
        <div className="p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Adicionales
          </h2>
          {extrasEntries.length > 0 ? (
            <div className="grid gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {extrasEntries.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0 last:pb-0"
                >
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {entry.label}
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 font-semibold">
                    {typeof entry.value === "boolean"
                      ? entry.value
                        ? "Sí"
                        : "No"
                      : typeof entry.value === "number"
                        ? entry.value
                        : String(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No hay adicionales registrados</p>
          )}
        </div>

        {/* Notas Adicionales */}
        {notes && (
          <div className="p-4 sm:p-6 space-y-3">
            <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Notas Adicionales
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              {notes}
            </p>
          </div>
        )}

        {/* Información Principal */}
        <div className="p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-foreground" />
            Información Principal
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 mt-0.5 shrink-0 text-orange-500" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Tiempo Estimado</p>
                <p className="font-medium">
                  {formatEstimatedTime(item.estimatedExecutionTime)}
                </p>
              </div>
            </div>
            {item.contractor && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 mt-0.5 shrink-0 text-orange-500" />
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Contratista</p>
                  <p className="font-medium">
                    {item.contractor.name || `ID: ${item.contractor.id}`}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Creado El</p>
                <p className="font-medium text-sm sm:text-base">
                  {formatDate(item.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Actualizado El</p>
                <p className="font-medium text-sm sm:text-base">
                  {formatDate(item.updatedAt)}
                </p>
              </div>
            </div>
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
          className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white"
        >
          {backLabel}
        </Button>
      </div>
    </div>
  );
}
