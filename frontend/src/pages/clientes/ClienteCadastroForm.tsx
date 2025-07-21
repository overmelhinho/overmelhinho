import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const schema = yup.object().shape({
  nome: yup.string().required(),
  email: yup.string().nullable().email(),
  telefone: yup.string().nullable(),
  origem: yup.string().nullable(),
  responsavel: yup.string().nullable(),
  observacoes: yup.string().nullable(),
});

export default function ClienteCadastroForm() {
  const { id } = useParams();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (id) {
      axios.get(`/v1/leads/${id}`).then(({ data }) => {
        setValue('nome', data.nome || '');
        setValue('email', data.email || '');
        setValue('telefone', data.telefone || '');
        setValue('origem', data.origem || '');
        setValue('responsavel', data.responsavel || '');
        setValue('observacoes', data.observacoes || '');
      });
    }
  }, [id, setValue]);

  const onSubmit = async (values) => {
    await axios.post('/v1/clientes', values);
    alert('Cliente cadastrado com sucesso!');
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-[#B70F0A] mb-4">Cadastro de Cliente</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Nome" {...register('nome')} error={errors.nome?.message} />
        <Input label="Email" {...register('email')} error={errors.email?.message} />
        <Input label="Telefone" {...register('telefone')} error={errors.telefone?.message} />
        <Input label="Origem" {...register('origem')} error={errors.origem?.message} />
        <Input label="Responsável" {...register('responsavel')} error={errors.responsavel?.message} />
        <Input label="Observações" {...register('observacoes')} error={errors.observacoes?.message} />
        <Button type="submit" className="bg-[#B70F0A] text-white">Salvar Cliente</Button>
      </form>
    </div>
  );
}
