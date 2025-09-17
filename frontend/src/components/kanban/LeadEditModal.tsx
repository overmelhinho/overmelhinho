import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useUpdateLead } from '@/hooks/useLeads';

// ✅ Máscara manual atualizada
function formatPhone(value: string): string {
  if (!value) return '';
  const onlyNums = value.replace(/\D/g, '');

  if (onlyNums.length <= 2) {
    return onlyNums;
  } else if (onlyNums.length <= 7) {
    return onlyNums.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
  } else if (onlyNums.length <= 11) {
    return onlyNums.replace(/^(\d{2})(\d{1})(\d{4})(\d{0,4})/, '($1) $2 $3-$4');
  }

  return onlyNums.replace(/^(\d{2})(\d{1})(\d{4})(\d{4}).*/, '($1) $2 $3-$4');
}

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
      motivo_perda: lead?.motivo_perda || ''
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      nome: Yup.string().required('Nome é obrigatório'),
      email: Yup.string().email('E-mail inválido').nullable(),
      telefone: Yup.string()
        .nullable()
        .test('valid-format', 'Formato: (99) 9 9999-9999', function (value) {
          if (!value) return true;
          return /^\(\d{2}\) \d \d{4}-\d{4}$/.test(value);
        }),
      origem: Yup.string().required('Origem é obrigatória')
    }),
    onSubmit: async (values) => {
      await updateLead.mutateAsync({ ...lead, ...values });
      onClose();
    }
  });

  useEffect(() => {
    if (open) {
      console.log('✏️ Lead recebido no modal:', lead);
    }
  }, [lead, open]);

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
          {formik.touched.email && formik.errors.email && (
            <div className="text-red-500 text-sm">{formik.errors.email}</div>
          )}

          <Input
            name="telefone"
            placeholder="Telefone"
            value={formik.values.telefone}
            onChange={(e) =>
              formik.setFieldValue('telefone', formatPhone(e.target.value))
            }
            onBlur={formik.handleBlur}
          />
          {formik.touched.telefone && formik.errors.telefone && (
            <div className="text-red-500 text-sm">{formik.errors.telefone}</div>
          )}

          <select
            id="origem"
            name="origem"
            value={formik.values.origem || ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full border rounded-md p-2 ${formik.errors.origem ? 'border-red-500' : ''}`}
          >
            <option value="" disabled>Selecione a origem</option>
            <option value="site">Site</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="google_ads">Google Ads</option>
            <option value="landing_page">Landing Page</option>
            <option value="whatsapp_web">WhatsApp (automático)</option>
            <option value="telefone">Telefone</option>
            <option value="indicacao_cliente">Indicação de cliente</option>
            <option value="indicacao_parceiro">Indicação de parceiro</option>
            <option value="insercao_manual">Inserção manual</option>
            <option value="evento_local">Evento ou feira</option>
            <option value="midiakit">Mídia física</option>
            <option value="outro">Outro</option>
          </select>
          {formik.touched.origem && formik.errors.origem && (
            <div className="text-red-500 text-sm">{formik.errors.origem}</div>
          )}

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

          <textarea
            name="motivo_perda"
            placeholder="Motivo da perda (caso aplicável)"
            value={formik.values.motivo_perda}
            onChange={formik.handleChange}
            className="w-full border rounded px-2 py-1"
          />

          <div className="flex justify-end">
            <Button type="submit" className="bg-[#B70F0A] text-white">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
