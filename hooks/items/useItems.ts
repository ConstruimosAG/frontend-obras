"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Item } from "@/lib/types";
import { fetchClient } from "@/lib/fetch-client";

export function useItems(workId?: number) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchItems = useCallback(
    async (page = 1, limit = 1000) => {
      if (!workId) return;
      setLoading(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
        const res = await fetchClient(
          `${baseUrl}/api/items?workId=${workId}&page=${page}&limit=${limit}`,
        );
        if (!res.ok) throw new Error(`Error fetching items: ${res.status}`);

        type ItemsResponse = {
          success: boolean;
          data?: {
            items?: Item[];
            pagination?: {
              total: number;
              page: number;
              limit: number;
              totalPages: number;
            };
          };
        };

        const json: ItemsResponse = await res.json();
        const incoming = json?.data?.items ?? [];
        setItems(incoming);
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudieron cargar los ítems");
      } finally {
        setLoading(false);
      }
    },
    [workId, baseUrl],
  );

  const createItem = useCallback(
    async (payload: Record<string, any>) => {
      setSubmitting(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");

        // Solo enviamos los campos que acepta el endpoint POST /api/items
        const body: Record<string, unknown> = {
          workId: payload.workId,
          description: payload.description,
        };
        if (payload.contractorId !== undefined) body.contractorId = payload.contractorId ?? null;
        if (payload.estimatedExecutionTime !== undefined) body.estimatedExecutionTime = payload.estimatedExecutionTime ?? null;
        if (payload.active !== undefined) body.active = payload.active;
        if (payload.title !== undefined) body.title = payload.title ?? null;

        const res = await fetchClient(`${baseUrl}/api/items`, {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(`Error creating item: ${res.status} ${text ?? ""}`);
        }
        const json = await res.json();
        const created: Item = json?.data ?? json?.item ?? json;
        setItems((prev) => [created, ...prev]);
        toast.success("Ítem creado correctamente.");
        return created;
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo crear el ítem");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [baseUrl, toast],
  );

  const getItem = useCallback(
    async (id: number) => {
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
        const res = await fetchClient(`${baseUrl}/api/items/${id}`);
        if (!res.ok) throw new Error(`Error fetching item: ${res.status}`);

        type ItemResponse = {
          success: boolean;
          data?: { item?: Item } | Item;
        };

        const json: ItemResponse = await res.json();
        if (json?.data && "item" in json.data && json.data.item) {
          return json.data.item;
        }
        return json?.data ?? json;
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo cargar el ítem");
        throw err;
      }
    },
    [baseUrl, toast],
  );

  const updateItem = useCallback(
    async (id: number | string, payload: Record<string, any>) => {
      setSubmitting(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");

        // Solo enviamos los campos que acepta el endpoint PUT /api/items/:id
        const body: Record<string, unknown> = {};
        if (payload.description !== undefined) body.description = payload.description;
        if (payload.contractorId !== undefined) body.contractorId = payload.contractorId ?? null;
        if (payload.estimatedExecutionTime !== undefined) body.estimatedExecutionTime = payload.estimatedExecutionTime ?? null;
        if (payload.active !== undefined) body.active = payload.active;
        if (payload.title !== undefined) body.title = payload.title ?? null;

        const res = await fetchClient(`${baseUrl}/api/items/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(`Error updating item: ${res.status} ${text ?? ""}`);
        }
        const json = await res.json();
        const updated: Item = json?.data ?? json?.item ?? json;
        setItems((prev) =>
          prev.map((it) => (it.id === updated.id ? updated : it)),
        );
        toast.success("Ítem actualizado correctamente.");
        return updated;
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo actualizar el ítem");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [baseUrl, toast],
  );

  const toggleActive = useCallback(
    async (id: number | string, active: boolean) => {
      return updateItem(id, { active });
    },
    [updateItem],
  );

  const reorderItems = useCallback(
    async (payload: { id: number; sortOrder: number }[]) => {
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
        const res = await fetchClient(`${baseUrl}/api/items/reorder`, {
          method: "PATCH",
          body: JSON.stringify({ items: payload }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(`Error reordering items: ${res.status} ${text ?? ""}`);
        }
        setItems((prev) => {
          const orderMap = new Map(payload.map(({ id, sortOrder }) => [id, sortOrder]));
          return [...prev].sort((a, b) => {
            const sa = orderMap.get(a.id) ?? a.sortOrder ?? 0;
            const sb = orderMap.get(b.id) ?? b.sortOrder ?? 0;
            return sa - sb;
          });
        });
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo guardar el orden");
        throw err;
      }
    },
    [baseUrl],
  );

  const deleteItem = useCallback(
    async (id: number | string) => {
      setSubmitting(true);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
        const res = await fetchClient(`${baseUrl}/api/items/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(`Error deleting item: ${res.status} ${text ?? ""}`);
        }
        setItems((prev) => prev.filter((it) => it.id !== Number(id)));
        toast.success("Ítem eliminado correctamente.");
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo eliminar el ítem");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [baseUrl, toast],
  );

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  return {
    items,
    setItems,
    loading,
    submitting,
    fetchItems,
    createItem,
    getItem,
    updateItem,
    toggleActive,
    deleteItem,
    reorderItems,
  };
}
