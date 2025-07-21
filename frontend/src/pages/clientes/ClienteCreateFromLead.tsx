import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '@/services/api';
import Skeleton from '@/components/ui/skeleton';

import { Formik, Form, Field } from 'formik';

export default function ClienteCreateFromLead() {
  const { leadId } = useParams();

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const { data } = await axios.get(`/v1/leads/${leadId}`);
      return data.data;
    },
    enabled: !!leadId,
  });

  if (isLoading || !lead) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold text-[#B70F0A] mb-4">Novo Cliente a partir de Lead</h1>
      <Formik
        initialValues={{
          nome: lead.nome || '',
          email: lead.email || '',
          telefone: lead.telefone || '',
          origem: lead.origem || '',
          responsavel: lead.responsavel || '',
        }}
        onSubmit={(values) => {
          console.log('Salvar cliente com:', values);
          // TODO: Implementar POST para clientes
        }}
      >
        <Form className="space-y-4">
          <div>
            <label className="block text-sm">Nome</label>
            <Field name="nome" className="input" />
          </div>
          <div>
            <label className="block text-sm">Email</label>
            <Field name="email" type="email" className="input" />
          </div>
          <div>
            <label className="block text-sm">Telefone</label>
            <Field name="telefone" className="input" />
          </div>
          <div>
            <label className="block text-sm">Origem</label>
            <Field name="origem" className="input" />
          </div>
          <div>
            <label className="block text-sm">Responsável</label>
            <Field name="responsavel" className="input" />
          </div>
          <button type="submit" className="bg-[#B70F0A] text-white px-4 py-2 rounded-2xl shadow">
            Salvar Cliente
          </button>
        </Form>
      </Formik>
    </div>
  );
}
