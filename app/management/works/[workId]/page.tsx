"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { ItemsTable } from "@/components/coordinator/items-table";
import { useWorks } from "@/hooks/work/useWorks";

interface WorkDetailPageProps {
  params: Promise<{ workId: string }>;
}

export default function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { workId } = use(params);
  const numericWorkId = Number.parseInt(workId);

  const { works, loading, error } = useWorks();

  const work = works.find((w) => w.id === numericWorkId);

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <p className="text-center text-destructive">{error}</p>
        </div>
      </main>
    );
  } 

  if (loading || !work) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <p className="text-center text-muted-foreground">Cargando obra…</p>
        </div>
      </main>
    );
  }

  if (!loading && !work) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <ItemsTable work={work} coordinator={false} path="management" management={true} />
      </div>
    </main>
  );
}
