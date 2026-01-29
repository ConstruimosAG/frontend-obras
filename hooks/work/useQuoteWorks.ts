import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export type QuoteWorkPayload = {
  workId: number;
  subtotal: number;
  total: number;
  quoteItemIds?: number[]; // IDs de las cotizaciones de items incluidas
};

export function useQuoteWorks() {
  const [quoteWorks, setQuoteWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchQuoteWorks = useCallback(
    async (opts?: { workId?: number; page?: number; limit?: number }) => {
      setLoading(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
        const params = new URLSearchParams();
        if (opts?.workId) params.set("workId", String(opts.workId));
        if (opts?.page) params.set("page", String(opts.page));
        if (opts?.limit) params.set("limit", String(opts.limit));
        const url =
          `${baseUrl}/api/quote-works` + (params.toString() ? `?${params}` : "");
        const res = await fetch(url, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`Error fetching quote works: ${res.status}`);
        const json = await res.json();
        const incoming = json?.data?.quoteWorks ?? json?.data ?? json;
        setQuoteWorks(incoming ?? []);
        return incoming;
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudieron cargar las cotizaciones de obras");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  const createQuoteWork = useCallback(
    async (payload: QuoteWorkPayload) => {
      setSubmitting(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
        const res = await fetch(`${baseUrl}/api/quote-works`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(`Error creating quote work: ${res.status} ${text ?? ""}`);
        }
        const json = await res.json();
        const created = json?.data ?? json;
        setQuoteWorks((prev) => [created, ...prev]);
        toast.success("Cotización de obra creada correctamente.");
        return created;
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo crear la cotización de obra");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [baseUrl]
  );

  const getQuoteWork = useCallback(
    async (id: number) => {
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
        const res = await fetch(`${baseUrl}/api/quote-works/${id}`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`Error fetching quote work: ${res.status}`);
        const json = await res.json();
        return json?.data ?? json;
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo cargar la cotización de obra");
        throw err;
      }
    },
    [baseUrl]
  );

  const updateQuoteWork = useCallback(
    async (id: number | string, payload: Partial<QuoteWorkPayload>) => {
      setSubmitting(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
        const res = await fetch(`${baseUrl}/api/quote-works/${id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(`Error updating quote work: ${res.status} ${text ?? ""}`);
        }
        const json = await res.json();
        const updated = json?.data ?? json;
        setQuoteWorks((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
        toast.success("Cotización de obra actualizada correctamente.");
        return updated;
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo actualizar la cotización de obra");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [baseUrl]
  );

  const deleteQuoteWork = useCallback(
    async (id: number | string) => {
      setSubmitting(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
        const res = await fetch(`${baseUrl}/api/quote-works/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(`Error deleting quote work: ${res.status} ${text ?? ""}`);
        }
        setQuoteWorks((prev) => prev.filter((q) => q.id !== Number(id)));
        toast.success("Cotización de obra eliminada correctamente.");
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo eliminar la cotización de obra");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [baseUrl]
  );

  useEffect(() => {
    // no fetch automático por default — quien lo use decidirá cuando llamar fetchQuoteWorks
  }, []);

  return {
    quoteWorks,
    setQuoteWorks,
    loading,
    submitting,
    fetchQuoteWorks,
    createQuoteWork,
    getQuoteWork,
    updateQuoteWork,
    deleteQuoteWork,
  };
}