"use client";

import type React from "react";
import { Badge, Calendar, FileText, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Work } from "@/lib/types";

interface WorkCardProps {
  work: Work;
  onEdit?: (work: Work) => void;
  onDelete?: (workId: string | number) => void;
  onClick: (workId: string) => void;
}

export function WorkCard({ work, onEdit, onDelete, onClick }: WorkCardProps) {
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(work);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(work.id);
    }
  };

  return (
    <div
      onClick={() => onClick(work.id.toString())}
      className="group cursor-pointer rounded-lg border border-border bg-card p-4 sm:p-5 shadow-sm transition-all hover:border-purple-500 hover:shadow-md"
    >
      <div className="flex flex-col gap-3">
        {/* Header con nombre, código y botón editar */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base sm:text-lg leading-tight line-clamp-2">
              {work.code}
            </h3>
            <div className="mt-2">
              <span
                className={`inline-flex items-center rounded-sm px-2 py-0.5 text-sm font-semibold ${work.finalized
                    ? "bg-green-700 text-white"
                    : "bg-purple-700 text-white"
                  } `}
              >
                Finalizada: {work.finalized ? "Sí" : "No"}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditClick}
                className="bg-transparent"
              >
                <Pencil className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteClick}
                className="bg-transparent text-destructive border-destructive hover:bg-destructive hover:text-white"
              >
                <Trash2 className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Eliminar</span>
              </Button>
            )}
          </div>
        </div>

        {/* Información del Work */}
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-500 shrink-0" />
            <span className="truncate">
              Creado: {formatDate(work.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-500 shrink-0" />
            <span>{work.items?.length} actividades</span>
          </div>
          <div className="flex items-center gap-2 col-span-1 xs:col-span-2">
            <Calendar className="h-4 w-4 text-red-500 shrink-0" />
            <span className="truncate">
              Límite:{" "}
              {work.quotationDeadline
                ? formatDate(work.quotationDeadline)
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
