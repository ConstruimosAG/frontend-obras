import { WorksPanel } from "@/components/coordinator/works-panel";

export default function CoordinatorPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <WorksPanel />
      </div>
    </main>
  );
}
