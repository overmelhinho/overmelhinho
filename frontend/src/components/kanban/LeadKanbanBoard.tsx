import { useLeads, useMoveLead } from '@/hooks/useLeads';
import { useLeadsStats } from '@/hooks/useLeadsStats';
import { useNavigate } from 'react-router-dom';
import { KanbanColumn } from './KanbanColumn';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import LeadCreateModal from './LeadCreateModal';
import LeadLossReasonModal from './LeadLossReasonModal';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import LostDropZone from './LostDropZone';
import { RotateCcw, ListFilter, Plus } from 'lucide-react';

const STATUS = [
  'novo',
  'qualificado',
  'proposta_enviada',
  'em_contato',
  'preparando_publicacao'
];

const statusLabels = {
  novo: 'Novo',
  qualificado: 'Qualificado',
  proposta_enviada: 'Proposta enviada',
  em_contato: 'Em negociação',
  preparando_publicacao: 'Preparando publicações'
};

export default function LeadKanbanBoard() {
  const { data } = useLeads({ search: '', status: 'Todos', page: 1, perPage: 100 });
  const leads = data?.data || [];
  const navigate = useNavigate();
  const { data: stats } = useLeadsStats();
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
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-[#B70F0A]">Leads por Etapa</h1>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button
            onClick={() => navigate('/leads?status=recuperaveis')}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-2xl px-4 py-2 flex items-center gap-1.5 shadow-xs font-semibold text-sm flex-1 md:flex-none"
          >
            <RotateCcw className="w-4 h-4" />
            Recuperação de Leads {stats?.recuperaveis_mes ? `(${stats.recuperaveis_mes})` : ''}
          </Button>
          <Button
            onClick={() => navigate('/leads')}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-2xl px-4 py-2 flex items-center gap-1.5 text-sm flex-1 md:flex-none"
          >
            <ListFilter className="w-4 h-4" />
            Tabela Completa
          </Button>
          <Button onClick={() => setOpen(true)} className="bg-[#B70F0A] hover:bg-[#990c08] text-white rounded-2xl px-4 py-2 shadow flex items-center gap-1 text-sm flex-1 md:flex-none">
            <Plus className="w-4 h-4" />
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
