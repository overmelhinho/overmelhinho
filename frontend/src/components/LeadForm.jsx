import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import { leadValidationSchema } from '../schemas/leadValidationSchema';
import SegmentosSelect from '../components/forms/SegmentosSelect';
import api from '../services/api';

const steps = [
  'cliente',
  'endereco',
  'contatos',
  'redes_sociais',
  'segmentos',
  'descricao',
  'publicidade',
  'vagas'
];

const LeadForm = () => {
  const [step, setStep] = useState(0);

  const initialValues = {
    cliente: { nome_fantasia: '', cpf_cnpj: '' },
    endereco: { cep: '', estado: '', cidade: '', bairro: '', rua: '', numero: '' },
    contatos: [{ telefone_principal: '', whatsapp_principal: false, email_principal: '' }],
    redes_sociais: [{ tipo: '', url: '' }],
    segmentos: [],
    descricao: '',
    observacoes: '',
    video: '',
    portfolio_url: '',
    possui_publicidade: false,
    tipo_publicidade: '',
    comentarios: '',
    vagas: [{ titulo: '', quantidade: '', requisitos: '' }]
  };

  const handleSubmit = async (values, actions) => {
    try {
      const response = await api.post('/leads', values);
      alert(`Lead cadastrado com sucesso! ID: ${response.data.id}`);
      actions.resetForm();
      setStep(0);
    } catch (error) {
      alert('Erro ao cadastrar lead');
      console.error(error);
    }
  };

  const renderStep = (step) => {
    switch (steps[step]) {
      case 'cliente':
        return (
          <div>
            <label>Nome Fantasia:</label>
            <Field name="cliente.nome_fantasia" />
            <ErrorMessage name="cliente.nome_fantasia" component="div" />
            <label>CPF/CNPJ:</label>
            <Field name="cliente.cpf_cnpj" />
            <ErrorMessage name="cliente.cpf_cnpj" component="div" />
          </div>
        );
      case 'endereco':
        return (
          <div>
            <label>CEP:</label>
            <Field name="endereco.cep" />
            <ErrorMessage name="endereco.cep" component="div" />
            <label>Estado:</label>
            <Field name="endereco.estado" />
            <ErrorMessage name="endereco.estado" component="div" />
            <label>Cidade:</label>
            <Field name="endereco.cidade" />
            <ErrorMessage name="endereco.cidade" component="div" />
            <label>Bairro:</label>
            <Field name="endereco.bairro" />
            <ErrorMessage name="endereco.bairro" component="div" />
            <label>Rua:</label>
            <Field name="endereco.rua" />
            <ErrorMessage name="endereco.rua" component="div" />
            <label>Número:</label>
            <Field name="endereco.numero" />
            <ErrorMessage name="endereco.numero" component="div" />
          </div>
        );
      case 'contatos':
        return (
          <div>
            <label>Telefone Principal:</label>
            <Field name="contatos[0].telefone_principal" />
            <ErrorMessage name="contatos[0].telefone_principal" component="div" />
            <label>Email Principal:</label>
            <Field name="contatos[0].email_principal" />
            <ErrorMessage name="contatos[0].email_principal" component="div" />
            <label>
              <Field type="checkbox" name="contatos[0].whatsapp_principal" /> WhatsApp Principal
            </label>
          </div>
        );
      case 'redes_sociais':
        return (
          <FieldArray name="redes_sociais">
            {() => (
              <div>
                <label>Tipo:</label>
                <Field name="redes_sociais[0].tipo" />
                <ErrorMessage name="redes_sociais[0].tipo" component="div" />
                <label>URL:</label>
                <Field name="redes_sociais[0].url" />
                <ErrorMessage name="redes_sociais[0].url" component="div" />
              </div>
            )}
          </FieldArray>
        );
      case 'segmentos':
        return (
          <div>
            <SegmentosSelect name="segmentos" />
            <ErrorMessage name="segmentos" component="div" />
          </div>
        );
      case 'descricao':
        return (
          <div>
            <label>Descrição:</label>
            <Field as="textarea" name="descricao" />
            <ErrorMessage name="descricao" component="div" />
            <label>Observações:</label>
            <Field as="textarea" name="observacoes" />
          </div>
        );
      case 'publicidade':
        return (
          <div>
            <label>
              <Field type="checkbox" name="possui_publicidade" /> Possui Publicidade
            </label>
            <label>Tipo de Publicidade:</label>
            <Field name="tipo_publicidade" />
            <ErrorMessage name="tipo_publicidade" component="div" />
            <label>Vídeo:</label>
            <Field name="video" />
            <ErrorMessage name="video" component="div" />
            <label>Portfólio URL:</label>
            <Field name="portfolio_url" />
            <ErrorMessage name="portfolio_url" component="div" />
            <label>Comentários:</label>
            <Field as="textarea" name="comentarios" />
          </div>
        );
      case 'vagas':
        return (
          <FieldArray name="vagas">
            {() => (
              <div>
                <label>Título:</label>
                <Field name="vagas[0].titulo" />
                <ErrorMessage name="vagas[0].titulo" component="div" />
                <label>Quantidade:</label>
                <Field name="vagas[0].quantidade" />
                <ErrorMessage name="vagas[0].quantidade" component="div" />
                <label>Requisitos:</label>
                <Field as="textarea" name="vagas[0].requisitos" />
                <ErrorMessage name="vagas[0].requisitos" component="div" />
              </div>
            )}
          </FieldArray>
        );
      default:
        return <div>Etapa ainda não implementada</div>;
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={leadValidationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <Form>
          {renderStep(step)}
          <div>
            {step > 0 && <button type="button" onClick={() => setStep(step - 1)}>Anterior</button>}
            {step < steps.length - 1 ? (
              <button type="button" onClick={() => setStep(step + 1)}>Próximo</button>
            ) : (
              <button type="submit" disabled={isSubmitting}>Enviar</button>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default LeadForm;
