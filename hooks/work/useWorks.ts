"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { Work } from "@/lib/types";

type CreatePayload = { code: string; quotationDeadline: string };
type UpdatePayload = { quotationDeadline: string; finalized?: boolean };

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

      const res = await fetch(`${baseUrl}/api/works`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

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
    async (data: CreatePayload) => {
      setSubmitting(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");

        const res = await fetch(`${baseUrl}/api/works`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: data.code,
            quotationDeadline: new Date(data.quotationDeadline), // YYYY-MM-DD from input
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(`Error creating work: ${res.status} ${text ?? ""}`);
        }

        const json = await res.json();
        const created: Work = json?.data ?? json?.work ?? json;

        // actualizar estado local
        setWorks((prev) => [created, ...prev]);

        toast.success("La obra se creó correctamente.");

        return created;
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo crear la obra");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [baseUrl, toast],
  );

  const updateWork = useCallback(
    async (id: string | number, data: UpdatePayload) => {
      setSubmitting(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");

        const res = await fetch(`${baseUrl}/api/works/${id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quotationDeadline: new Date(data.quotationDeadline),
            finalized: data.finalized,
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(`Error updating work: ${res.status} ${text ?? ""}`);
        }

        const json = await res.json();
        const updated: Work = json?.data ?? json?.work ?? json;

        setWorks((prev) =>
          prev.map((w) => (w.id === updated.id ? updated : w)),
        );

        toast.success("Los cambios se guardaron correctamente.");

        return updated;
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo actualizar la obra");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [baseUrl, toast],
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
  };
}
