import { useLeads, useMoveLead } from '@/hooks/useLeads';
import { KanbanColumn } from './KanbanColumn';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import LeadCreateModal from './LeadCreateModal';
import LeadLossReasonModal from './LeadLossReasonModal';
import { DndContext } from '@dnd-kit/core';

const STATUS = [
  'novo',
  'em_negociacao',
  'proposta_enviada',
  'preparando_publicacao',
  'leads_perdidos'
];

const statusLabels = {
  novo: 'Novo',
  em_negociacao: 'Em negociação',
  proposta_enviada: 'Proposta enviada',
  preparando_publicacao: 'Preparando Publicação',
  leads_perdidos: 'Leads Perdidos'
};

export default function LeadKanbanBoard() {
  const { data } = useLeads({ search: '', status: 'Todos', page: 1, perPage: 100 });
  const leads = data?.data || [];
  const [open, setOpen] = useState(false);
  const [lostModal, setLostModal] = useState({ open: false, lead: null });
  const moveLead = useMoveLead();

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id && over.id && active.id !== over.id) {
      const leadId = active.id.replace('lead-', '');
      const newStatus = over.id.replace('column-', '');
      if (newStatus === 'leads_perdidos') {
        const lead = leads.find((l) => l.id === parseInt(leadId));
        setLostModal({ open: true, lead });
        return;
      }
      moveLead.mutate({ id: leadId, status: newStatus });
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-[#B70F0A]">Leads por Etapa</h1>
        <Button onClick={() => setOpen(true)} className="bg-[#B70F0A] text-white rounded-2xl px-4 py-2 shadow">
          Novo Lead
        </Button>
      </div>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
          {STATUS.map((status) => (
            <KanbanColumn
              key={status}
              id={`column-${status}`}
              title={`${statusLabels[status]} (${leads.filter((l) => l.status === status).length})`}
              leads={leads.filter((lead) => lead.status === status)}
            />
          ))}
        </div>
      </DndContext>
      <LeadCreateModal open={open} onClose={() => setOpen(false)} />

<LeadLossReasonModal
  open={lostModal.open}
  onClose={() => setLostModal({ open: false, lead: null })}
  lead={lostModal.lead}
/>

    </div>
  );
}
