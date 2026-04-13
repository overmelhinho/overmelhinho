import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useCreateLead } from '@/hooks/useLeads';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Função de máscara de telefone
function formatPhoneNumber(value: string): string {
  if (!value) return "";
  const onlyNums = value.replace(/\D/g, "");
  if (onlyNums.length <= 10) {
    return onlyNums.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }
  return onlyNums.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

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
      origem: Yup.string().required('Origem obrigatória'),
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
          {formik.errors.nome && (
            <span className="text-xs text-red-600">{formik.errors.nome}</span>
          )}

          <Input
            name="email"
            placeholder="Email"
            value={formik.values.email}
            onChange={formik.handleChange}
            className={formik.errors.email ? 'border-red-500' : ''}
          />
          {formik.errors.email && (
            <span className="text-xs text-red-600">{formik.errors.email}</span>
          )}

          <Input
            name="telefone"
            placeholder="Telefone"
            value={formik.values.telefone}
            onChange={(e) => {
              const formatted = formatPhoneNumber(e.target.value);
              formik.setFieldValue("telefone", formatted);
            }}
          />

          <div className="space-y-1">
            <label htmlFor="origem" className="block text-sm font-medium text-gray-700">
              Origem do lead <span className="text-red-600 ml-1">*</span>
            </label>
            <select
              id="origem"
              name="origem"
              value={formik.values.origem}
              onChange={formik.handleChange}
              className={`w-full border rounded-md p-2 ${formik.errors.origem ? 'border-red-500' : ''}`}
            >
              <option value="">Selecione a origem</option>
              <optgroup label="Digital">
                <option value="site">Site</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="google_ads">Google Ads</option>
                <option value="landing_page">Landing Page</option>
                <option value="whatsapp_web">WhatsApp (automático)</option>
              </optgroup>
              <optgroup label="Indicação / Manual">
                <option value="telefone">Telefone</option>
                <option value="indicacao_cliente">Indicação de cliente</option>
                <option value="indicacao_parceiro">Indicação de parceiro</option>
                <option value="renovacao">Renovação</option>
                <option value="insercao_manual">Inserção manual</option>
              </optgroup>
              <optgroup label="Outros">
                <option value="evento_local">Evento ou feira</option>
                <option value="midiakit">Mídia física (panfleto, outdoor)</option>
                <option value="outro">Outro</option>
              </optgroup>
            </select>
            {formik.errors.origem && (
              <span className="text-xs text-red-600">{formik.errors.origem}</span>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-[#B70F0A] text-white">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
