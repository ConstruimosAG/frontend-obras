"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { ItemDetails } from "@/components/coordinator/item-details";
import { useContractorItems } from "@/hooks/items/useContractorItems";
import { useUsers } from "@/hooks/users/useUsers";
import { useWorks } from "@/hooks/work/useWorks";

interface ContractorItemDetailPageProps {
  params: Promise<{ itemId: string }>;
}

export default function ContractorItemDetailPage({
  params,
}: ContractorItemDetailPageProps) {
  const { itemId } = use(params);
  const router = useRouter();
  const numericItemId = Number.parseInt(itemId);

  const { currentUser, getCurrentUser, loading: userLoading } = useUsers();
  const { getItem, loading: itemLoading } = useContractorItems();
  const { works, loading: worksLoading } = useWorks();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getCurrentUser();
  }, [getCurrentUser]);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const fetchedItem = await getItem(numericItemId);
        // Verify the item belongs to the current contractor
        if ((fetchedItem as any).contractorId !== currentUser?.id) {
          router.push("/contractor");
          return;
        }
        
        setItem(fetchedItem);
      } catch (error) {
        console.error("Error fetching item:", error);
        router.push("/contractor");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && !userLoading) {
      void fetchItem();
    }
  }, [currentUser, userLoading, numericItemId, getItem, router]);

  if (userLoading || itemLoading || worksLoading || loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="text-center py-8 sm:py-12 text-muted-foreground">
            <p>Cargando detalles del ítem...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!item || !currentUser) {
    notFound();
  }

  const work = works.find((w) => w.id === item.workId);

  if (!work) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="text-center py-8 sm:py-12 text-destructive">
            <p>No se pudo encontrar la obra asociada a este ítem.</p>
          </div>
        </div>
      </main>
    );
  }

  if (!userLoading && !currentUser) {
    router.push("/");
    return;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <ItemDetails
          work={work}
          item={item}
          backUrl="/contractor"
          backLabel="Volver a mis ítems"
        />
      </div>
    </main>
  );
}
