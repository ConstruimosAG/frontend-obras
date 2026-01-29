"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkCard } from "./work-card";
import { WorkModal } from "./work-modal";
import type { Work } from "@/lib/types";
import { useWorks } from "@/hooks/work/useWorks";
import { Loader2 } from "lucide-react";

export function WorksPanel({ coordinator = true, path = "admin" }: { coordinator?: boolean, path?: string }) {
  const router = useRouter();
  const { works, loading, submitting, createWork, updateWork } = useWorks();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);

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

  const handleWorkClick = (workId: string | number) => {
    coordinator ? router.push(`/coordinator/works/${workId}`) : router.push(`/${path}/works/${workId}`);
  };

  const handleSubmit = async (data: {
    code?: string;
    quotationDeadline: string;
    finalized?: boolean;
  }) => {
    if (editingWork) {
      // update
      await updateWork(editingWork.id, {
        quotationDeadline: data.quotationDeadline,
        finalized: data.finalized,
      });
    } else {
      // create
      await createWork({
        code: data.code!,
        quotationDeadline: data.quotationDeadline,
      });
    }
    // cerrar modal lo hace el WorkModal después del await
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
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
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

      {filteredWorks.length > 0 ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredWorks.map((work: Work) => (
            <WorkCard
              key={work.id}
              work={work}
              onEdit={handleEditWork}
              onClick={() => handleWorkClick(work.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12 text-muted-foreground">
          {searchTerm ? (
            <p>No se encontraron obras que coincidan con "{searchTerm}"</p>
          ) : loading ? (
            <p>Cargando obras...</p>
          ) : (
            <p>No hay obras registradas. Crea una nueva para comenzar.</p>
          )}
        </div>
      )}

      <WorkModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        work={editingWork}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
      />
    </div>
  );
}
