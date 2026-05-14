"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { ItemDetails } from "@/components/coordinator/item-details";
import { useContractorItems } from "@/hooks/items/useContractorItems";
import { useUsers } from "@/hooks/users/useUsers";
import { useWorks } from "@/hooks/work/useWorks";
import { Loader2 } from "lucide-react";

interface ContractorItemDetailPageProps {
  params: Promise<{ itemId: string }>;
}

export default function ContractorItemDetailPage({
  params,
}: ContractorItemDetailPageProps) {
  const { itemId } = use(params);
  const router = useRouter();
  const numericItemId = Number.parseInt(itemId);

  const { currentUser, loading: userLoading } = useUsers();
  const { getItem } = useContractorItems();
  const { works, loading: worksLoading } = useWorks();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const fetchedItem = await getItem(numericItemId) as any;
        
        // Verificación básica de seguridad
        if (fetchedItem && currentUser && fetchedItem.contractorId !== currentUser.id) {
          router.push("/contractor");
          return;
        }
        
        setItem(fetchedItem);
      } catch (err: any) {
        console.error("Error fetching item:", err);
        setError(err.message || "Error al cargar el ítem");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && !userLoading && !item) {
      void fetchItem();
    }
  }, [currentUser, userLoading, numericItemId, getItem, router, item]);

  // Redirección si no hay usuario una vez terminada la carga
  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.push("/");
    }
  }, [currentUser, userLoading, router]);

  if (userLoading || loading || worksLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-purple-500" />
            <p className="text-muted-foreground">Cargando detalles del ítem...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 text-center">
          <p className="text-destructive font-bold">{error}</p>
          <button onClick={() => router.push("/contractor")} className="mt-4 text-purple-600 underline">
            Volver al panel
          </button>
        </div>
      </main>
    );
  }

  if (!item || !currentUser) {
    return null;
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

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <ItemDetails
          work={work}
          item={item}
          backUrl="/contractor"
          backLabel="Volver a mis obras"
        />
      </div>
    </main>
  );
}
