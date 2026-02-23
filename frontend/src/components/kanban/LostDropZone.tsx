import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';

export default function LostDropZone() {
    const { setNodeRef, isOver } = useDroppable({
        id: 'column-perdido',
    });

    return (
        <div
            ref={setNodeRef}
            className={`mt-8 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${isOver
                    ? 'bg-red-50 border-red-500 scale-105'
                    : 'bg-gray-50 border-gray-300 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                }`}
        >
            <Trash2 className={`w-10 h-10 mb-2 ${isOver ? 'text-red-600 animate-bounce' : 'text-gray-400'}`} />
            <span className={`font-semibold ${isOver ? 'text-red-700' : 'text-gray-500'}`}>
                Arraste aqui para marcar como "Perdido"
            </span>
            <p className="text-xs text-gray-400 mt-1 text-center">
                Isso removerá o lead da visão ativa e solicitará o motivo.
            </p>
        </div>
    );
}
