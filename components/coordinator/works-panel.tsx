"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkCard } from "./work-card";
import { WorkModal } from "./work-modal";
import { mockWorks } from "@/lib/mock-data";
import type { Work } from "@/lib/types";

export function WorksPanel() {
  const router = useRouter();
  const [works, setWorks] = useState<Work[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);

  const filteredWorks = useMemo(() => {
    if (!searchTerm.trim()) return works;
    const term = searchTerm.toLowerCase();
    return works.filter((work) => work.code.toLowerCase().includes(term));
  }, [works, searchTerm]);

  const handleCreateWork = () => {
    setEditingWork(null);
    setModalOpen(true);
  };

  const handleEditWork = (work: Work) => {
    setEditingWork(work);
    setModalOpen(true);
  };

  const handleWorkClick = (workId: string) => {
    router.push(`/coordinator/works/${workId}`);
  };

  const handleSubmit = (data: {
    code?: string;
    quotationDeadline: string;
    finalized?: boolean;
  }) => {
    if (editingWork) {
      setWorks((prev) =>
        prev.map((w) =>
          w.id === editingWork.id
            ? {
                ...w,
                quotationDeadline: new Date(data.quotationDeadline),
                finalized: data.finalized ?? w.finalized,
                updatedAt: new Date(),
              }
            : w
        )
      );
    } else {
      const newWork: Work = {
        id: Date.now(),
        code: data.code!,
        finalized: false,
        quotationDeadline: new Date(data.quotationDeadline),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setWorks((prev) => [newWork, ...prev]);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Panel de Obras
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Gestiona las obras para el coordinador del proyecto. Haz clic en una
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
        <Button
          onClick={handleCreateWork}
          className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4" />
          Crear Obra
        </Button>
      </div>

      {filteredWorks.length > 0 ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredWorks.map((work) => (
            <WorkCard
              key={work.id}
              work={work}
              onEdit={handleEditWork}
              onClick={handleWorkClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12 text-muted-foreground">
          {searchTerm ? (
            <p>No se encontraron obras que coincidan con "{searchTerm}"</p>
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
      />
    </div>
  );
}
