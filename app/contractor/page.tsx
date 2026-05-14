"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUsers } from "@/hooks/users/useUsers";
import { WorkCard } from "@/components/coordinator/work-card";
import { Briefcase, Loader2 } from "lucide-react";
import type { Work, Item } from "@/lib/types";

export default function ContractorPage() {
  const router = useRouter();
  const { currentUser, getCurrentUser, loading: userLoading } = useUsers();

  useEffect(() => {
    // Solo redirigir si no estamos cargando y realmente no hay usuario
    if (!userLoading && !currentUser) {
      router.push("/");
    }
  }, [currentUser, userLoading, router]);

  const worksData = useMemo(() => {
    if (!currentUser?.items) return [];
    
    const workMap = new Map<number, { work: Work; assignedItems: Item[] }>();
    
    currentUser.items.forEach((item: Item) => {
      const w = item.work;
      if (!w) return;
      
      if (!workMap.has(w.id)) {
        workMap.set(w.id, {
          work: w,
          assignedItems: []
        });
      }
      
      workMap.get(w.id)!.assignedItems.push(item);
    });
    
    return Array.from(workMap.values()).sort((a, b) => 
      new Date(b.work.createdAt).getTime() - new Date(a.work.createdAt).getTime()
    );
  }, [currentUser]);

  if (userLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-purple-500" />
            <p className="text-muted-foreground">Cargando tus obras...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="text-center py-8 sm:py-12 text-destructive">
            <p>Error al cargar la información. Por favor, inicia sesión.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Mis Obras Asignadas
          </h1>
          <p className="text-muted-foreground">
            Bienvenido, {currentUser.name}. Selecciona una obra para ver tus ítems asignados.
          </p>
        </div>

        {worksData.length > 0 ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {worksData.map(({ work, assignedItems }) => {
              // Preparamos una versión del work que solo tenga los ítems del contratista
              // para que el WorkCard muestre el conteo correcto
              const displayWork = {
                ...work,
                items: assignedItems
              };
              
              return (
                <WorkCard
                  key={work.id}
                  work={displayWork}
                  onClick={() => router.push(`/contractor/works/${work.id}`)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-bold">No tienes obras asignadas</h3>
            <p className="text-muted-foreground">Cuando se te asigne un ítem en una obra, aparecerá aquí.</p>
          </div>
        )}
      </div>
    </main>
  );
}