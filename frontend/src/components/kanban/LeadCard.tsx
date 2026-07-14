// src/components/kanban/LeadCard.tsx
import { Phone, Edit, Image as ImageIcon } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LeadEditModal from './LeadEditModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function LeadCard({ lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lead-${lead.id}`
  });

  const [open, setOpen] = useState(false);
  const [openImage, setOpenImage] = useState(false);
  const navigate = useNavigate();

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1
  };

  const handleConvertToClient = () => {
    navigate(`/clientes/novo/${lead.id}`);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white rounded-xl p-3 shadow flex flex-col gap-1 cursor-move"
      >
        <div className="flex justify-between items-center" {...listeners} {...attributes}>
          <div className="flex items-center gap-2">
            {lead.foto_fachada && (
              <div 
                className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0 cursor-pointer relative z-10"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setOpenImage(true); }}
              >
                <img src={lead.foto_fachada} alt="Fachada" className="w-full h-full object-cover" />
              </div>
            )}
            <span className="font-bold text-sm">{lead.nome}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">{lead.origem} - {lead.responsavel}</p>
        <div className="flex gap-2 mt-1">
          <button className="text-green-600"><Phone size={16} /></button>
          <button className="text-blue-600" onClick={() => setOpen(true)}><Edit size={16} /></button>
        </div>

        {lead.status === 'preparando_publicacao' && (
          <button
            onClick={handleConvertToClient}
            className="mt-2 text-xs text-[#B70F0A] border border-[#B70F0A] px-2 py-1 rounded hover:bg-[#B70F0A] hover:text-white transition"
          >
            Converter para Cliente
          </button>
        )}
      </div>

      <LeadEditModal open={open} onClose={() => setOpen(false)} lead={lead} />

      {/* Modal da Foto de Fachada */}
      <Dialog open={openImage} onOpenChange={setOpenImage}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-black border-none rounded-xl">
          <div className="relative w-full h-[70vh] flex items-center justify-center">
            {lead.foto_fachada ? (
              <img src={lead.foto_fachada} alt="Fachada" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-white">Nenhuma foto disponível</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
