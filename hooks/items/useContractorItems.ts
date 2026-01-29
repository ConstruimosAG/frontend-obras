"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Item } from "@/lib/types";

export function useContractorItems(contractorId?: number) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchContractorItems = useCallback(
    async (page = 1, limit = 1000) => {
      if (!contractorId) return;
      setLoading(true);
      setError(null);
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
        const res = await fetch(
          `${baseUrl}/api/items?contractorId=${contractorId}&page=${page}&limit=${limit}`,
          {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          },
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
        const message = err?.message ?? "No se pudieron cargar los ítems";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [contractorId, baseUrl],
  );

  const getItem = useCallback(
    async (id: number) => {
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
        const res = await fetch(`${baseUrl}/api/items/${id}`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
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
    [baseUrl],
  );

  useEffect(() => {
    void fetchContractorItems();
  }, [fetchContractorItems]);

  return {
    items,
    setItems,
    loading,
    error,
    fetchContractorItems,
    getItem,
  };
}
