// src/components/kanban/LostLeadModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useUpdateLead } from '@/hooks/useLeads';

interface LostLeadModalProps {
  open: boolean;
  onClose: () => void;
  lead: any;
}

export default function LostLeadModal({ open, onClose, lead }: LostLeadModalProps) {
  const [motivo, setMotivo] = useState('');
  const updateLead = useUpdateLead();

  const handleSubmit = () => {
    if (!motivo.trim()) return alert('Informe o motivo da perda.');
    updateLead.mutate({ id: lead.id, status: 'leads_perdidos', motivo_perda: motivo });
    onClose();
    setMotivo('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[#B70F0A]">Motivo da Perda</DialogTitle>
        </DialogHeader>
        <textarea
          className="w-full border rounded p-2"
          placeholder="Descreva o motivo pelo qual este lead foi perdido"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={4}
        />
        <div className="flex justify-end mt-4">
          <Button className="bg-[#B70F0A] text-white" onClick={handleSubmit}>
            Salvar Motivo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
