import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { useUpdateLead } from "@/hooks/useLeads";
import { Button } from "@/components/ui/button";
import Textarea from "@/components/ui/textarea";


export default function LeadLossReasonModal({ open, onClose, lead }) {
  const [motivo, setMotivo] = useState("");
  const updateLead = useUpdateLead();

  const handleSubmit = async () => {
    if (!motivo.trim()) return;

    await updateLead.mutateAsync({
      ...lead,
      status: "leads_perdidos",
      motivo_perda: motivo
    });

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-xl p-6 shadow-xl w-full max-w-md">
          <Dialog.Title className="text-lg font-semibold mb-2 text-[#B70F0A]">
            Motivo da Perda do Lead
          </Dialog.Title>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Descreva o motivo pelo qual o lead foi perdido..."
            rows={4}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="bg-[#B70F0A] text-white" onClick={handleSubmit}>
              Salvar
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
