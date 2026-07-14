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
        className="bg-white rounded-xl p-0 shadow overflow-hidden flex flex-col cursor-move"
      >
        {lead.foto_fachada && (
          <div 
            className="w-full h-24 bg-gray-100 cursor-pointer relative group"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setOpenImage(true); }}
          >
            <img src={lead.foto_fachada} alt="Fachada" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <ImageIcon className="text-white opacity-0 group-hover:opacity-100 w-6 h-6" />
            </div>
          </div>
        )}
        <div className="p-3 flex flex-col gap-1">
          <div className="flex justify-between items-center" {...listeners} {...attributes}>
            <span className="font-bold text-sm">{lead.nome}</span>
          </div>
          <p className="text-xs text-gray-500">{lead.origem} - {lead.responsavel}</p>
          <div className="flex gap-2 mt-1 relative z-10" onPointerDown={(e) => e.stopPropagation()}>
            <button className="text-green-600 p-1.5 bg-green-50 hover:bg-green-100 rounded-lg transition"><Phone size={16} /></button>
            <button className="text-blue-600 p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition" onClick={(e) => { e.stopPropagation(); setOpen(true); }}><Edit size={16} /></button>
          </div>
          
          {lead.status === 'preparando_publicacao' && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); handleConvertToClient(); }}
              className="mt-2 text-xs text-[#B70F0A] border border-[#B70F0A] px-2 py-1.5 rounded-lg hover:bg-[#B70F0A] hover:text-white transition font-bold"
            >
              Converter para Cliente
            </button>
          )}
        </div>
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
