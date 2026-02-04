"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ContractorItemsTable } from "@/components/contractor/contractor-items-table";
import { useUsers } from "@/hooks/users/useUsers";

export default function ContractorPage() {
  const router = useRouter();
  const { currentUser, getCurrentUser, loading: userLoading } = useUsers();

  useEffect(() => {
    void getCurrentUser();
  }, [getCurrentUser]);

  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.push("/");
    }
  }, [currentUser, userLoading, router]);

  if (userLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="text-center py-8 sm:py-12 text-muted-foreground">
            <p>Cargando ítems asignados...</p>
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
        <ContractorItemsTable
          items={currentUser?.items ?? []}
          user={currentUser}
          loading={false}
          contractorName={currentUser?.identifier}
          currentUserId={currentUser?.id}
        />
      </div>
    </main>
  );
}