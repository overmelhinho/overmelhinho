import * as Yup from 'yup';

export const leadValidationSchema = Yup.object().shape({
  cliente: Yup.object().shape({
    nome_fantasia: Yup.string()
      .min(3, 'Mínimo 3 caracteres')
      .required('Nome fantasia é obrigatório'),
    cpf_cnpj: Yup.string()
      .matches(/^\d{11}$|^\d{14}$/, 'CPF/CNPJ inválido')
      .required('CPF/CNPJ é obrigatório'),
  }),
  endereco: Yup.object().shape({
    cep: Yup.string()
      .matches(/^\d{5}-?\d{3}$/, 'CEP inválido')
      .required('CEP é obrigatório'),
    estado: Yup.string().required('Estado é obrigatório'),
    cidade: Yup.string().required('Cidade é obrigatória'),
    bairro: Yup.string().required('Bairro é obrigatório'),
    rua: Yup.string().required('Rua é obrigatória'),
    numero: Yup.string().required('Número é obrigatório'),
  }),
  contatos: Yup.array().of(
    Yup.object().shape({
      telefone_principal: Yup.string()
        .matches(/^\d{10,11}$/, 'Telefone inválido')
        .required('Telefone é obrigatório'),
      whatsapp_principal: Yup.boolean(),
      email_principal: Yup.string()
        .email('Email inválido')
        .required('Email é obrigatório'),
    })
  ),
  redes_sociais: Yup.array().of(
    Yup.object().shape({
      tipo: Yup.string().notRequired(),
      url: Yup.string().url('URL inválida').notRequired(),
    })
  ),
  segmentos: Yup.array()
    .min(1, 'Selecione pelo menos um segmento')
    .of(Yup.number().integer()),
  descricao: Yup.string().notRequired(),
  observacoes: Yup.string(),
  possui_video: Yup.boolean(),
  url_video: Yup.string().url('URL do vídeo inválida').notRequired(),
  possui_portfolio: Yup.boolean(),
  url_portfolio: Yup.string().url('URL do portfólio inválida').notRequired(),
  possui_publicidade: Yup.boolean(),
  tipo_publicidade: Yup.mixed().when('possui_publicidade', {
    is: (val) => val === true,
    then: () => Yup.string().notRequired(),
    otherwise: () => Yup.string().notRequired()
  }),
  vagas: Yup.array().of(
    Yup.object().shape({
      titulo: Yup.string().required('Título da vaga é obrigatório'),
      quantidade: Yup.number().min(1, 'Quantidade mínima é 1').required('Quantidade é obrigatória'),
      requisitos: Yup.string().required('Requisitos são obrigatórios'),
    })
  )
});
