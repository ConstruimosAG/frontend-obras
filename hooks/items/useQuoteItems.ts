import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export type QuoteItemPayload = {
  // campos que enviaremos al backend
  itemId: number;
  subquotations?: any; // JSON
  totalContractor: number;
  materials?: any; // JSON
  materialCost: number | null;
  subtotal: number;
  administrationPercentage: number | null;
  contingenciesPercentage?: number | null;
  profitPercentage?: number | null;
  agValue?: number | null;
  vat?: boolean;
  assignedContractorId?: number | null;
};

export function useQuoteItems() {
  const [quoteItems, setQuoteItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchQuoteItems = useCallback(
    async (opts?: { itemId?: number; page?: number; limit?: number }) => {
      setLoading(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
        const params = new URLSearchParams();
        if (opts?.itemId) params.set("itemId", String(opts.itemId));
        if (opts?.page) params.set("page", String(opts.page));
        if (opts?.limit) params.set("limit", String(opts.limit));
        const url =
          `${baseUrl}/api/quote-items` + (params.toString() ? `?${params}` : "");
        const res = await fetch(url, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`Error fetching quote items: ${res.status}`);
        const json = await res.json();
        const incoming = json?.data?.quoteItems ?? json?.data ?? json;
        setQuoteItems(incoming ?? []);
        return incoming;
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudieron cargar las cotizaciones");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  const createQuoteItem = useCallback(
    async (payload: QuoteItemPayload) => {
      setSubmitting(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
        const res = await fetch(`${baseUrl}/api/quote-items`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(`Error creating quote item: ${res.status} ${text ?? ""}`);
        }
        const json = await res.json();
        const created = json?.data ?? json;
        setQuoteItems((prev) => [created, ...prev]);
        toast.success("Cotización creada correctamente.");
        return created;
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo crear la cotización");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [baseUrl]
  );

  const getQuoteItem = useCallback(
    async (id: number) => {
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
        const res = await fetch(`${baseUrl}/api/quote-items/${id}`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`Error fetching quote item: ${res.status}`);
        const json = await res.json();
        return json?.data ?? json;
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo cargar la cotización");
        throw err;
      }
    },
    [baseUrl]
  );

  const updateQuoteItem = useCallback(
    async (id: number | string, payload: Partial<QuoteItemPayload>) => {
      setSubmitting(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
        const res = await fetch(`${baseUrl}/api/quote-items/${id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(`Error updating quote item: ${res.status} ${text ?? ""}`);
        }
        const json = await res.json();
        const updated = json?.data ?? json;
        setQuoteItems((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
        toast.success("Cotización actualizada correctamente.");
        return updated;
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo actualizar la cotización");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [baseUrl]
  );

  const deleteQuoteItem = useCallback(
    async (id: number | string) => {
      setSubmitting(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
        const res = await fetch(`${baseUrl}/api/quote-items/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(`Error deleting quote item: ${res.status} ${text ?? ""}`);
        }
        setQuoteItems((prev) => prev.filter((q) => q.id !== Number(id)));
        toast.success("Cotización eliminada correctamente.");
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo eliminar la cotización");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [baseUrl]
  );

  useEffect(() => {
    // no fetch automático por default — quien lo use decidirá cuando llamar fetchQuoteItems
  }, []);

  return {
    quoteItems,
    setQuoteItems,
    loading,
    submitting,
    fetchQuoteItems,
    createQuoteItem,
    getQuoteItem,
    updateQuoteItem,
    deleteQuoteItem,
  };
}
