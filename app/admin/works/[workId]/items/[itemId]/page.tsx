"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { ItemDetails } from "@/components/coordinator/item-details";
import { useWorks } from "@/hooks/work/useWorks";
import { useItems } from "@/hooks/items/useItems";

interface ItemDetailPageProps {
  params: Promise<{ workId: string; itemId: string }>;
}

export default function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { workId, itemId } = use(params);

  const numericWorkId = Number.parseInt(workId);
  const numericItemId = Number.parseInt(itemId);

  const { works, loading: loadingWorks } = useWorks();
  const { items, loading: loadingItems } = useItems(numericWorkId);

  const work = works.find((w) => w.id === numericWorkId);
  const item = items.find((it) => it.id === numericItemId);

  if (loadingWorks || loadingItems || !work || !item) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <p className="text-center text-muted-foreground">
            Cargando detalles del ítem…
          </p>
        </div>
      </main>
    );
  }

  if (
    !loadingWorks &&
    !loadingItems &&
    (!work || !item || item.workId !== work.id)
  ) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <ItemDetails work={work} item={item} backUrl={`/admin/works/${work.id}`} />
      </div>
    </main>
  );
}
