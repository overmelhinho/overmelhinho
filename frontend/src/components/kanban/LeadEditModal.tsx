import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useUpdateLead } from '@/hooks/useLeads';

export default function LeadEditModal({ open, onClose, lead }) {
  const updateLead = useUpdateLead();

  const formik = useFormik({
    initialValues: {
      nome: lead?.nome || '',
      email: lead?.email || '',
      telefone: lead?.telefone || '',
      origem: lead?.origem || '',
      responsavel: lead?.responsavel || '',
      observacoes: lead?.observacoes || '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      nome: Yup.string().required('Nome é obrigatório'),
    }),
    onSubmit: async (values) => {
      await updateLead.mutateAsync({ ...lead, ...values });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="space-y-3">
          <Input
            name="nome"
            placeholder="Nome"
            value={formik.values.nome}
            onChange={formik.handleChange}
          />
          <Input
            name="email"
            placeholder="Email"
            value={formik.values.email}
            onChange={formik.handleChange}
          />
          <Input
            name="telefone"
            placeholder="Telefone"
            value={formik.values.telefone}
            onChange={formik.handleChange}
          />
          <Input
            name="origem"
            placeholder="Origem"
            value={formik.values.origem}
            onChange={formik.handleChange}
          />
          <Input
            name="responsavel"
            placeholder="Responsável"
            value={formik.values.responsavel}
            onChange={formik.handleChange}
          />
          <Input
            name="observacoes"
            placeholder="Observações"
            value={formik.values.observacoes}
            onChange={formik.handleChange}
          />
          <div className="flex justify-end">
            <Button type="submit" className="bg-[#B70F0A] text-white">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
