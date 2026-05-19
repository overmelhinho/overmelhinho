// /var/www/frontend/src/pages/clientes/ClienteCreateFromLead.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";

import axios from "@/services/api";
import Skeleton from "@/components/ui/skeleton";
import TabsUI from "@/components/TabsUI";

import TabIdentificacao from "./create/steps/TabIdentificacao";
import TabEndereco from "./create/steps/TabEndereco";
import TabContato from "./create/steps/TabContato";
import TabRedesSociais from "./create/steps/TabRedesSociais";
import TabSegmentos from "./create/steps/TabSegmentos";
import TabBeneficios from "./create/steps/TabBeneficios";
import TabHorarios from "./create/steps/TabHorarios";
import TabLogotipo from "./create/steps/TabLogotipo";
import TabGaleria from "./create/steps/TabGaleria";
import TabMidia from "./create/steps/TabMidia";
import TabCidadesAtendidas from "./create/steps/TabCidadesAtendidas";
import TabGoogleReviews from "./create/steps/TabGoogleReviews";

import ClienteTicketsModal from "@/components/modals/ClienteTicketsModal";

// ✅ Modal IA (PreFetch)
import PreFetchModal from "@/components/modals/PreFetchModal";

type TipoCliente = "gratuito" | "pagante";

function extractTempPathFromPublicUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const idx = u.pathname.indexOf("/object/public/");
    if (idx === -1) return null;

    const after = u.pathname.substring(idx + "/object/public/".length); // bucket/path
    const parts = after.split("/").filter(Boolean);
    if (parts.length < 2) return null;

    const rest = parts.slice(1).join("/"); // path dentro do bucket
    if (!rest.startsWith("temp/")) return null;

    return rest;
  } catch {
    return null;
  }
}

function normalizeTempPath(p: any): string | null {
  if (typeof p !== "string") return null;
  const v = p.trim().replace(/^\/+/, "");
  if (!v) return null;
  if (v.startsWith("temp/")) return v;
  return `temp/${v}`;
}

/**
 * Achata o objeto "errors" do Formik em uma lista de { path, message }.
 */
function flattenFormikErrors(
  errors: any,
  prefix = ""
): Array<{ path: string; message: string }> {
  const out: Array<{ path: string; message: string }> = [];
  if (!errors) return out;

  const isString = (v: any) => typeof v === "string";
  const isObject = (v: any) => v && typeof v === "object";

  if (isString(errors)) {
    out.push({ path: prefix || "form", message: errors });
    return out;
  }

  if (Array.isArray(errors)) {
    errors.forEach((item, i) => {
      const nextPrefix = prefix ? `${prefix}[${i}]` : `[${i}]`;
      out.push(...flattenFormikErrors(item, nextPrefix));
    });
    return out;
  }

  if (isObject(errors)) {
    Object.keys(errors).forEach((k) => {
      const v = errors[k];
      const nextPrefix = prefix ? `${prefix}.${k}` : k;
      out.push(...flattenFormikErrors(v, nextPrefix));
    });
  }

  return out;
}

/**
 * Converte errors -> touched recursivo (para marcar campos como tocados)
 */
function errorsToTouched(errors: any): any {
  if (!errors) return undefined;
  if (typeof errors === "string") return true;
  if (Array.isArray(errors)) return errors.map((e) => errorsToTouched(e));
  if (typeof errors === "object") {
    const obj: any = {};
    Object.keys(errors).forEach((k) => {
      obj[k] = errorsToTouched(errors[k]);
    });
    return obj;
  }
  return true;
}

type ValidationIssue = {
  path: string;
  message: string;
  step: number;
  label: string;
};

export default function ClienteCreateFromLead() {
  const { leadId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);

  // ✅ seletor no topo
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>("pagante");

  const formikRef = useRef<any>(null);

  const allowSubmitRef = useRef(false);
  const [saving, setSaving] = useState(false);

  const [issues, setIssues] = useState<ValidationIssue[]>([]);

  // ✅ modal pós-cadastro (somente pagante)
  const [ticketsModalOpen, setTicketsModalOpen] = useState(false);
  const [ticketsClienteId, setTicketsClienteId] = useState<number | null>(null);
  const [missingLogo, setMissingLogo] = useState(false);
  const [missingGaleria, setMissingGaleria] = useState(false);

  const isFromLead = !!leadId;

  // ✅ Modal IA: deve abrir em /clientes/novo E em /clientes/novo/:leadId
  const [prefetchOpen, setPrefetchOpen] = useState(false);
  const openedPrefetchRef = useRef(false);

  useEffect(() => {
    if (!openedPrefetchRef.current) {
      openedPrefetchRef.current = true;
      setPrefetchOpen(true);
    }
  }, []);

  // ✅ ao mudar para "gratuito", garante que nada do fluxo pagante fica pendurado
  useEffect(() => {
    if (tipoCliente === "gratuito") {
      setTicketsModalOpen(false);
      setTicketsClienteId(null);
      setMissingLogo(false);
      setMissingGaleria(false);
      // step segura (gratuito só tem 0..4 agora)
      if (step > 4) setStep(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoCliente]);

  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: async () => {
      const { data } = await axios.get(`/v1/leads/${leadId}`);
      return data?.data;
    },
    enabled: !!leadId,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (lead) {
      console.log('📦 [LEAD DATA] Chegou do banco:', {
        nome: lead.nome,
        cidade: lead.cidade,
        id: lead.id
      });
    }
  }, [lead]);

  const validationSchema = Yup.object({
    nome_fantasia: Yup.string().required("Nome fantasia é obrigatório"),
    cnpj: Yup.string().nullable(),
    email: Yup.string().email("Email inválido").nullable(),
    telefone_principal: Yup.string().required("Telefone principal é obrigatório"),
    responsavel: Yup.string().required("Responsável é obrigatório"),
  });

  // ✅ tabs dependem do tipoCliente (pagante mostra tudo)
  const tabs = useMemo(() => {
    const base = [
      { id: 0, label: "Identificação" },
      { id: 1, label: "Endereço" },
      { id: 2, label: "Contato" },
      { id: 3, label: "Segmentos" }, // ✅ Ativado para todos
      { id: 4, label: "Horário" }, // ✅ Ativado para todos
    ];

    if (tipoCliente === "pagante") {
      base.push(
        { id: 5, label: "Cidades" },
        { id: 6, label: "Redes Sociais" },
        { id: 7, label: "Benefícios" },
        { id: 8, label: "Logotipo" },
        { id: 9, label: "Mídia" },
        { id: 10, label: "Galeria" },
        { id: 11, label: "Google Reviews" }
      );
    }

    return base;
  }, [tipoCliente]);

  const isLastStep = step >= tabs.length - 1;

  // ✅ mapa: campo -> step
  const stepByField = useMemo<Record<string, number>>(
    () => ({
      nome_fantasia: 0,
      cnpj: 0,
      razao_social: 0,
      descricao: 0,
      inscricao_estadual: 0,
      inscricao_municipal: 0,
      registro_profissional: 0,

      cep: 1,
      estado: 1,
      cidade: 1,
      bairro: 1,
      rua: 1,
      numero: 1,
      complemento: 1,

      email: 2,
      telefone_principal: 2,
      telefone_secundario: 2,
      celular: 2,
      responsavel: 2,

      segmentos: 3,
      horario_atendimento: 4,

      cidades_atendidas: 5,
      redes_sociais: 6,
      beneficios: 7,

      logotipo: 8,
      logotipo_path: 8,

      video_link: 9,
      arquivo_midia: 9,
      arquivo_midia_path: 9,
      tipo_arquivo_midia: 9,

      galeria: 10,
    }),
    []
  );

  // ✅ labels bonitos para UX
  const labelByField = useMemo<Record<string, string>>(
    () => ({
      nome_fantasia: "Nome fantasia",
      cnpj: "CPF/CNPJ",
      email: "Email",
      telefone_principal: "Telefone principal",
      responsavel: "Responsável",
      cep: "CEP",
      estado: "Estado",
      cidade: "Cidade",
      bairro: "Bairro",
      rua: "Rua",
      numero: "Número",
      inscricao_estadual: "Inscrição estadual",
      inscricao_municipal: "Inscrição municipal",
      registro_profissional: "Registro profissional",
      video_link: "Vídeo (YouTube)",
      arquivo_midia: "Arquivo (Cardápio/Portfólio/Catálogo)",
      tipo_arquivo_midia: "Tipo do arquivo",
      redes_sociais: "Redes sociais",
    }),
    []
  );

  const handleNext = () => setStep((s) => Math.min(tabs.length - 1, s + 1));
  const handlePrev = () => setStep((s) => Math.max(0, s - 1));

  const focusFieldByPath = (path: string) => {
    const selector = `[name="${path}"], [name="${path.replace(/\./g, "\\.")}"]`;
    const el = document.querySelector(selector) as HTMLElement | null;

    if (el && typeof (el as any).focus === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as any).focus();
      return;
    }

    const root = path.split(".")[0];
    const el2 = document.querySelector(`[name="${root}"]`) as HTMLElement | null;
    if (el2 && typeof (el2 as any).focus === "function") {
      el2.scrollIntoView({ behavior: "smooth", block: "center" });
      (el2 as any).focus();
    }
  };

  const goToIssue = (issue: ValidationIssue) => {
    setStep(issue.step);
    setTimeout(() => focusFieldByPath(issue.path), 250);
  };

  const buildIssuesFromErrors = (formikErrors: any): ValidationIssue[] => {
    const flat = flattenFormikErrors(formikErrors);

    const priority = ["nome_fantasia", "cnpj", "email", "telefone_principal", "responsavel"];
    flat.sort((a, b) => {
      const ap = priority.indexOf(a.path);
      const bp = priority.indexOf(b.path);
      const av = ap === -1 ? 999 : ap;
      const bv = bp === -1 ? 999 : bp;
      return av - bv;
    });

    return flat.map((e) => {
      const root = e.path.split(".")[0];
      const s = stepByField[e.path] ?? stepByField[root] ?? 0;
      const label = labelByField[e.path] ?? labelByField[root] ?? e.path;
      return { path: e.path, message: e.message, step: s, label };
    });
  };

  const handleSave = async () => {
    const f = formikRef.current;
    if (!f) return;
    if (saving) return;

    const formErrors = await f.validateForm();

    if (formErrors && Object.keys(formErrors).length > 0) {
      allowSubmitRef.current = false;

      f.setTouched(errorsToTouched(formErrors), true);

      const nextIssues = buildIssuesFromErrors(formErrors);
      setIssues(nextIssues);

      const first = nextIssues[0];
      if (first) {
        toast.error(`Corrija: ${first.label}`);
        goToIssue(first);
      } else {
        toast.error("Revise os campos obrigatórios antes de salvar.");
      }

      return;
    }

    setIssues([]);

    allowSubmitRef.current = true;
    setSaving(true);

    const savingToast = toast.loading("Salvando cliente...");

    try {
      await f.submitForm();
    } finally {
      toast.dismiss(savingToast);
      setTimeout(() => {
        allowSubmitRef.current = false;
        setSaving(false);
      }, 0);
    }
  };

  // ✅ NÃO fazer early-return que muda fluxo de hooks em produção
  const showLeadSkeleton = isFromLead && (isLoading || !lead);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {showLeadSkeleton ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <>
          {/* ✅ Modal pós-cadastro (somente pagante) */}
          {ticketsClienteId && tipoCliente === "pagante" && (
            <ClienteTicketsModal
              open={ticketsModalOpen}
              onClose={() => setTicketsModalOpen(false)}
              clienteId={ticketsClienteId}
              missingLogo={missingLogo}
              missingGaleria={missingGaleria}
              onDone={() => {
                setTicketsModalOpen(false);
                navigate("/clientes", { replace: true });
              }}
            />
          )}

          <Formik
            innerRef={formikRef}
            enableReinitialize
            initialValues={{
              // interno (front)
              tipoCliente,

              nome_fantasia: lead?.nome || "",
              razao_social: "",
              cnpj: "",
              descricao: "",

              inscricao_estadual: "",
              inscricao_municipal: "",
              registro_profissional: "",

              email: lead?.email || "",
              telefone_principal: lead?.telefone || "",
              telefone_secundario: "",
              celular: "",
              telefone_outro: "",
              whatsapp_selected: "",
              has_whatsapp_principal: false,
              has_whatsapp_secundario: false,
              has_whatsapp_celular: false,
              has_whatsapp_outro: false,
              responsavel: lead?.responsavel || "",

              enderecos: [
                {
                  nome_unidade: "Matriz",
                  cep: "",
                  estado: "",
                  cidade: lead?.cidade || "",
                  bairro: "",
                  rua: "",
                  numero: "",
                  complemento: "",
                  link_maps: "",
                  link_waze: "",
                  exibir_apenas_cidade: false,
                  is_cobranca: true,
                  endereco_compacto: ""
                }
              ],

              segmentos: [],
              cidades_atendidas: [],
              beneficios: [],
              horario_atendimento: [],

              logotipo: null,
              logotipo_path: null,
              logotipo_mime: null,

              video_link: "",

              arquivo_midia: null,
              arquivo_midia_path: null,
              arquivo_midia_mime: null,
              tipo_arquivo_midia: "cardapio",

              redes_sociais: [{}],

              contact_preference: "",
              best_contact_shift: "",
              contract_ends_at: "",

              generate_seo_keywords: true,
              seo_keywords_text: "",

              google_place_id: "",
              data_fundacao: "",
              selected_reviews: [],
              galeria: [],
              exibir_no_site: true,
              exibir_data_fundacao: true,
            }}
            validationSchema={validationSchema}
            onSubmit={async (values) => {
              if (!allowSubmitRef.current) return;

              const loadingToast = toast.loading("Finalizando...");

              try {
                const redesSociais =
                  Array.isArray(values.redes_sociais) && values.redes_sociais.length
                    ? values.redes_sociais
                    : [];

                const isGratuito = values.tipoCliente === "gratuito";

                const payload: any = {
                  nome_fantasia: values.nome_fantasia,
                  cpf_cnpj: values.cnpj,
                  razao_social: values.razao_social || null,
                  descricao: values.descricao || null,
                  exibir_no_site: values.exibir_no_site,

                  inscricao_estadual: values.inscricao_estadual || null,
                  inscricao_municipal: values.inscricao_municipal || null,
                  registro_profissional: values.registro_profissional || null,

                  segmentos: values.segmentos,
                  cidades_atendidas: values.cidades_atendidas,

                  enderecos: values.enderecos.map((e: any) => ({
                    nome_unidade: e.nome_unidade || null,
                    cep: e.cep,
                    estado: e.estado,
                    cidade: e.cidade,
                    bairro: e.bairro,
                    rua: e.rua,
                    numero: e.numero,
                    complemento: e.complemento || null,
                    telefone: e.telefone || null,
                    link_maps: e.link_maps || null,
                    link_waze: e.link_waze || null,
                    exibir_apenas_cidade: e.exibir_apenas_cidade ?? false,
                  })),

                  contatos: [
                    {
                      telefone_principal: values.telefone_principal,
                      telefone_secundario: values.telefone_secundario || null,
                      celular: values.celular || null,
                      telefone_outro: values.telefone_outro || null,
                      whatsapp_selected: values.whatsapp_selected || null,
                      has_whatsapp_principal: (values.has_whatsapp_principal || values.whatsapp_selected === 'telefone_principal') ? true : false,
                      has_whatsapp_secundario: (values.has_whatsapp_secundario || values.whatsapp_selected === 'telefone_secundario') ? true : false,
                      has_whatsapp_celular: (values.has_whatsapp_celular || values.whatsapp_selected === 'celular') ? true : false,
                      has_whatsapp_outro: (values.has_whatsapp_outro || values.whatsapp_selected === 'telefone_outro') ? true : false,
                      email_principal: values.email,
                      nome_contato: values.responsavel,
                    },
                  ],

                  redes_sociais: redesSociais,

                  tipo_cliente: values.tipoCliente,
                  status_assinatura: isGratuito ? "cancelada" : "pendente",

                  logotipo: typeof values.logotipo === "string" ? values.logotipo : null,

                  video: values.video_link || null,

                  portfolio_url: typeof values.arquivo_midia === "string" ? values.arquivo_midia : null,

                  contact_preference: values.contact_preference,
                  best_contact_shift: values.best_contact_shift,
                  contract_ends_at: values.contract_ends_at || null,

                  generate_seo_keywords: values.generate_seo_keywords,
                  seo_keywords_text:
                    values.generate_seo_keywords === false ? values.seo_keywords_text : undefined,
                  data_fundacao: values.data_fundacao || null,
                  google_place_id: values.google_place_id || null,
                  horario_atendimento: values.horario_atendimento || [],
                  reviews: values.selected_reviews || [],
                  beneficios: values.beneficios || [],
                  tipo_arquivo_midia: values.tipo_arquivo_midia || "catalogo",
                  exibir_data_fundacao: values.exibir_data_fundacao,
                };

                // 1) cria cliente
                const resp = await axios.post("/v1/clientes", payload);
                const clienteId = resp?.data?.data?.id;
                if (!clienteId) throw new Error("Cliente criado, mas não retornou ID.");

                // ✅ GRATUITO: não faz commits e não abre modal
                if (isGratuito) {
                  toast.dismiss(loadingToast);
                  toast.success("Cliente gratuito criado com sucesso!");
                  navigate("/clientes", { replace: true });
                  return;
                }

                // 2) COMMIT LOGO
                const logoTempPath =
                  normalizeTempPath(values.logotipo_path) ||
                  normalizeTempPath(
                    typeof values.logotipo === "string"
                      ? extractTempPathFromPublicUrl(values.logotipo)
                      : null
                  );

                if (logoTempPath) {
                  try {
                    await axios.post(`/v1/clientes/${clienteId}/logo/commit-temp`, {
                      temp_path: logoTempPath,
                    });
                  } catch (e) {
                    console.error("Falha ao commit do logo:", e);
                    toast.error("Cliente salvo, mas falhou ao publicar o logo.");
                  }
                }

                // 2.1) COMMIT MÍDIA
                const midiaTempPath =
                  normalizeTempPath(values.arquivo_midia_path) ||
                  normalizeTempPath(
                    typeof values.arquivo_midia === "string"
                      ? extractTempPathFromPublicUrl(values.arquivo_midia)
                      : null
                  );

                if (midiaTempPath) {
                  try {
                    await axios.post(`/v1/clientes/${clienteId}/midia/commit-temp`, {
                      temp_path: midiaTempPath,
                      tipo: values.tipo_arquivo_midia || "portfolio",
                    });
                  } catch (e) {
                    console.error("Falha ao commit da mídia:", e);
                    toast.error("Cliente salvo, mas falhou ao publicar o arquivo de mídia.");
                  }
                }

                // 3) GALERIA (cria registros + commit)
                const galeria = Array.isArray((values as any).galeria) ? (values as any).galeria : [];

                if (galeria.length) {
                  const created: Array<{ id: number; temp_path: string }> = [];

                  for (let i = 0; i < galeria.length; i++) {
                    const img = galeria[i];
                    const url = img?.url;
                    const legenda = img?.legenda ?? null;
                    const ordem = i;

                    if (!url || typeof url !== "string") continue;

                    try {
                      const r = await axios.post(`/v1/clientes/${clienteId}/galeria`, {
                        url,
                        legenda,
                        ordem,
                        thumb_url: img?.thumb_url ?? null,
                      });

                      const galeriaId = r?.data?.data?.id;

                      const tempPath =
                        normalizeTempPath(img?.path) ||
                        normalizeTempPath(extractTempPathFromPublicUrl(img?.url));

                      if (galeriaId && tempPath) created.push({ id: galeriaId, temp_path: tempPath });
                    } catch (e) {
                      console.error("Falha criando item galeria:", e);
                    }
                  }

                  if (created.length) {
                    try {
                      await axios.post(`/v1/clientes/${clienteId}/galeria/commit-temp`, {
                        items: created,
                      });
                    } catch (e) {
                      console.error("Falha commit galeria:", e);
                      toast.error("Cliente salvo, mas falhou ao publicar a galeria.");
                    }
                  }
                }

                toast.dismiss(loadingToast);

                const hasLogo = !!logoTempPath || !!values.logotipo;
                const hasGaleria =
                  Array.isArray((values as any).galeria) && (values as any).galeria.length > 0;

                const needLogo = !hasLogo;
                const needGaleria = !hasGaleria;

                if (needLogo || needGaleria) {
                  toast.success("Cliente criado! Vamos finalizar os pendentes?");
                  setTicketsClienteId(clienteId);
                  setMissingLogo(needLogo);
                  setMissingGaleria(needGaleria);
                  setTicketsModalOpen(true);
                  return;
                }

                toast.success("Cliente criado com sucesso!");
                navigate("/clientes", { replace: true });
              } catch (err: any) {
                toast.dismiss(loadingToast);
                console.error("❌ ERRO NO SUBMIT:", err?.response?.data || err);
                toast.error(err?.response?.data?.message || "Erro ao salvar cliente.");
              } finally {
                allowSubmitRef.current = false;
                setSaving(false);
              }
            }}
          >
            {({ values, setFieldValue }) => {
              const applyPrefetch = (dados: Record<string, any>, tipo: TipoCliente) => {
                // ✅ Atualiza tipo no state e no form
                setTipoCliente(tipo);
                setFieldValue("tipoCliente", tipo);

                // Identificação
                if (dados.nome_fantasia) setFieldValue("nome_fantasia", String(dados.nome_fantasia));
                if (dados.razao_social) setFieldValue("razao_social", String(dados.razao_social));

                // ✅ CNPJ: Garante que preencha mesmo que venha limpo mas presente no objeto de sugestão
                const cnpjValue = dados.cnpj || dados.cpf_cnpj;
                if (cnpjValue) {
                  setFieldValue("cnpj", String(cnpjValue));
                }

                if (dados.inscricao_estadual)
                  setFieldValue("inscricao_estadual", String(dados.inscricao_estadual));
                if (dados.inscricao_municipal)
                  setFieldValue("inscricao_municipal", String(dados.inscricao_municipal));

                // Contato
                if (dados.email) setFieldValue("email", String(dados.email));
                if (dados.telefone) setFieldValue("telefone_principal", String(dados.telefone));
                if (dados.responsavel) setFieldValue("responsavel", String(dados.responsavel));

                // Endereço (Primeira Unidade)
                if (dados.cep) setFieldValue("enderecos[0].cep", String(dados.cep));
                if (dados.estado) setFieldValue("enderecos[0].estado", String(dados.estado));
                if (dados.cidade) setFieldValue("enderecos[0].cidade", String(dados.cidade));
                if (dados.bairro) setFieldValue("enderecos[0].bairro", String(dados.bairro));
                if (dados.rua) setFieldValue("enderecos[0].rua", String(dados.rua));
                if (dados.numero) setFieldValue("enderecos[0].numero", String(dados.numero));
                if (dados.complemento) setFieldValue("enderecos[0].complemento", String(dados.complemento));

                // ✅ Redes Sociais: TabRedesSociais espera campos no root que são sincronizados pelo useEffect
                const socialIds = ["instagram", "facebook", "linkedin", "youtube", "tiktok", "x"] as const;
                socialIds.forEach((key) => {
                  if (dados[key]) {
                    setFieldValue(key, String(dados[key]));
                  }
                });

                if (dados.descricao) setFieldValue("descricao", String(dados.descricao));

                if (dados.google_place_id) setFieldValue("google_place_id", String(dados.google_place_id));
                if (dados.data_fundacao) setFieldValue("data_fundacao", String(dados.data_fundacao));
                if (dados.exibir_data_fundacao !== undefined) setFieldValue("exibir_data_fundacao", !!dados.exibir_data_fundacao);

                toast.success("Dados aplicados ao cadastro.");
              };

              return (
                <Form
                  className="space-y-6"
                  onSubmitCapture={(e) => {
                    if (!allowSubmitRef.current) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isLastStep) {
                      const el = e.target as HTMLElement;
                      if (el?.tagName !== "TEXTAREA") {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }
                  }}
                >
                  {/* ✅ Modal IA */}
                  <PreFetchModal
                    nomeInicial={values.nome_fantasia || ""}
                    cnpjInicial={values.cnpj || ""}
                    cidadeInicial={values.cidade || ""}
                    tipoCliente={tipoCliente}
                    isOpen={prefetchOpen}
                    onClose={() => setPrefetchOpen(false)}
                    onConfirm={(dados, tipo) => applyPrefetch(dados, tipo)}
                  />

                  {/* ✅ cabeçalho contextual */}
                  <div className="mb-4">
                    <div className="text-lg font-semibold text-gray-900">
                      {isFromLead ? `Novo cliente a partir do Lead #${leadId}` : "Novo cliente"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {isFromLead
                        ? "Os dados do lead são usados como base. Revise e complete as informações. Você pode usar IA para complementar."
                        : "Preencha os dados e finalize o cadastro. Você pode usar IA para pré-preencher."}
                    </div>
                  </div>

                  {/* ✅ Painel de erros */}
                  {issues.length > 0 && (
                    <div className="border border-red-200 bg-red-50 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-red-700">
                            Corrija os campos abaixo antes de salvar
                          </div>
                          <div className="text-sm text-red-700/80">
                            Clique em um item para ir direto ao campo.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIssues([])}
                          className="text-sm text-red-700 underline"
                        >
                          Fechar
                        </button>
                      </div>

                      <ul className="mt-3 space-y-2">
                        {issues.slice(0, 12).map((it, idx) => (
                          <li key={`${it.path}-${idx}`}>
                            <button
                              type="button"
                              onClick={() => goToIssue(it)}
                              className="w-full text-left px-3 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 transition"
                            >
                              <div className="text-sm font-medium text-gray-900">
                                {it.label}{" "}
                                <span className="text-xs text-gray-500">
                                  (Aba: {tabs[it.step]?.label ?? `#${it.step}`})
                                </span>
                              </div>
                              <div className="text-xs text-red-700">{it.message}</div>
                            </button>
                          </li>
                        ))}
                      </ul>

                      {issues.length > 12 && (
                        <div className="mt-2 text-xs text-red-700/80">
                          + {issues.length - 12} outros erros…
                        </div>
                      )}
                    </div>
                  )}

                  {/* ✅ Seletor Pagante/Gratuito */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm text-gray-700 font-medium">Tipo do cliente</div>

                    <select
                      value={tipoCliente}
                      onChange={(e) => {
                        const next = e.target.value as TipoCliente;

                        setTipoCliente(next);
                        setFieldValue("tipoCliente", next);

                        if (next === "gratuito" && step > 3) {
                          setStep(0);
                        }

                        if (next === "gratuito") {
                          setTicketsModalOpen(false);
                          setTicketsClienteId(null);
                          setMissingLogo(false);
                          setMissingGaleria(false);
                        }
                      }}
                      className="border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="pagante">Cliente Pagante 💰</option>
                      <option value="gratuito">Cliente Gratuito 🧾</option>
                    </select>
                  </div>

                  <TabsUI tabs={tabs} currentStep={step} setCurrentStep={setStep} />

                  <div className="mt-2 p-6 bg-white shadow rounded-xl border min-h-[420px]">
                    {tabs[step]?.label === "Identificação" && <TabIdentificacao />}
                    {tabs[step]?.label === "Endereço" && <TabEndereco />}
                    {tabs[step]?.label === "Contato" && <TabContato />}
                    {tabs[step]?.label === "Segmentos" && <TabSegmentos />}

                    {tabs[step]?.label === "Horário" && <TabHorarios />}

                    {tipoCliente === "pagante" && (
                      <>
                        {tabs[step]?.label === "Cidades" && <TabCidadesAtendidas />}
                        {tabs[step]?.label === "Redes Sociais" && <TabRedesSociais />}
                        {tabs[step]?.label === "Benefícios" && <TabBeneficios />}
                        {tabs[step]?.label === "Logotipo" && <TabLogotipo />}
                        {tabs[step]?.label === "Mídia" && <TabMidia />}
                        {tabs[step]?.label === "Galeria" && <TabGaleria />}
                        {tabs[step]?.label === "Google Reviews" && <TabGoogleReviews />}
                      </>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <button type="button" onClick={handlePrev} className="px-4 py-2 border rounded">
                      Voltar
                    </button>

                    {!isLastStep ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="px-4 py-2 bg-red-600 text-white rounded"
                      >
                        Avançar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-6 py-2 rounded text-white ${saving ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                          }`}
                      >
                        {saving ? "Salvando..." : "Salvar Cliente"}
                      </button>
                    )}
                  </div>
                </Form>
              );
            }}
          </Formik>
        </>
      )}
    </div>
  );
}
