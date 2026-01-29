// components/ui/Pagination.tsx
"use client";

import React from "react";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  limit,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const prev = () => onPageChange(Math.max(1, page - 1));
  const next = () => onPageChange(Math.min(totalPages, page + 1));

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <div className="text-sm text-muted-foreground">
        Página {page} de {totalPages} — {total} items
      </div>
      <div className="flex gap-2">
        <button
          onClick={prev}
          disabled={page <= 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          onClick={next}
          disabled={page >= totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
