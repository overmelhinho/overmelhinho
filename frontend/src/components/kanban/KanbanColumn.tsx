import { useDroppable } from '@dnd-kit/core';
import { LeadCard } from './LeadCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function KanbanColumn({ id, title, leads }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const navigate = useNavigate();

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-100 rounded-2xl p-2 shadow-md min-h-[200px] transition-colors ${
        isOver ? 'bg-yellow-100' : ''
      }`}
    >
      <h2 className="text-lg font-semibold text-center mb-2 text-[#B70F0A]">{title}</h2>
      <div className="space-y-2">
        {leads.map((lead) => (
          <div key={lead.id}>
            <LeadCard lead={lead} />
          </div>
        ))}
      </div>
    </div>
  );
}
