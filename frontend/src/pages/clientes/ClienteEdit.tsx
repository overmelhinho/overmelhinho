// /var/www/frontend/src/pages/clientes/ClienteEdit.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

function redesArrayToObject(arr: any[]): Record<string, string> {
  const out: Record<string, string> = {
    facebook: "",
    instagram: "",
    linkedin: "",
    youtube: "",
    tiktok: "",
    x: "",
  };

  if (!Array.isArray(arr)) return out;

  for (const item of arr) {
    const tipo = (item?.tipo || "").toString().toLowerCase();
    const url = (item?.url || "").toString();
    if (!tipo || !url) continue;
    if (tipo in out) out[tipo] = url;
  }

  return out;
}

function ensureRedesFormik(values: any): any[] {
  // TabRedesSociais espera SEMPRE redes_sociais[0] como objeto {facebook,...}
  const v = values;
  const current = Array.isArray(v?.redes_sociais) ? v.redes_sociais : [];

  if (current.length && current[0] && typeof current[0] === "object") return current;

  // fallback
  return [{ facebook: "", instagram: "", linkedin: "", youtube: "", tiktok: "", x: "" }];
}

export default function ClienteEdit() {
  const { id } = useParams();
  const clienteId = Number(id);
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>("pagante");

  const formikRef = useRef<any>(null);
  const allowSubmitRef = useRef(false);
  const [saving, setSaving] = useState(false);

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
    cnpj: Yup.string().required("CPF/CNPJ é obrigatório"),
    email: Yup.string().email("Email inválido").nullable(),
    telefone_principal: Yup.string().required("Telefone principal é obrigatório"),
    responsavel: Yup.string().required("Responsável é obrigatório"),
  });

  const tabs = useMemo(() => {
    const base = [
      { id: 0, label: "Identificação" },
      { id: 1, label: "Endereço" },
      { id: 2, label: "Contato" },
    ];

    if (tipoCliente === "pagante") {
      base.push(
        { id: 3, label: "Cidades" },
        { id: 4, label: "Redes Sociais" },
        { id: 5, label: "Segmentos" },
        { id: 6, label: "Benefícios" },
        { id: 7, label: "Horário" },
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

    const endereco = Array.isArray(c?.enderecos) ? c.enderecos[0] : c?.endereco;
    const contato = Array.isArray(c?.contatos) ? c.contatos[0] : c?.contato;

    const tipo = (c?.tipo_cliente || "pagante").toString().toLowerCase();
    const tipoNorm: TipoCliente = tipo === "gratuito" ? "gratuito" : "pagante";

    const redesObj = redesArrayToObject(Array.isArray(c?.redes_sociais) ? c.redes_sociais : []);

    // galeria (se backend retornar algo como galeria/galeria_imagens/galerias)
    const galeriaRaw =
      Array.isArray(c?.galeria) ? c.galeria :
        Array.isArray(c?.galeria_imagens) ? c.galeria_imagens :
          Array.isArray(c?.galerias) ? c.galerias :
            [];

    const galeria = (galeriaRaw || []).map((g: any, idx: number) => ({
      id: g?.id ? String(g.id) : crypto.randomUUID(),
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

      inscricao_estadual: c?.inscricao_estadual || "",
      inscricao_municipal: c?.inscricao_municipal || "",
      registro_profissional: c?.registro_profissional || "",

      email: contato?.email_principal || c?.email || "",
      telefone_principal: contato?.telefone_principal || "",
      telefone_secundario: contato?.telefone_secundario || "",
      celular: contato?.celular || "",
      telefone_outro: contato?.telefone_outro || "",
      whatsapp_selected: contato?.whatsapp_selected || "telefone_principal",
      exibir_tel_principal: !!contato?.exibir_tel_principal,
      exibir_tel_secundario: !!contato?.exibir_tel_secundario,
      exibir_celular: !!contato?.exibir_celular,
      exibir_tel_outro: !!contato?.exibir_tel_outro,
      exibir_email: !!contato?.exibir_email,
      responsavel: contato?.nome_contato || c?.responsavel || "",

      cep: endereco?.cep || "",
      estado: endereco?.estado || "",
      cidade: endereco?.cidade || "",
      bairro: endereco?.bairro || "",
      rua: endereco?.rua || "",
      numero: endereco?.numero || "",
      complemento: endereco?.complemento || "",

      segmentos: Array.isArray(c?.segmentos) ? c.segmentos.map((s: any) => s.id ?? s) : [],
      cidades_atendidas: Array.isArray(c?.cidades_atendidas)
        ? c.cidades_atendidas.map((x: any) => x.id ?? x)
        : [],

      beneficios: Array.isArray(c?.beneficios) ? c.beneficios : [],
      horario_atendimento: c?.horario_atendimento || "",
      data_fundacao: c?.data_fundacao ? c.data_fundacao.split("T")[0] : "",
      google_place_id: c?.google_place_id || "",

      // uploads
      logotipo: c?.logo_url || c?.logotipo || null,
      logotipo_path: null,
      logotipo_mime: null,

      video_link: c?.video || c?.video_link || "",

      arquivo_midia: c?.portfolio_url || c?.arquivo_midia || null,
      arquivo_midia_path: null,
      arquivo_midia_mime: null,
      tipo_arquivo_midia: c?.tipo_arquivo_midia || "cardapio",

      // redes sociais: TabRedesSociais espera SEMPRE redes_sociais[0].facebook...
      redes_sociais: [{ ...redesObj }],

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
    };
  }, [data]);

  const handleNext = () => setStep((s) => Math.min(tabs.length - 1, s + 1));
  const handlePrev = () => setStep((s) => Math.max(0, s - 1));

  const handleSave = async () => {
    const f = formikRef.current;
    if (!f) return;
    if (saving) return;

    const errs = await f.validateForm();
    if (errs && Object.keys(errs).length) {
      toast.error("Revise os campos obrigatórios antes de salvar.");
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

              inscricao_estadual: values.inscricao_estadual || null,
              inscricao_municipal: values.inscricao_municipal || null,
              registro_profissional: values.registro_profissional || null,

              segmentos: values.segmentos,
              cidades_atendidas: values.cidades_atendidas,

              endereco: {
                cep: values.cep,
                estado: values.estado,
                cidade: values.cidade,
                bairro: values.bairro,
                rua: values.rua,
                numero: values.numero,
                complemento: values.complemento || null,
              },

              contatos: [
                {
                  telefone_principal: values.telefone_principal,
                  telefone_secundario: values.telefone_secundario || null,
                  celular: values.celular || null,
                  telefone_outro: values.telefone_outro || null,
                  whatsapp_selected: values.whatsapp_selected || null,
                  exibir_tel_principal: values.exibir_tel_principal ?? false,
                  exibir_tel_secundario: values.exibir_tel_secundario ?? false,
                  exibir_celular: values.exibir_celular ?? false,
                  exibir_tel_outro: values.exibir_tel_outro ?? false,
                  exibir_email: values.exibir_email ?? false,
                  email_principal: values.email || null,
                  nome_contato: values.responsavel,
                },
              ],

              // redes sociais no formato que o backend já aceita no create
              redes_sociais: redesFixed,

              tipo_cliente: values.tipoCliente,

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
            const itemsToCommit: Array<{ id: number; temp_path: string }> = [];

            // cria/atualiza itens (se existir endpoint específico, você já tem no create)
            // Aqui mantemos a compatibilidade: se vierem itens com temp=true, criamos novos e comitamos
            for (let i = 0; i < galeria.length; i++) {
              const img = galeria[i];
              const url = img?.url;
              if (!url || typeof url !== "string") continue;

              const isTemp =
                !!img?.temp ||
                (typeof img?.path === "string" && img.path.includes("temp/")) ||
                !!extractTempPathFromPublicUrl(url);

              if (!isTemp) continue;

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
        {({ values, setFieldValue }) => (
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
            <div className="mb-4">
              <div className="text-lg font-semibold text-gray-900">
                {values.nome_fantasia || "Editar cliente"}
              </div>
              <div className="text-sm text-gray-500">
                Editar cadastro do cliente
              </div>
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
                  if (next === "gratuito" && step > 2) setStep(0);
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
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
              )}
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
