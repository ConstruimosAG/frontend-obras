"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkCard } from "./work-card";
import { WorkModal } from "./work-modal";
import { ConfirmModal } from "./confirm-modal";
import type { Work } from "@/lib/types";
import { useWorks } from "@/hooks/work/useWorks";
import { useUsers } from "@/hooks/users/useUsers";
import { Loader2 } from "lucide-react";

export function WorksPanel({ coordinator = true, path = "admin" }: { coordinator?: boolean, path?: string }) {
  const router = useRouter();
  const { works, loading, submitting, createWork, updateWork, deleteWork } = useWorks();
  const { currentUser, getCurrentUser } = useUsers();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [deletingWorkId, setDeletingWorkId] = useState<string | number | null>(null);

  useEffect(() => {
    void getCurrentUser();
  }, [getCurrentUser]);

  const isAdmin = currentUser?.role === "administrative_assistant";

  const filteredWorks = useMemo(() => {
    if (!searchTerm.trim()) return works;
    const term = searchTerm.toLowerCase();
    return works.filter((work: Work) =>
      String(work.code).toLowerCase().includes(term),
    );
  }, [works, searchTerm]);

  const handleCreateWork = () => {
    setEditingWork(null);
    setModalOpen(true);
  };

  const handleEditWork = (work: Work) => {
    setEditingWork(work);
    setModalOpen(true);
  };

  const handleDeleteClick = (workId: string | number) => {
    setDeletingWorkId(workId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingWorkId) {
      await deleteWork(deletingWorkId);
      setDeleteModalOpen(false);
      setDeletingWorkId(null);
    }
  };

  const handleWorkClick = (workId: string | number) => {
    coordinator ? router.push(`/coordinator/works/${workId}`) : router.push(`/${path}/works/${workId}`);
  };

  const handleSubmit = async (data: {
    code?: string;
    quotationDeadline: string;
    finalized?: boolean;
  }) => {
    let result;
    if (editingWork) {
      // update
      result = await updateWork(editingWork.id, {
        code: data.code,
        quotationDeadline: data.quotationDeadline,
        finalized: data.finalized,
      });
    } else {
      // create
      result = await createWork({
        code: data.code!,
        quotationDeadline: data.quotationDeadline,
      });
    }
    return result.success;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Panel de Obras
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Gestiona las obras. Haz clic en una
          obra para ver sus ítems.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 items-center">
          {coordinator && (<Button
            onClick={handleCreateWork}
            className="w-full sm:w-auto bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear Obra
          </Button>)}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin h-4 w-4" />
              Cargando...
            </div>
          )}
        </div>
      </div>

      {(() => {
        const unfinalized = filteredWorks.filter(work => {
          const items = work.items || [];
          if (items.length === 0) return true;
          const finalizedItems = items.filter(item => 
            item.quoteItems?.some(qi => Number(qi.totalContractor) > 0 && Number(qi.subtotal) > 0)
          ).length;
          return finalizedItems < items.length;
        });

        const finalized = filteredWorks.filter(work => {
          const items = work.items || [];
          if (items.length === 0) return false;
          const finalizedItems = items.filter(item => 
            item.quoteItems?.some(qi => Number(qi.totalContractor) > 0 && Number(qi.subtotal) > 0)
          ).length;
          return finalizedItems === items.length;
        });

        if (filteredWorks.length === 0) {
          return (
            <div className="text-center py-8 sm:py-12 text-muted-foreground">
              {searchTerm ? (
                <p>No se encontraron obras que coincidan con "{searchTerm}"</p>
              ) : loading ? (
                <p>Cargando obras...</p>
              ) : (
                <p>No hay obras registradas. Crea una nueva para comenzar.</p>
              )}
            </div>
          );
        }

        return (
          <div className="space-y-8">
            {unfinalized.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">Obras no finalizadas</h2>
                  <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {unfinalized.length}
                  </span>
                </div>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {unfinalized.map((work: Work) => {
                    const items = work.items || [];
                    const finalizedItems = items.filter(item => 
                      item.quoteItems?.some(qi => Number(qi.totalContractor) > 0 && Number(qi.subtotal) > 0)
                    ).length;
                    const missing = items.length - finalizedItems;
                    
                    return (
                      <div key={work.id} className="relative group">
                        <WorkCard
                          work={work}
                          onEdit={(isAdmin || !work.finalized) ? handleEditWork : undefined}
                          onDelete={isAdmin ? () => handleDeleteClick(work.id) : undefined}
                          onClick={() => handleWorkClick(work.id)}
                        />
                        {!coordinator && (
                          <div className="absolute top-2 right-2 pointer-events-none">
                            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                              Faltan {missing} {missing === 1 ? 'ítem' : 'ítems'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {finalized.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">Obras finalizadas</h2>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {finalized.length}
                  </span>
                </div>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {finalized.map((work: Work) => (
                    <div key={work.id} className="relative group">
                      <WorkCard
                        work={work}
                        onEdit={(isAdmin || !work.finalized) ? handleEditWork : undefined}
                        onDelete={isAdmin ? () => handleDeleteClick(work.id) : undefined}
                        onClick={() => handleWorkClick(work.id)}
                      />
                      {!coordinator && (
                        <div className="absolute top-2 right-2 pointer-events-none">
                          <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                            Finalizada
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      <WorkModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        work={editingWork}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        isAdmin={isAdmin}
      />

      <ConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Eliminar Obra"
        description="¿Estás seguro de que deseas eliminar esta obra? Esta acción no se puede deshacer."
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
