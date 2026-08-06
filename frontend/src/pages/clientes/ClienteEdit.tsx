// /var/www/frontend/src/pages/clientes/ClienteEdit.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Save, RotateCcw, AlertTriangle, ExternalLink } from "lucide-react";

import axios from "@/services/api";
import Skeleton from "@/components/ui/skeleton";
import TabsUI from "@/components/TabsUI";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, ChevronLeft } from "lucide-react";

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
import TabFinanceiro from "./create/steps/TabFinanceiro";
import TabAuditoria from "./create/steps/TabAuditoria";
import TabGoogleReviews from "./create/steps/TabGoogleReviews";
import SeoPerformanceWidget from "@/components/seo/SeoPerformanceWidget";

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

function ensureRedesFormik(values: any): any[] {
  // Retorna o array de redes_sociais no formato [{tipo, url}]
  const current = Array.isArray(values?.redes_sociais) ? values.redes_sociais : [];
  // Filtra só entradas com tipo e url não vazios
  return current
    .filter((r: any) => r && typeof r === 'object' && 'tipo' in r)
    .filter((r: any) => r.url && String(r.url).trim());
}

export default function ClienteEdit() {
  const { id } = useParams();
  const clienteId = Number(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const initialStep = useMemo(() => {
    const s = searchParams.get("step");
    return s ? Number(s) : 0;
  }, [searchParams]);

  const [step, setStep] = useState(initialStep);
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>("pagante");

  const formikRef = useRef<any>(null);
  const allowSubmitRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const isMobile = useIsMobile();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["cliente", clienteId],
    enabled: Number.isFinite(clienteId) && clienteId > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const resp = await axios.get(`/v1/clientes/${clienteId}`);
      // pode ser data.data ou data direto, então normaliza
      return resp?.data?.data ?? resp?.data ?? null;
    },
  });

  const validationSchema = Yup.object({
    nome_fantasia: Yup.string().required("Nome fantasia é obrigatório"),
    cnpj: Yup.string().nullable(),
    email: Yup.string().email("Email inválido").nullable(),
    telefone_principal: Yup.string()
      .min(8, "Telefone muito curto")
      .required("Telefone principal é obrigatório"),
    responsavel: Yup.string().nullable(),
  });

  const tabs = useMemo(() => {
    const base = [
      { id: 0, label: "Identificação" },
      { id: 1, label: "Endereço" },
      { id: 2, label: "Contato" },
      { id: 3, label: "Segmentos" }, // ✅ Agora disponível para todos os tipos
      { id: 4, label: "Horário" }, // ✅ Agora disponível para todos os tipos
    ];

    if (tipoCliente === "pagante") {
      base.push(
        { id: 5, label: "Cidades" },
        { id: 6, label: "Redes Sociais" },
        { id: 7, label: "Benefícios" },
        { id: 8, label: "Logotipo" },
        { id: 9, label: "Mídia" },
        { id: 10, label: "Galeria" },
        { id: 11, label: "Google Reviews" },
        { id: 12, label: "Financeiro" }
      );
    }

    // New SEO Performance Tab
    base.push({ id: base.length, label: "Performance" });

    // Add "Histórico" as the last tab
    base.push({ id: base.length, label: "Histórico" });

    return base;
  }, [tipoCliente]);

  const isLastStep = step >= tabs.length - 1;

  useEffect(() => {
    // quando carregar cliente, aplica tipo_cliente no state (pagante/gratuito)
    const t = (data?.tipo_cliente || "").toString().toLowerCase();
    if (t === "gratuito" || t === "pagante") setTipoCliente(t);
  }, [data?.tipo_cliente]);

  const initialValues = useMemo(() => {
    const c = data || {};

    const enderecos = Array.isArray(c?.enderecos) ? c.enderecos : (c?.endereco ? [c.endereco] : []);
    const endereco0 = enderecos[0] || {};
    const contato = Array.isArray(c?.contatos) ? c.contatos[0] : c?.contato;

    const tipo = (c?.tipo_cliente || "pagante").toString().toLowerCase();
    const tipoNorm: TipoCliente = tipo === "gratuito" ? "gratuito" : "pagante";

    // galeria (se backend retornar algo como galeria/galeria_imagens/galerias)
    const galeriaRaw =
      Array.isArray(c?.galeria) ? c.galeria :
        Array.isArray(c?.galeria_imagens) ? c.galeria_imagens :
          Array.isArray(c?.galerias) ? c.galerias :
            [];

    const galeria = (galeriaRaw || []).map((g: any, idx: number) => ({
      id: g?.id ? String(g.id) : (typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
      url: g?.url || g?.public_url || "",
      thumb_url: g?.thumb_url || g?.url || g?.public_url || "",
      legenda: g?.legenda || "",
      size: g?.size || g?.size_kb ? `≈ ${Math.round(Number(g.size_kb))} KB` : "",
      temp: false,
      path: g?.path || null,
      mime: g?.mime || null,
      name: g?.name || null,
      ordem: typeof g?.ordem === "number" ? g.ordem : idx,
    })).filter((x: any) => !!x.url);

    return {
      id: clienteId,
      // interno
      tipoCliente: tipoNorm,

      nome_fantasia: c?.nome_fantasia || "",
      razao_social: c?.razao_social || "",
      cnpj: c?.cpf_cnpj || c?.cnpj || "",

      descricao: c?.descricao || "",
      observacoes: c?.observacoes || "",

      inscricao_estadual: c?.inscricao_estadual || "",
      inscricao_municipal: c?.inscricao_municipal || "",
      registro_profissional: c?.registro_profissional || "",

      email: contato?.email_principal || c?.email || "",
      telefone_principal: contato?.telefone_principal || "",
      obs_telefone_principal: contato?.obs_telefone_principal || "",
      telefone_secundario: contato?.telefone_secundario || "",
      obs_telefone_secundario: contato?.obs_telefone_secundario || "",
      celular: contato?.celular || "",
      obs_celular: contato?.obs_celular || "",
      telefone_outro: contato?.telefone_outro || "",
      obs_telefone_outro: contato?.obs_telefone_outro || "",
      whatsapp_selected: contato?.whatsapp_selected || "",
      has_whatsapp_principal: !!contato?.has_whatsapp_principal,
      has_whatsapp_secundario: !!contato?.has_whatsapp_secundario,
      has_whatsapp_celular: !!contato?.has_whatsapp_celular,
      has_whatsapp_outro: !!contato?.has_whatsapp_outro,
      exibir_tel_principal: !!contato?.exibir_tel_principal,
      telefone_principal_hidden_until: contato?.telefone_principal_hidden_until || null,
      exibir_tel_secundario: !!contato?.exibir_tel_secundario,
      exibir_celular: !!contato?.exibir_celular,
      exibir_tel_outro: !!contato?.exibir_tel_outro,
      exibir_email: !!contato?.exibir_email,
      responsavel: contato?.nome_contato || c?.responsavel || "",

      // LEGACY (opcional, para não quebrar componentes que ainda usam campo único)
      cep: endereco0?.cep || "",
      estado: endereco0?.estado || "",
      cidade: endereco0?.cidade || "",
      bairro: endereco0?.bairro || "",
      rua: endereco0?.rua || "",
      numero: endereco0?.numero || "",
      complemento: endereco0?.complemento || "",

      enderecos: enderecos.map((e: any, idx: number) => ({
        id: e?.id || null,
        nome_unidade: e?.nome_unidade || "",
        cep: e?.cep || "",
        estado: e?.estado || "",
        cidade: e?.cidade || "",
        bairro: e?.bairro || "",
        tipo_logradouro: e?.tipo_logradouro || "",
        rua: e?.rua || "",
        numero: e?.numero || "",
        complemento: e?.complemento || "",
        telefone: e?.telefone || "",
        link_maps: e?.link_maps || "",
        link_waze: e?.link_waze || "",
        latitude: e?.latitude || "",
        longitude: e?.longitude || "",
        exibir_apenas_cidade: e?.exibir_apenas_cidade === "false" || e?.exibir_apenas_cidade === false ? false : (e?.exibir_apenas_cidade ? true : false),
        is_cobranca: e?.is_cobranca === "false" || e?.is_cobranca === false ? false : (e?.is_cobranca === "true" || e?.is_cobranca === true ? true : (idx === 0)),
        endereco_compacto: e?.endereco_compacto || "",
      })),

      segmentos: Array.isArray(c?.segmentos) ? c.segmentos.map((s: any) => s.id ?? s) : [],
      cidades_atendidas: Array.isArray(c?.cidades_atendidas)
        ? c.cidades_atendidas.map((x: any) => x.id ?? x)
        : [],

      beneficios: c?.beneficios || [],
      horario_atendimento: Array.isArray(c?.horario_atendimento)
        ? c.horario_atendimento
        : [],
      observacoes_horario: c?.observacoes_horario || "",
      is_horario_marcado: c?.is_horario_marcado === true || c?.is_horario_marcado === "true",
      data_fundacao: c?.data_fundacao ? c.data_fundacao.split("T")[0] : "",
      google_place_id: c?.google_place_id || "",
      exibir_data_fundacao: c?.exibir_data_fundacao === "true" || c?.exibir_data_fundacao === true ? true : false,

      // uploads
      logotipo: c?.logotipo_url || c?.logo_url || c?.logotipo || null,
      logotipo_path: null,
      logotipo_mime: null,

      banner: c?.banner_url || null,
      banner_path: null,

      video_link: c?.video || c?.video_link || "",

      arquivo_midia: c?.portfolio_url || c?.arquivo_midia || null,
      arquivo_midia_path: null,
      arquivo_midia_mime: null,
      tipo_arquivo_midia: c?.tipo_arquivo_midia || "cardapio",

      // redes sociais: mantém no formato [{tipo, url}] para suportar múltiplos do mesmo tipo
      redes_sociais: Array.isArray(c?.redes_sociais) && c.redes_sociais.length > 0 && c.redes_sociais[0]?.tipo
        ? c.redes_sociais  // já está no formato correto [{tipo, url}]
        : [],  // formulário em branco (a tab vai mostrar o campo vazio)

      // seo
      generate_seo_keywords: c?.generate_seo_keywords !== false,
      seo_keywords_text: c?.seo_keywords_text || (typeof c?.seo_keywords === "string" ? c.seo_keywords : ""),
      seo_keywords: Array.isArray(c?.seo_keywords) ? c.seo_keywords : undefined,

      // galeria
      galeria,

      // renovação e contatos
      contact_preference: c?.contact_preference || "",
      best_contact_shift: c?.best_contact_shift || "",
      contract_ends_at: c?.contract_ends_at ? c.contract_ends_at.split('T')[0] : "",

      // google reviews
      reviews: Array.isArray(c?.reviews) ? c.reviews.map((r: any) => ({
        ...r,
        google_review_id: r.google_review_id || (r.time && r.author_name ? `${r.time}_${r.author_name}` : null),
        profile_photo_url: r.author_photo_url || r.profile_photo_url || ""
      })) : [],
      exibir_no_site: c?.exibir_no_site === "false" || c?.exibir_no_site === false ? false : true,
    };
  }, [data]);

  const handleNext = () => {
    const f = formikRef.current;
    if (f && tabs[step]?.label === "Endereço") {
      const hasError = f.values.enderecos?.some((e: any) => 
        (e.is_cobranca !== false) && (e.endereco_compacto?.length || 0) > 40
      );
      if (hasError) {
        toast.error("Atenção: O endereço de cobrança excede 40 caracteres. Ajuste para prosseguir.");
        return;
      }
    }
    setStep((s) => Math.min(tabs.length - 1, s + 1));
  };
  const handlePrev = () => setStep((s) => Math.max(0, s - 1));

  const handleSave = async () => {
    const f = formikRef.current;
    if (!f) return;
    if (saving) return;

    const errs = await f.validateForm();
    if (errs && Object.keys(errs).length) {
      console.log("Erros de validação:", errs);
      const campos = Object.keys(errs).join(", ");
      toast.error(`Revise os campos obrigatórios: ${campos}`);
      return;
    }

    allowSubmitRef.current = true;
    setSaving(true);

    const t = toast.loading("Salvando alterações...");

    try {
      await f.submitForm();
    } finally {
      toast.dismiss(t);
      setSaving(false);
      allowSubmitRef.current = false;
    }
  };

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  if (isError || !data) {
    return (
      <div className="p-6 bg-white rounded-xl border">
        <div className="text-lg font-semibold text-red-600">Erro ao carregar cliente.</div>
        <div className="text-sm text-gray-600 mt-1">
          Verifique a API <b>/v1/clientes/{clienteId}</b>.
        </div>
        <button
          type="button"
          onClick={() => navigate("/clientes")}
          className="mt-4 px-4 py-2 border rounded"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <Formik
        innerRef={formikRef}
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          if (!allowSubmitRef.current) return;

          const loadingToast = toast.loading("Atualizando...");

          try {
            const redesFixed = ensureRedesFormik(values);

            const payload: any = {
              nome_fantasia: values.nome_fantasia,
              cpf_cnpj: values.cnpj,
              razao_social: values.razao_social || null,
              descricao: values.descricao || null,
              observacoes: values.observacoes || null,
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
                tipo_logradouro: e.tipo_logradouro || null,
                rua: e.rua,
                numero: e.numero,
                complemento: e.complemento || null,
                telefone: e.telefone || null,
                link_maps: e.link_maps || null,
                link_waze: e.link_waze || null,
                exibir_apenas_cidade: e.exibir_apenas_cidade ?? false,
                is_cobranca: e.is_cobranca ?? false,
                endereco_compacto: e.endereco_compacto || null,
              })),

              contatos: [
                {
                  telefone_principal: values.telefone_principal,
                  obs_telefone_principal: values.obs_telefone_principal || null,
                  telefone_secundario: values.telefone_secundario || null,
                  obs_telefone_secundario: values.obs_telefone_secundario || null,
                  celular: values.celular || null,
                  obs_celular: values.obs_celular || null,
                  telefone_outro: values.telefone_outro || null,
                  obs_telefone_outro: values.obs_telefone_outro || null,
                  whatsapp_selected: values.whatsapp_selected || null,
                  has_whatsapp_principal: (values.has_whatsapp_principal || values.whatsapp_selected === 'telefone_principal') ? true : false,
                  has_whatsapp_secundario: (values.has_whatsapp_secundario || values.whatsapp_selected === 'telefone_secundario') ? true : false,
                  has_whatsapp_celular: (values.has_whatsapp_celular || values.whatsapp_selected === 'celular') ? true : false,
                  has_whatsapp_outro: (values.has_whatsapp_outro || values.whatsapp_selected === 'telefone_outro') ? true : false,
                  exibir_tel_principal: values.exibir_tel_principal ?? false,
                  telefone_principal_hidden_until: values.telefone_principal_hidden_until || null,
                  exibir_tel_secundario: values.exibir_tel_secundario ?? false,
                  exibir_celular: values.exibir_celular ?? false,
                  exibir_tel_outro: values.exibir_tel_outro ?? false,
                  exibir_email: values.exibir_email ?? false,
                  email_principal: values.email || null,
                  nome_contato: values.responsavel,
                },
              ],

              // redes sociais no formato [{tipo, url}] que o backend aceita nativamente
              redes_sociais: ensureRedesFormik(values),

              tipo_cliente: values.tipoCliente,

              logotipo: typeof values.logotipo === "string" ? values.logotipo : null,
              banner_url: typeof values.banner === "string" ? values.banner : null,
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
              exibir_data_fundacao: values.exibir_data_fundacao,
              horario_atendimento: values.horario_atendimento || [],
              observacoes_horario: values.observacoes_horario || null,
              is_horario_marcado: values.is_horario_marcado || false,
              reviews: values.reviews || [],
              beneficios: values.beneficios || [],
              tipo_arquivo_midia: values.tipo_arquivo_midia || "catalogo",
            };

            // ✅ UPDATE
            await axios.put(`/v1/clientes/${clienteId}`, payload);

            // ✅ commit de uploads temp (se houver)
            const logoTempPath =
              normalizeTempPath(values.logotipo_path) ||
              normalizeTempPath(
                typeof values.logotipo === "string" ? extractTempPathFromPublicUrl(values.logotipo) : null
              );

            if (logoTempPath) {
              try {
                await axios.post(`/v1/clientes/${clienteId}/logo/commit-temp`, {
                  temp_path: logoTempPath,
                });
              } catch (e) {
                console.error("Falha commit logo:", e);
                toast.error("Alterações salvas, mas falhou ao publicar o logo.");
              }
            }

            const bannerTempPath =
              normalizeTempPath(values.banner_path) ||
              normalizeTempPath(
                typeof values.banner === "string" ? extractTempPathFromPublicUrl(values.banner) : null
              );

            if (bannerTempPath) {
              try {
                await axios.post(`/v1/clientes/${clienteId}/banner/commit-temp`, {
                  temp_path: bannerTempPath,
                });
              } catch (e) {
                console.error("Falha commit banner:", e);
                toast.error("Alterações salvas, mas falhou ao publicar a capa.");
              }
            }

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
                console.error("Falha commit mídia:", e);
                toast.error("Alterações salvas, mas falhou ao publicar a mídia.");
              }
            }

            // Galeria (se usuário adicionou itens temp via TabGaleria)
            const galeria = Array.isArray((values as any).galeria) ? (values as any).galeria : [];
            const originalGaleria = Array.isArray(initialValues.galeria) ? initialValues.galeria : [];
            const currentIds = new Set(galeria.map((g: any) => String(g.id)));

            // 1) Deletar removidos
            const toDelete = originalGaleria.filter((g: any) => !g.temp && !currentIds.has(String(g.id)));
            for (const img of toDelete) {
              try {
                await axios.delete(`/v1/clientes/${clienteId}/galeria/${img.id}`);
              } catch (e) {
                console.error("Falha ao deletar imagem da galeria", e);
              }
            }

            const itemsToCommit: Array<{ id: number; temp_path: string }> = [];

            // 2) Cria/Atualiza itens
            for (let i = 0; i < galeria.length; i++) {
              const img = galeria[i];
              const url = img?.url;
              if (!url || typeof url !== "string") continue;

              const isTemp =
                !!img?.temp ||
                (typeof img?.path === "string" && img.path.includes("temp/")) ||
                !!extractTempPathFromPublicUrl(url);

              if (isTemp) {
                try {
                  const r = await axios.post(`/v1/clientes/${clienteId}/galeria`, {
                    url,
                    legenda: img?.legenda ?? null,
                    ordem: i,
                    thumb_url: img?.thumb_url ?? null,
                  });

                  const galeriaId = r?.data?.data?.id;

                  const tempPath =
                    normalizeTempPath(img?.path) || normalizeTempPath(extractTempPathFromPublicUrl(url));

                  if (galeriaId && tempPath) itemsToCommit.push({ id: galeriaId, temp_path: tempPath });
                } catch (e) {
                  console.error("Falha criando item galeria:", e);
                }
              } else {
                try {
                  await axios.put(`/v1/clientes/${clienteId}/galeria/${img.id}`, {
                    url,
                    legenda: img?.legenda ?? null,
                    ordem: i,
                    thumb_url: img?.thumb_url ?? null,
                  });
                } catch (e) {
                  console.error("Falha atualizando item galeria:", e);
                }
              }
            }

            if (itemsToCommit.length) {
              try {
                await axios.post(`/v1/clientes/${clienteId}/galeria/commit-temp`, {
                  items: itemsToCommit,
                });
              } catch (e) {
                console.error("Falha commit galeria:", e);
                toast.error("Alterações salvas, mas falhou ao publicar a galeria.");
              }
            }

            toast.dismiss(loadingToast);
            queryClient.invalidateQueries({ queryKey: ["clientes"] });
            queryClient.invalidateQueries({ queryKey: ["cliente", clienteId] });
            queryClient.invalidateQueries({ queryKey: ["client-audit-logs", clienteId] });
            toast.success("Cliente atualizado com sucesso!");
            navigate("/clientes");
          } catch (err: any) {
            toast.dismiss(loadingToast);
            console.error(err?.response?.data || err);
            toast.error(err?.response?.data?.message || "Erro ao salvar alterações.");
          } finally {
            allowSubmitRef.current = false;
            setSaving(false);
          }
        }}
      >
        {({ values, setFieldValue, dirty, resetForm }) => (
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
            <div className="mb-4 flex justify-between items-start">
              <div className="flex flex-col gap-2">
                {isMobile && (
                  <button 
                    type="button" 
                    onClick={() => navigate(`/clientes/${clienteId}/venda`)}
                    className="flex items-center gap-1 text-xs font-bold text-red-600 mb-2 uppercase tracking-widest"
                  >
                    <ChevronLeft className="w-4 h-4" /> Modo Venda
                  </button>
                )}
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {values.nome_fantasia || "Editar cliente"}
                  </div>
                  <div className="text-sm text-gray-500">
                    Editar cadastro do cliente
                  </div>
                </div>
              </div>

              {data?.slug && (
                <a
                  href={`${typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:3000" : typeof window !== "undefined" && window.location.hostname.includes("novo") ? "https://novo.overmelhinho.com.br" : "https://overmelhinho.com.br"}/cliente/${data.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  <ExternalLink size={14} />
                  Ver no site
                </a>
              )}
            </div>

            {/* Tipo do cliente */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm text-gray-700 font-medium">Tipo do cliente</div>

              <select
                value={tipoCliente}
                onChange={(e) => {
                  const next = e.target.value as TipoCliente;
                  setTipoCliente(next);
                  setFieldValue("tipoCliente", next);
                  if (next === "gratuito" && step > 4) setStep(0);
                }}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="pagante">Cliente Pagante 💰</option>
                <option value="gratuito">Cliente Gratuito 🧾</option>
              </select>
            </div>

            {!isMobile ? (
              <>
                <TabsUI tabs={tabs} currentStep={step} setCurrentStep={setStep} />

                <div className="mt-2 p-6 bg-white shadow rounded-xl border min-h-[420px]">
                  {tabs[step]?.label === "Identificação" && <TabIdentificacao />}
                  {tabs[step]?.label === "Endereço" && <TabEndereco />}
                  {tabs[step]?.label === "Contato" && <TabContato />}
                  {tabs[step]?.label === "Cidades" && <TabCidadesAtendidas />}
                  {tabs[step]?.label === "Redes Sociais" && <TabRedesSociais />}
                  {tabs[step]?.label === "Segmentos" && <TabSegmentos />}
                  {tabs[step]?.label === "Benefícios" && <TabBeneficios />}
                  {tabs[step]?.label === "Horário" && <TabHorarios />}
                  {tabs[step]?.label === "Logotipo" && <TabLogotipo />}
                  {tabs[step]?.label === "Mídia" && <TabMidia />}
                  {tabs[step]?.label === "Galeria" && <TabGaleria />}
                  {tabs[step]?.label === "Google Reviews" && <TabGoogleReviews />}
                  {tabs[step]?.label === "Financeiro" && <TabFinanceiro />}
                  {tabs[step]?.label === "Performance" && <SeoPerformanceWidget clientId={clienteId} />}
                  {tabs[step]?.label === "Histórico" && <TabAuditoria />}
                </div>

                <div className="flex justify-between mt-6">
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
                      {saving ? "Salvando..." : "Salvar alterações"}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
                {tabs.map((tab, idx) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setStep(idx);
                      setMobileDrawerOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition active:bg-slate-100 text-left"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-base">{tab.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Dialog/Drawer for Mobile */}
            <Dialog open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
              <DialogContent className="sm:max-w-md w-full h-[90vh] md:h-auto md:max-h-[90vh] overflow-hidden p-0 flex flex-col rounded-t-[24px] rounded-b-none bottom-0 top-auto translate-y-0 fixed mt-auto md:rounded-2xl md:relative md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:mt-0 transition-transform bg-white">
                <div className="sticky top-0 bg-white z-10 border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm shrink-0">
                  <DialogTitle className="text-xl font-black text-slate-900">{tabs[step]?.label}</DialogTitle>
                </div>
                <div className="p-6 bg-slate-50/50 flex-1 overflow-y-auto">
                  {tabs[step]?.label === "Identificação" && <TabIdentificacao />}
                  {tabs[step]?.label === "Endereço" && <TabEndereco />}
                  {tabs[step]?.label === "Contato" && <TabContato />}
                  {tabs[step]?.label === "Cidades" && <TabCidadesAtendidas />}
                  {tabs[step]?.label === "Redes Sociais" && <TabRedesSociais />}
                  {tabs[step]?.label === "Segmentos" && <TabSegmentos />}
                  {tabs[step]?.label === "Benefícios" && <TabBeneficios />}
                  {tabs[step]?.label === "Horário" && <TabHorarios />}
                  {tabs[step]?.label === "Logotipo" && <TabLogotipo />}
                  {tabs[step]?.label === "Mídia" && <TabMidia />}
                  {tabs[step]?.label === "Galeria" && <TabGaleria />}
                  {tabs[step]?.label === "Google Reviews" && <TabGoogleReviews />}
                  {tabs[step]?.label === "Financeiro" && <TabFinanceiro />}
                  {tabs[step]?.label === "Performance" && <SeoPerformanceWidget clientId={clienteId} />}
                  {tabs[step]?.label === "Histórico" && <TabAuditoria />}
                  
                  <div className="mt-8 mb-4">
                    <button
                      type="button"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-slate-800 transition active:scale-95"
                    >
                      Concluído
                    </button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Floating Save Bar */}
            <AnimatePresence>
              {(dirty || saving) && (
                <motion.div
                  initial={{ y: 100, x: "-50%", opacity: 0 }}
                  animate={{ y: 0, x: "-50%", opacity: 1 }}
                  exit={{ y: 100, x: "-50%", opacity: 0 }}
                  className="fixed bottom-24 md:bottom-8 left-1/2 z-[60] w-[92%] max-w-2xl"
                >
                  <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-3 md:p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">
                    <div className="flex items-center gap-3 text-white pl-1 w-full md:w-auto">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold">Alterações pendentes</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black hidden sm:block">Você modificou este cliente</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto mt-1 md:mt-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Deseja descartar todas as alterações não salvas?")) {
                            resetForm();
                          }
                        }}
                        disabled={saving}
                        className="flex-1 md:flex-none flex justify-center items-center gap-2 px-3 py-3 md:py-2 text-slate-300 hover:bg-slate-800 rounded-xl transition-colors text-[10px] sm:text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Descartar
                      </button>

                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-[2] md:flex-none flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 md:px-6 py-3 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-lg shadow-red-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Salvar Agora
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Form>
        )}
      </Formik>
    </div>
  );
}
