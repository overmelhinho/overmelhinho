import { useLeads, useMoveLead } from '@/hooks/useLeads';
import { KanbanColumn } from './KanbanColumn';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import LeadCreateModal from './LeadCreateModal';
import LeadLossReasonModal from './LeadLossReasonModal';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import LostDropZone from './LostDropZone';

const STATUS = [
  'novo',
  'em_contato',
  'qualificado',
  'proposta_enviada',
  'preparando_publicacao'
];

const statusLabels = {
  novo: 'Novo',
  em_contato: 'Em negociação',
  qualificado: 'Qualificado',
  proposta_enviada: 'Proposta enviada',
  preparando_publicacao: 'Preparando Publicação'
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
      const leadId = String(active.id).replace('lead-', '');
      const newStatus = String(over.id).replace('column-', '');

      if (newStatus === 'perdido') {
        const lead = leads.find((l) => l.id === parseInt(leadId));
        setLostModal({ open: true, lead });
        return;
      }

      // Se arrastar para um lugar que não seja coluna (improvável por dnd-kit, mas bom checar)
      if (!STATUS.includes(newStatus)) return;

      moveLead.mutate({ id: leadId, status: newStatus });
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-[#B70F0A]">Leads por Etapa</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => window.location.href = '/leads?status=perdido'}
            variant="outline"
            className="border-[#B70F0A] text-[#B70F0A] rounded-2xl px-4 py-2"
          >
            Ver Leads Perdidos ({leads.filter(l => l.status === 'perdido').length})
          </Button>
          <Button onClick={() => setOpen(true)} className="bg-[#B70F0A] text-white rounded-2xl px-4 py-2 shadow">
            Novo Lead
          </Button>
        </div>
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

        <LostDropZone />
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
