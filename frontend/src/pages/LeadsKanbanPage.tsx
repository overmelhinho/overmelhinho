import LeadKanbanBoard from '@/components/kanban/LeadKanbanBoard';

export default function LeadsKanbanPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Kanban de Leads</h1>
      <LeadKanbanBoard />
    </div>
  );
}
