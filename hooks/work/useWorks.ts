"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { Work } from "@/lib/types";
import { fetchClient } from "@/lib/fetch-client";

type CreatePayload = { code: string; quotationDeadline: string };
type UpdatePayload = {
  code?: string;
  quotationDeadline: string;
  finalized?: boolean;
};

export function useWorks() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!baseUrl) {
    // no hacer throw en render; dejarlo para el fetch
    // pero es útil para el desarrollo saber que falta la env
    console.warn("NEXT_PUBLIC_BACKEND_URL no está definida");
  }

  const fetchWorks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL es obligatoria");

      const res = await fetchClient(`${baseUrl}/api/works`);

      if (!res.ok) throw new Error(`Error fetching works: ${res.status}`);

      type WorksResponse = {
        success: boolean;
        data?: {
          works?: Work[];
          pagination?: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        };
      };

      const payload: WorksResponse = await res.json();
      const incoming =
        (payload as any)?.data?.works ?? (payload as any)?.works ?? [];
      setWorks(incoming);
    } catch (err: any) {
      console.error(err);
      const message = err?.message ?? "No se pudieron cargar las obras";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, toast]);

  const createWork = useCallback(
    async (data: CreatePayload): Promise<{ success: boolean; data?: Work; error?: string }> => {
      setSubmitting(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");

        const res = await fetchClient(`${baseUrl}/api/works`, {
          method: "POST",
          body: JSON.stringify({
            code: data.code,
            quotationDeadline: new Date(data.quotationDeadline), // YYYY-MM-DD from input
          }),
        });

        if (!res.ok) {
          const errorPayload = await res.json().catch(() => null);
          const message = errorPayload?.message || `Error al crear la obra: ${res.status}`;
          toast.error(message);
          return { success: false, error: message };
        }

        const json = await res.json();
        const created: Work = json?.data ?? json?.work ?? json;

        // actualizar estado local
        setWorks((prev) => [created, ...prev]);

        toast.success("La obra se creó correctamente.");

        return { success: true, data: created };
      } catch (err: any) {
        console.error(err);
        const message = err?.message ?? "No se pudo crear la obra";
        toast.error(message);
        return { success: false, error: message };
      } finally {
        setSubmitting(false);
      }
    },
    [baseUrl, toast],
  );

  const updateWork = useCallback(
    async (id: string | number, data: UpdatePayload): Promise<{ success: boolean; data?: Work; error?: string }> => {
      setSubmitting(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");

        const res = await fetchClient(`${baseUrl}/api/works/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            code: data.code,
            quotationDeadline: new Date(data.quotationDeadline),
            finalized: data.finalized,
          }),
        });

        if (!res.ok) {
          const errorPayload = await res.json().catch(() => null);
          const message = errorPayload?.message || `Error al actualizar la obra: ${res.status}`;
          toast.error(message);
          return { success: false, error: message };
        }

        const json = await res.json();
        const updated: Work = json?.data ?? json?.work ?? json;

        setWorks((prev) =>
          prev.map((w) => (w.id === updated.id ? updated : w)),
        );

        toast.success("Los cambios se guardaron correctamente.");

        return { success: true, data: updated };
      } catch (err: any) {
        console.error(err);
        const message = err?.message ?? "No se pudo actualizar la obra";
        toast.error(message);
        return { success: false, error: message };
      } finally {
        setSubmitting(false);
      }
    },
    [baseUrl, toast],
  );

  const deleteWork = useCallback(
    async (id: string | number) => {
      setSubmitting(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");

        const res = await fetchClient(`${baseUrl}/api/works/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(`Error deleting work: ${res.status} ${text ?? ""}`);
        }

        setWorks((prev) => prev.filter((w) => w.id !== Number(id)));

        toast.success("Trabajo eliminado exitosamente");
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo eliminar la obra");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [baseUrl]
  );

  useEffect(() => {
    void fetchWorks();
  }, [fetchWorks]);

  return {
    works,
    setWorks,
    loading,
    error,
    submitting,
    fetchWorks,
    createWork,
    updateWork,
    deleteWork,
  };
}
