"use client";

import { useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { ContractorItemsTable } from "@/components/contractor/contractor-items-table";
import { useUsers } from "@/hooks/users/useUsers";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Item } from "@/lib/types";

interface PageProps {
  params: Promise<{ workId: string }>;
}

export default function ContractorWorkItemsPage({ params }: PageProps) {
  const { workId: workIdStr } = use(params);
  const workId = Number(workIdStr);
  const router = useRouter();
  const { currentUser, getCurrentUser, loading: userLoading } = useUsers();

  useEffect(() => {
    // Solo redirigir si no estamos cargando y realmente no hay usuario
    if (!userLoading && !currentUser) {
      router.push("/");
    }
  }, [currentUser, userLoading, router]);

  const { filteredItems, workCode } = useMemo(() => {
    if (!currentUser?.items) return { filteredItems: [], workCode: "" };
    
    const items = currentUser.items.filter((item: Item) => item.workId === workId);
    const code = items.length > 0 ? items[0].work?.code : `Obra #${workId}`;
    
    return { filteredItems: items, workCode: code };
  }, [currentUser, workId]);

  if (userLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-purple-500" />
            <p className="text-muted-foreground">Cargando ítems de la obra...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!currentUser) return null;

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/contractor")}
            className="mb-4 -ml-2 text-muted-foreground hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a mis obras
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {workCode}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Gestiona tus ítems y cotizaciones para esta obra.
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-lg border border-purple-200 dark:border-purple-800 self-start sm:self-center">
              <span className="text-sm text-purple-800 dark:text-purple-300 font-bold">
                {filteredItems.length} {filteredItems.length === 1 ? "ítem asignado" : "ítems asignados"}
              </span>
            </div>
          </div>
        </div>

        <ContractorItemsTable
          items={filteredItems}
          user={currentUser}
          loading={false}
          contractorName={currentUser?.name}
          currentUserId={currentUser?.id}
        />
      </div>
    </main>
  );
}
