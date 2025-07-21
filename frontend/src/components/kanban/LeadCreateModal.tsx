// src/components/kanban/LeadCreateModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useCreateLead } from '@/hooks/useLeads';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LeadCreateModal({ open, onClose }) {
  const createLead = useCreateLead();

  const formik = useFormik({
    initialValues: {
      nome: '',
      email: '',
      telefone: '',
      origem: '',
    },
    validationSchema: Yup.object({
      nome: Yup.string().required('Nome obrigatório'),
      email: Yup.string().email('Email inválido'),
      telefone: Yup.string(),
      origem: Yup.string(),
    }),
    onSubmit: (values) => {
      createLead.mutate(values, { onSuccess: onClose });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="space-y-3">
          <Input
            name="nome"
            placeholder="Nome"
            value={formik.values.nome}
            onChange={formik.handleChange}
            className={formik.errors.nome ? 'border-red-500' : ''}
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-[#B70F0A] text-white">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
