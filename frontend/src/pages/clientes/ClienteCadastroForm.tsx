import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '@/services/api';
import Skeleton from '@/components/ui/skeleton';
import { Formik, Form, Field } from 'formik';
import { useState, useEffect } from 'react';
import { Tabs, Tab } from '@/components/ui/tabs';
import toast from 'react-hot-toast';
import * as Yup from 'yup';

const inputClass = "w-full rounded-xl border border-gray-300 focus:border-[#B70F0A] focus:ring-2 focus:ring-[#B70F0A]/40 transition-all px-3 py-2 text-sm shadow-sm";

export default function ClienteCreateFromLead() {
  const { leadId } = useParams();
  const [iaData, setIaData] = useState<any | null>(null);
  const [step, setStep] = useState(0);

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const { data } = await axios.get(`/v1/leads/${leadId}`);
      return data.data;
    },
    enabled: !!leadId,
  });

  const buscarComIA = async () => {
    try {
      const query = `${lead.nome} ${lead.origem || ''}`;
      const { data } = await axios.get(`/v1/lead-intel/fetch?query=${encodeURIComponent(query)}`);
      if (data.dados) {
        setIaData(data.dados);
        toast.success('Sugestões encontradas com IA!');
      } else {
        toast.error('Nenhum dado retornado pela IA');
      }
    } catch (err) {
      toast.error('Falha ao buscar por IA');
    }
  };

  const validationSchema = Yup.object({
    nome: Yup.string().required('Nome é obrigatório'),
    email: Yup.string().email('Email inválido').required('Email é obrigatório'),
    telefone: Yup.string().required('Telefone é obrigatório'),
    origem: Yup.string().required('Origem é obrigatória'),
    responsavel: Yup.string().required('Responsável é obrigatório'),
    cep: Yup.string().matches(/^\d{5}-?\d{3}$/, 'CEP inválido').required('CEP é obrigatório'),
    estado: Yup.string().required('Estado é obrigatório'),
    cidade: Yup.string().required('Cidade é obrigatória'),
    bairro: Yup.string().required('Bairro é obrigatório'),
    rua: Yup.string().required('Rua é obrigatória'),
    numero: Yup.string().required('Número é obrigatório'),
    instagram: Yup.string().url('URL inválida'),
    facebook: Yup.string().url('URL inválida'),
    linkedin: Yup.string().url('URL inválida'),
    youtube: Yup.string().url('URL inválida'),
    tiktok: Yup.string().url('URL inválida'),
    x: Yup.string().url('URL inválida'),
  });

  if (isLoading || !lead) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-[#B70F0A]">Novo Cliente a partir de Lead</h1>
        <button onClick={buscarComIA} className="text-sm px-3 py-1 border rounded border-[#B70F0A] text-[#B70F0A] hover:bg-[#B70F0A] hover:text-white">
          Buscar com IA
        </button>
      </div>

      {iaData && (
        <div className="mb-6 bg-gray-50 border p-4 rounded-lg shadow-sm">
          <h2 className="font-semibold mb-2 text-sm text-[#B70F0A]">Sugestões da IA</h2>
          <ul className="text-sm space-y-1">
            <li><strong>Nome Fantasia:</strong> {iaData.nome_fantasia}</li>
            <li><strong>Telefone:</strong> {iaData.telefone}</li>
            <li><strong>Endereço:</strong> {iaData.endereco}</li>
            <li><strong>Instagram:</strong> {iaData.instagram}</li>
            <li><strong>Descrição:</strong> {iaData.descricao}</li>
          </ul>
        </div>
      )}

      <Formik
        initialValues={{
          nome: lead.nome || '',
          email: lead.email || '',
          telefone: lead.telefone || '',
          origem: lead.origem || '',
          responsavel: lead.responsavel || '',
          cep: '', estado: '', cidade: '', bairro: '', rua: '', numero: '', complemento: '',
          facebook: '', instagram: '', linkedin: '', youtube: '', tiktok: '', x: '',
          ...iaData
        }}
        enableReinitialize
        validationSchema={validationSchema}
        onSubmit={(values) => {
          console.log('Salvar cliente com:', values);
          // TODO: Implementar POST para clientes
        }}
      >
        {({ values, setFieldValue, errors, touched }) => (
          <Form className="space-y-6">
            <Tabs selectedIndex={step} onChange={setStep}>
              <Tab title="Identificação">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm">Nome</label>
                    <Field name="nome" className={inputClass} />
                    {touched.nome && errors.nome && <div className="text-red-500 text-sm">{errors.nome}</div>}
                  </div>
                  <div>
                    <label className="block text-sm">Email</label>
                    <Field name="email" className={inputClass} />
                    {touched.email && errors.email && <div className="text-red-500 text-sm">{errors.email}</div>}
                  </div>
                  <div>
                    <label className="block text-sm">Telefone</label>
                    <Field name="telefone" className={inputClass} />
                    {touched.telefone && errors.telefone && <div className="text-red-500 text-sm">{errors.telefone}</div>}
                  </div>
                </div>
              </Tab>

              <Tab title="Contato">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm">Origem</label>
                    <Field name="origem" className={inputClass} />
                    {touched.origem && errors.origem && <div className="text-red-500 text-sm">{errors.origem}</div>}
                  </div>
                  <div>
                    <label className="block text-sm">Responsável</label>
                    <Field name="responsavel" className={inputClass} />
                    {touched.responsavel && errors.responsavel && <div className="text-red-500 text-sm">{errors.responsavel}</div>}
                  </div>
                </div>
              </Tab>

              <Tab title="Endereço">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm">CEP</label>
                    <Field name="cep" className={inputClass} />
                    {touched.cep && errors.cep && <div className="text-red-500 text-sm">{errors.cep}</div>}
                  </div>
                  <div>
                    <label className="block text-sm">Estado</label>
                    <Field name="estado" className={inputClass} />
                    {touched.estado && errors.estado && <div className="text-red-500 text-sm">{errors.estado}</div>}
                  </div>
                  <div>
                    <label className="block text-sm">Cidade</label>
                    <Field name="cidade" className={inputClass} />
                    {touched.cidade && errors.cidade && <div className="text-red-500 text-sm">{errors.cidade}</div>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm">Bairro</label>
                    <Field name="bairro" className={inputClass} />
                    {touched.bairro && errors.bairro && <div className="text-red-500 text-sm">{errors.bairro}</div>}
                  </div>
                  <div>
                    <label className="block text-sm">Rua</label>
                    <Field name="rua" className={inputClass} />
                    {touched.rua && errors.rua && <div className="text-red-500 text-sm">{errors.rua}</div>}
                  </div>
                  <div>
                    <label className="block text-sm">Número</label>
                    <Field name="numero" className={inputClass} />
                    {touched.numero && errors.numero && <div className="text-red-500 text-sm">{errors.numero}</div>}
                  </div>
                </div>
              </Tab>

              <Tab title="Redes Sociais">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['instagram', 'facebook', 'linkedin', 'youtube', 'tiktok', 'x'].map((field) => (
                    <div key={field}>
                      <label className="block text-sm capitalize">{field}</label>
                      <Field name={field} className={inputClass} />
                      {touched[field] && errors[field] && <div className="text-red-500 text-sm">{errors[field]}</div>}
                    </div>
                  ))}
                </div>
              </Tab>
            </Tabs>
            <div className="flex justify-end gap-2">
              {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="text-sm px-4 py-2 border rounded">Voltar</button>}
              {step < 3 ? (
                <button type="button" onClick={() => setStep(step + 1)} className="text-sm px-4 py-2 bg-[#B70F0A] text-white rounded">Avançar</button>
              ) : (
                <button type="submit" className="text-sm px-4 py-2 bg-[#B70F0A] text-white rounded">Salvar Cliente</button>
              )}
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
