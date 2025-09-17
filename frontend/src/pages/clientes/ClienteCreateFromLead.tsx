import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '@/services/api';
import Skeleton from '@/components/ui/skeleton';
import { Formik, Form, Field } from 'formik';
import { useState } from 'react';
import { Tabs, Tab } from '@/components/ui/tabs';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import UploadArea from '@/components/custom/UploadArea';
import InputMask from 'react-input-mask';
import PreFetchModal from '@/components/modals/PreFetchModal';
import React, { useState } from 'react';
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaTiktok,
  FaXTwitter,
  FaPhone,
  FaMobile, // ← Use esse
  FaEnvelope,
  FaUser
} from "react-icons/fa6";

import { FaExternalLinkAlt } from "react-icons/fa";
import { Field } from "formik";
import MaskedField from '@/components/form/MaskedField';

const inputClass =
  "w-full rounded-xl border border-gray-300 focus:border-[#B70F0A] focus:ring-2 focus:ring-[#B70F0A]/40 transition-all px-3 py-2 text-sm shadow-sm";

const MaskedInput = ({ field, form, ...props }) => (
  <InputMask {...field} {...props}>
    {(inputProps) => <input {...inputProps} className={inputClass} />}
  </InputMask>
);

export default function ClienteCreateFromLead() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [showPreModal, setShowPreModal] = useState(true);
  const [dadosIA, setDadosIA] = useState({});
const [iaLoading, setIaLoading] = useState(false); // <-- Aqui

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const { data } = await axios.get(`/v1/leads/${leadId}`);
      return data.data;
    },
    enabled: !!leadId,
  });

  const { data: users } = useQuery({
    queryKey: ['usuarios', 'comercial'],
    queryFn: async () => {
      const { data } = await axios.get('/v1/usuarios?role=Comercial');
      return data.data;
    },
  });

  const { data: segmentos } = useQuery({
    queryKey: ['segmentos'],
    queryFn: async () => {
      const { data } = await axios.get('/v1/segmentos');
      return data.data;
    },
  });

  const validationSchema = Yup.object({
    nome: Yup.string().required('Nome é obrigatório'),
    razao_social: Yup.string().required('Razão social é obrigatória'),
    cnpj: Yup.string()
      .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido')
      .required('CNPJ é obrigatório'),
    email: Yup.string().email('Email inválido').required('Email é obrigatório'),
    telefone_principal: Yup.string().required('Telefone principal é obrigatório'),
    responsavel: Yup.string().required('Responsável é obrigatório'),
    cep: Yup.string().required('CEP é obrigatório'),
    estado: Yup.string().required('Estado é obrigatório'),
    cidade: Yup.string().required('Cidade é obrigatória'),
    bairro: Yup.string().required('Bairro é obrigatório'),
    rua: Yup.string().required('Rua é obrigatória'),
    numero: Yup.string().required('Número é obrigatório'),
    segmentos: Yup.array().min(1, 'Selecione pelo menos um segmento'),
  });

  if (isLoading || !lead) return <Skeleton className="h-32 w-full" />;

  const beneficios = [
    "24 horas", "Tele-entrega", "Aberto ao meio-dia", "Crédito", "Débito",
    "Crediário", "Boleto Bancário", "Cheque", "Dinheiro", "Pix", "PicPay",
    "Banricompras", "Hipercard", "VR Alimentação"
  ];

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <PreFetchModal
        nomeInicial={lead?.nome || ""}
        isOpen={showPreModal}
        onClose={() => setShowPreModal(false)}
       onConfirm={(dados) => {
            // Parse endereço se vier em dados.endereco ou dados.address
            const enderecoCompleto = dados.endereco || dados.address || "";
            const partes = enderecoCompleto.split(",");

            const ruaNumero = partes[0]?.trim() || "";
            const complemento = partes[1]?.includes("sala") ? partes[1]?.trim() : "";
            const bairro = partes[2]?.trim() || "";
            const cidade = partes[3]?.split("-")[0]?.trim() || "";
            const estado = partes[3]?.split("-")[1]?.trim() || "";
            const cep = partes[4]?.trim() || "";

            const novo = {
              nome: dados.nome || "",
              telefone_principal: dados.telefone || "",
              descricao: dados.descricao || "",
              facebook: dados.facebook || "",
              instagram: dados.instagram || "",
              cep,
              estado,
              cidade,
              bairro,
              rua: ruaNumero,
              numero: ruaNumero.match(/\d+/)?.[0] || "",
              complemento
            };

            setDadosIA(novo);
          }}
      />

      <Formik
        initialValues={{
          nome: dadosIA.nome || lead.nome || '',
          razao_social: dadosIA.razao_social || '',
          cnpj: dadosIA.cnpj || '',
          inscricao_estadual: '',
          inscricao_municipal: '',
          registro_profissional: '',
          palavras_chave: '',
          email: dadosIA.email || lead.email || '',
          telefone_principal: dadosIA.telefone || lead.telefone || '',
          telefone_secundario: '',
          celular: '',
          origem: lead.origem || '',
          responsavel: lead.responsavel || '',
          cep: dadosIA.cep || '', estado: dadosIA.estado || '', cidade: dadosIA.cidade || '', bairro: dadosIA.bairro || '', rua: dadosIA.rua || '', numero: dadosIA.numero || '', complemento: '',
          facebook: dadosIA.facebook || '', instagram: dadosIA.instagram || '', linkedin: '', youtube: '', tiktok: '', x: '',
          descricao: dadosIA.descricao || '', segmentos: [], logotipo: null,
          beneficios: [], horario_atendimento: ''
        }}
        enableReinitialize
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          try {
            await axios.post('/v1/clientes', values);
            toast.success('Cliente criado com sucesso!');
            navigate('/clientes');
          } catch (err) {
            toast.error('Erro ao salvar cliente');
          }
        }}
      >
    {({ values, setFieldValue, errors, touched }) => (
  <Form className="space-y-6">
    <PreFetchModal
      nomeInicial={lead?.nome || ""}
      isOpen={showPreModal}
      onClose={() => setShowPreModal(false)}
    onConfirm={(dados) => {
  const enderecoCompleto = dados.endereco || dados.address || "";
  let rua = "", numero = "", complemento = "", bairro = "", cidade = "", estado = "", cep = "";

  try {
    const partes = enderecoCompleto.split(",");

    // Rua
    rua = partes[0]?.trim() || "";

    // Número + complemento + bairro
    const numCompBairro = partes[1]?.trim() || "";
    const [num, ...resto] = numCompBairro.split("-");
    numero = num?.trim() || "";
    complemento = resto.join("-").trim();

    // Cidade + estado
    const cidadeEstado = partes[2]?.trim() || "";
    cidade = cidadeEstado.split("-")[0]?.trim() || "";
    estado = cidadeEstado.split("-")[1]?.trim() || "";

    // CEP
    cep = partes[3]?.trim() || "";

    // País ignorado (partes[4])
  } catch (e) {
    console.warn("Falha ao parsear endereço:", enderecoCompleto);
  }

  setFieldValue("nome", dados.nome_fantasia || dados.nome || "");
  setFieldValue("telefone_principal", dados.telefone || "");
  setFieldValue("descricao", dados.descricao || "");
  setFieldValue("facebook", dados.facebook || "");
  setFieldValue("instagram", dados.instagram || "");
  setFieldValue("linkedin", dados.linkedin || "");
  setFieldValue("youtube", dados.youtube || "");
  setFieldValue("tiktok", dados.tiktok || "");
  setFieldValue("x", dados.x || "");

  setFieldValue("cep", cep);
  setFieldValue("estado", estado);
  setFieldValue("cidade", cidade);
  setFieldValue("bairro", complemento.includes("Centro") ? "Centro" : "");
  setFieldValue("rua", rua);
  setFieldValue("numero", numero);
  setFieldValue("complemento", complemento);
}}
    />

    <div className="flex justify-between items-center mb-4">
      <h1 className="text-xl font-bold text-[#B70F0A]">Novo Cliente a partir de Lead</h1>
    </div>


            <Tabs selectedIndex={step} onChange={setStep}>
              {/* Identificação */}
              <Tab title="Identificação">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label>Nome Fantasia</label><Field name="nome" className={inputClass} /></div>
                  <div><label>Razão Social</label><Field name="razao_social" className={inputClass} /></div>
                  <div><label>CNPJ</label><Field name="cnpj" className={inputClass} placeholder="00.000.000/0000-00" /></div>
                  <div><label>Inscrição Estadual</label><Field name="inscricao_estadual" className={inputClass} /></div>
                  <div><label>Inscrição Municipal</label><Field name="inscricao_municipal" className={inputClass} /></div>
                  <div><label>Registro Profissional</label><Field name="registro_profissional" className={inputClass} /></div>
                  <div className="col-span-2"><label>Palavras-chave (SEO)</label><Field name="palavras_chave" className={inputClass} /></div>
                  <div className="col-span-2"><label>Descrição</label><Field name="descricao" as="textarea" className={inputClass} /></div>
                </div>
              </Tab>

             {/* Endereço */}
              <Tab title="Endereço">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* CEP */}
                  <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-white shadow-sm">
                    <span className="text-gray-500">📍</span>
                    <Field
                      name="cep"
                      placeholder="CEP"
                      className="flex-1 outline-none"
                      onBlur={async (e: any) => {
                        const cep = e.target.value.replace(/\D/g, "");
                        if (cep.length === 8) {
                          try {
                            const { data } = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
                            if (!data.erro) {
                              setFieldValue("rua", data.logradouro || "");
                              setFieldValue("bairro", data.bairro || "");
                              setFieldValue("cidade", data.localidade || "");
                              setFieldValue("estado", data.uf || "");
                            }
                          } catch {
                            toast.error("Não foi possível buscar o CEP");
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Estado */}
                  <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-white shadow-sm">
                    <span className="text-gray-500">🗺️</span>
                    <Field name="estado" placeholder="Estado" className="flex-1 outline-none" />
                  </div>

                  {/* Cidade */}
                  <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-white shadow-sm">
                    <span className="text-gray-500">🌆</span>
                    <Field as="select" name="cidade" className="flex-1 outline-none">
                      <option value="">Selecione a cidade</option>
                      {[
                        "Bento Gonçalves", "Caxias do Sul", "Farroupilha", "Garibaldi", "Gramado",
                        "Canela", "Nova Petrópolis", "Carlos Barbosa", "Flores da Cunha",
                        "São Marcos", "Veranópolis", "Torres", "Antônio Prado"
                      ]
                        .sort()
                        .map((cidade) => (
                          <option key={cidade} value={cidade}>
                            {cidade}
                          </option>
                        ))}
                    </Field>
                  </div>

                  {/* Bairro */}
                  <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-white shadow-sm">
                    <span className="text-gray-500">🏘️</span>
                    <Field name="bairro" placeholder="Bairro" className="flex-1 outline-none" />
                  </div>

                  {/* Rua */}
                  <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-white shadow-sm">
                    <span className="text-gray-500">🏠</span>
                    <Field name="rua" placeholder="Rua" className="flex-1 outline-none" />
                  </div>

                  {/* Número */}
                  <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-white shadow-sm">
                    <span className="text-gray-500">🏢</span>
                    <Field name="numero" placeholder="Número" className="flex-1 outline-none" />
                  </div>
                </div>

                {/* Complemento */}
                <div className="mt-4 flex items-center gap-2 border rounded-xl px-3 py-2 bg-white shadow-sm">
                  <span className="text-gray-500">🏷️</span>
                  <Field name="complemento" placeholder="Complemento" className="flex-1 outline-none" />
                </div>
              </Tab>
        

      <Tab title="Contato">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    {/* Telefone Principal */}
    <div>
      <label className="flex items-center gap-2">
        <FaPhone className="text-gray-500" />
        Telefone Principal
      </label>
      <Field name="telefone_principal">
        {({ field }) => (
          <input {...field} className={inputClass} placeholder="(99) 9999-9999" />
        )}
      </Field>
      <label><Field type="checkbox" name="telefone_principal_whatsapp" /> WhatsApp</label>
      <label><Field type="checkbox" name="telefone_principal_exibir" /> Exibir no site</label>
    </div>

    {/* Telefone Secundário */}
    <div>
      <label className="flex items-center gap-2">
        <FaPhone className="text-gray-500" />
        Telefone Secundário
      </label>
      <Field name="telefone_secundario">
        {({ field }) => (
          <input {...field} className={inputClass} placeholder="(99) 9999-9999" />
        )}
      </Field>
      <label><Field type="checkbox" name="telefone_secundario_whatsapp" /> WhatsApp</label>
      <label><Field type="checkbox" name="telefone_secundario_exibir" /> Exibir no site</label>
    </div>

    {/* Celular */}
    <div>
      <label className="flex items-center gap-2">
        <FaMobile className="text-gray-500" />
        Celular
      </label>
      <Field name="celular">
        {({ field }) => (
          <input {...field} className={inputClass} placeholder="(99) 9 9999-9999" />
        )}
      </Field>
      <label><Field type="checkbox" name="celular_whatsapp" /> WhatsApp</label>
      <label><Field type="checkbox" name="celular_exibir" /> Exibir no site</label>
    </div>

    {/* Email */}
    <div>
      <label className="flex items-center gap-2">
        <FaEnvelope className="text-gray-500" />
        Email
      </label>
      <Field name="email" className={inputClass} />
      <label><Field type="checkbox" name="email_exibir" /> Exibir no site</label>
    </div>

    {/* Responsável */}
    <div>
      <label className="flex items-center gap-2">
        <FaUser className="text-gray-500" />
        Responsável
      </label>
      <Field name="responsavel">
        {({ field }) => (
          <select {...field} className={inputClass}>
            <option value="">Selecione</option>
            {Array.isArray(users) &&
              users
                .filter((u): u is { id: string | number; name: string } => !!u && !!u.id && !!u.name)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
          </select>
        )}
      </Field>
    </div>

  </div>
</Tab>

                              
              {/* Redes Sociais */}
              <Tab title="Redes Sociais">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Instagram */}
                <div className="flex items-center gap-3 border rounded-xl px-3 py-2 bg-white shadow-sm focus-within:border-pink-500">
                  <FaInstagram className="text-pink-500 w-5 h-5" />
                  <Field
                    name="instagram"
                    className="flex-1 outline-none"
                    placeholder="https://instagram.com/empresa"
                  />
                  {values.instagram && (
                    <a href={values.instagram} target="_blank" rel="noopener noreferrer">
                      <FaExternalLinkAlt className="text-gray-400 hover:text-pink-500 w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Facebook */}
                <div className="flex items-center gap-3 border rounded-xl px-3 py-2 bg-white shadow-sm focus-within:border-blue-600">
                  <FaFacebook className="text-blue-600 w-5 h-5" />
                  <Field
                    name="facebook"
                    className="flex-1 outline-none"
                    placeholder="https://facebook.com/empresa"
                  />
                  {values.facebook && (
                    <a href={values.facebook} target="_blank" rel="noopener noreferrer">
                      <FaExternalLinkAlt className="text-gray-400 hover:text-blue-600 w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="flex items-center gap-3 border rounded-xl px-3 py-2 bg-white shadow-sm focus-within:border-blue-700">
                  <FaLinkedin className="text-blue-700 w-5 h-5" />
                  <Field
                    name="linkedin"
                    className="flex-1 outline-none"
                    placeholder="https://linkedin.com/company/empresa"
                  />
                  {values.linkedin && (
                    <a href={values.linkedin} target="_blank" rel="noopener noreferrer">
                      <FaExternalLinkAlt className="text-gray-400 hover:text-blue-700 w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* YouTube */}
                <div className="flex items-center gap-3 border rounded-xl px-3 py-2 bg-white shadow-sm focus-within:border-red-600">
                  <FaYoutube className="text-red-600 w-5 h-5" />
                  <Field
                    name="youtube"
                    className="flex-1 outline-none"
                    placeholder="https://youtube.com/empresa"
                  />
                  {values.youtube && (
                    <a href={values.youtube} target="_blank" rel="noopener noreferrer">
                      <FaExternalLinkAlt className="text-gray-400 hover:text-red-600 w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* TikTok */}
                <div className="flex items-center gap-3 border rounded-xl px-3 py-2 bg-white shadow-sm focus-within:border-black">
                  <FaTiktok className="text-black w-5 h-5" />
                  <Field
                    name="tiktok"
                    className="flex-1 outline-none"
                    placeholder="https://tiktok.com/@empresa"
                  />
                  {values.tiktok && (
                    <a href={values.tiktok} target="_blank" rel="noopener noreferrer">
                      <FaExternalLinkAlt className="text-gray-400 hover:text-black w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* X (Twitter) */}
                <div className="flex items-center gap-3 border rounded-xl px-3 py-2 bg-white shadow-sm focus-within:border-gray-800">
                  <FaXTwitter className="text-gray-800 w-5 h-5" />
                  <Field
                    name="x"
                    className="flex-1 outline-none"
                    placeholder="https://x.com/empresa"
                  />
                  {values.x && (
                    <a href={values.x} target="_blank" rel="noopener noreferrer">
                      <FaExternalLinkAlt className="text-gray-400 hover:text-gray-800 w-4 h-4" />
                    </a>
                  )}
                </div>

              </div>
            </Tab>



              {/* Segmentos */}
              <Tab title="Segmentos">
                {segmentos?.map(seg => (
                  <label key={seg.id} className="block">
                    <Field type="checkbox" name="segmentos" value={seg.id} /> {seg.nome}
                  </label>
                ))}
                {touched.segmentos && errors.segmentos && <div className="text-red-500">{errors.segmentos}</div>}
              </Tab>

             {/* Benefícios */}
              <Tab title="Benefícios">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {beneficios.map((b) => {
                    // Mapeamento de ícones (Lucide) para cada benefício
                    const icons: Record<string, JSX.Element> = {
                      "24 horas": <span>⏰</span>,
                      "Tele-entrega": <span>🚚</span>,
                      "Aberto ao meio-dia": <span>🌞</span>,
                      "Crédito": <span>💳</span>,
                      "Débito": <span>💳</span>,
                      "Crediário": <span>📝</span>,
                      "Boleto Bancário": <span>🏦</span>,
                      "Cheque": <span>✍️</span>,
                      "Dinheiro": <span>💵</span>,
                      "Pix": <span>⚡</span>,
                      "PicPay": <span>📱</span>,
                      "Banricompras": <span>🏧</span>,
                      "Hipercard": <span>💳</span>,
                      "VR Alimentação": <span>🍽️</span>,
                    };

                    console.log('users:', users);

                    return (
                      <label
                        key={b}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all shadow-sm text-center
                          ${
                            values.beneficios.includes(b)
                              ? "border-[#B70F0A] bg-[#B70F0A]/10 text-[#B70F0A] font-semibold"
                              : "border-gray-300 bg-white hover:border-[#B70F0A]/40"
                          }`}
                      >
                        <Field type="checkbox" name="beneficios" value={b} className="hidden" />
                        <div className="text-2xl mb-2">{icons[b] || "✨"}</div>
                        <span>{b}</span>
                        {values.beneficios.includes(b) && (
                          <div className="absolute top-2 right-2 text-[#B70F0A] font-bold">✔</div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </Tab>

              {/* Informações Gerais */}
              <Tab title="Informações Gerais">
                <label>Horário de Atendimento</label>
                <Field name="horario_atendimento" className={inputClass} placeholder="Ex: Segunda à sexta: 07:00 às 19:00 | Sábado: 07:00 às 18:30" />
              </Tab>

              {/* Logotipo */}
              <Tab title="Logotipo">
                <UploadArea name="logotipo" onChange={(file) => setFieldValue('logotipo', file)} />
              </Tab>
            </Tabs>

            <div className="flex justify-end gap-2">
              {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="px-4 py-2 border rounded">Voltar</button>}
              {step < 7 ? (
                <button type="button" onClick={() => setStep(step + 1)} className="px-4 py-2 bg-[#B70F0A] text-white rounded">Avançar</button>
              ) : (
                <button type="submit" className="px-4 py-2 bg-[#B70F0A] text-white rounded">Salvar Cliente</button>
              )}
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
