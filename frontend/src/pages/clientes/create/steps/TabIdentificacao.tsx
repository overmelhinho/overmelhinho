import { useFormikContext } from "formik";
import { useMemo, useRef, useState } from "react";
import { Building2, FileText, Hash, Briefcase, Tag, Eye, EyeOff, Sparkles, X, Calendar, MapPin, Search } from "lucide-react";
import MaskedInput from "@/components/ui/masked-input";
import axios from "@/services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const splitKeywords = (text: string): string[] => {
  if (!text) return [];
  return text
    .replace(/#/g, " ")
    .split(/[,;\n]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
};

const normalizeKeywords = (items: string[], limit = 100): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const it of items) {
    const k = (it || "").trim().replace(/\s+/g, " ");
    if (!k) continue;
    const key = k.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(k);
    if (out.length >= limit) break;
  }

  return out;
};

export default function TabIdentificacao() {
  const navigate = useNavigate();
  const { values, handleChange, setFieldValue } = useFormikContext<any>();
  const [cnpjError, setCnpjError] = useState("");
  const [showPreviewDescricao, setShowPreviewDescricao] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isPredictingFoundation, setIsPredictingFoundation] = useState(false);
  const [isLookingUpGoogle, setIsLookingUpGoogle] = useState(false);

  const [clienteExistente, setClienteExistente] = useState<{ id: number; nome: string } | null>(null);
  const [checkingCnpj, setCheckingCnpj] = useState(false);

  const handleAiFoundation = async () => {
    if (!values.nome_fantasia || !values.cidade) {
      toast.error("Preencha o Nome e a Cidade primeiro.");
      return;
    }
    setIsPredictingFoundation(true);
    try {
      const { data } = await axios.get("/v1/clientes/ai-foundation", {
        params: { nome: values.nome_fantasia, cidade: values.cidade }
      });
      if (data.data_fundacao) {
        setFieldValue("data_fundacao", data.data_fundacao);
        toast.success("Data de fundação encontrada!");
      } else {
        toast.error("Não foi possível encontrar a data.");
      }
    } catch (err) {
      toast.error("Erro ao buscar data de fundação.");
    } finally {
      setIsPredictingFoundation(false);
    }
  };

  useMemo(() => {
    const raw = (values.cnpj || "").replace(/\D/g, "");
    if (raw.length === 11 || raw.length === 14) {
      (async () => {
        setCheckingCnpj(true);
        try {
          const { data } = await axios.get("/v1/clientes/check-cnpj", { params: { cnpj: raw } });
          if (data.exists && data.id != values.id) {
            setClienteExistente({ id: data.id, nome: data.nome });
          } else {
            setClienteExistente(null);
          }
        } catch (e) {
          console.error("Erro ao checar documento", e);
        } finally {
          setCheckingCnpj(false);
        }
      })();
    } else {
      if (clienteExistente) setClienteExistente(null);
    }
  }, [values.cnpj]);

  const handleGoogleLookup = async () => {
    if (!values.nome_fantasia && !values.cnpj) {
      toast.error("Preencha Nome ou CNPJ para buscar.");
      return;
    }
    setIsLookingUpGoogle(true);
    try {
      // ✅ Agora usa o motor inteligente que combina CNPJ + Nome + Cidade
      const { data } = await axios.get("/v1/lead-intel/fetch", {
        params: {
          query: values.nome_fantasia || values.cnpj,
          cnpj: values.cnpj ? values.cnpj.replace(/\D/g, '') : undefined,
          cidade: values.cidade || ""
        }
      });

      if (data.status === 'ok' && data.dados) {
        const d = data.dados;
        if (d.google_place_id) setFieldValue("google_place_id", d.google_place_id);
        if (d.nome_fantasia && !values.nome_fantasia) setFieldValue("nome_fantasia", d.nome_fantasia);
        if (d.razao_social && !values.razao_social) setFieldValue("razao_social", d.razao_social);
        if (d.cnpj && !values.cnpj) setFieldValue("cnpj", d.cnpj);
        if (d.data_fundacao && !values.data_fundacao) setFieldValue("data_fundacao", d.data_fundacao);
        if (d.descricao && !values.descricao) setFieldValue("descricao", d.descricao);

        // Telefone
        if (!values.telefone_principal && d.telefone) {
          setFieldValue("telefone_principal", d.telefone);
        }

        toast.success("Busca inteligente concluída!");
      } else {
        toast.error("Nenhum dado detalhado encontrado.");
      }
    } catch (err) {
      toast.error("Erro na busca inteligente.");
    } finally {
      setIsLookingUpGoogle(false);
    }
  };

  const [isFullAiLoading, setIsFullAiLoading] = useState(false);

  const handleFullAiLookup = async () => {
    if (!values.nome_fantasia || !values.cidade) {
      toast.error("Preencha Nome e Cidade para realizar a busca inteligente.");
      return;
    }
    setIsFullAiLoading(true);
    const t = toast.loading("Consultando bases fiscais e digitais...");
    try {
      const { data } = await axios.get("/v1/lead-intel/fetch", {
        params: {
          query: values.nome_fantasia || values.cnpj,
          cnpj: values.cnpj ? values.cnpj.replace(/\D/g, '') : undefined,
          cidade: values.cidade || ""
        }
      });

      if (data.status === 'ok' && data.dados) {
        const d = data.dados;
        // Preenche TUDO que estiver vazio
        if (d.nome_fantasia) setFieldValue("nome_fantasia", d.nome_fantasia);
        if (d.razao_social) setFieldValue("razao_social", d.razao_social);
        if (d.cnpj) setFieldValue("cnpj", d.cnpj);
        if (d.google_place_id) setFieldValue("google_place_id", d.google_place_id);
        if (d.data_fundacao) setFieldValue("data_fundacao", d.data_fundacao);
        if (d.descricao && !values.descricao) setFieldValue("descricao", d.descricao);
        if (d.telefone && !values.telefone_principal) setFieldValue("telefone_principal", d.telefone);
        if (d.email && !values.email) setFieldValue("email", d.email);

        // ✅ Redes Sociais
        const socialIds = ["instagram", "facebook", "linkedin", "youtube", "tiktok", "x"] as const;
        socialIds.forEach((key) => {
          if (d[key] && !values[key]) {
            setFieldValue(key, String(d[key]));
          }
        });

        toast.success("Dados preenchidos via IA!", { id: t });
      } else {
        toast.error("IA não encontrou dados suficientes.", { id: t });
      }
    } catch (err) {
      toast.error("Falha na consulta IA.", { id: t });
    } finally {
      setIsFullAiLoading(false);
    }
  };

  const generateSeo = values.generate_seo_keywords !== false; // default true
  const tags: string[] = Array.isArray(values.seo_keywords) ? values.seo_keywords : [];

  const commitTags = (next: string[]) => {
    const cleaned = normalizeKeywords(next, 100);
    setFieldValue("seo_keywords", cleaned);
    setFieldValue("seo_keywords_text", cleaned.join(", "));
    // compat com campo antigo
    setFieldValue("palavras_chave", cleaned.join(", "));
  };

  const addFromText = (text: string) => {
    const parts = splitKeywords(text);
    if (!parts.length) return;
    commitTags([...(tags || []), ...parts]);
  };

  const addDraft = () => {
    const t = draft.trim();
    if (!t) return;
    addFromText(t);
    setDraft("");
  };

  const removeAt = (idx: number) => {
    const next = tags.filter((_, i) => i !== idx);
    commitTags(next);
  };

  // 🔒 Validação CPF
  const isValidCPF = (cpf: string): boolean => {
    const clean = cpf.replace(/[^\d]+/g, "");
    if (clean.length !== 11) return false;
    if (/^(\d)\1+$/.test(clean)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) sum += parseInt(clean.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(clean.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(clean.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(clean.substring(10, 11))) return false;

    return true;
  };

  // 🔒 Validação CNPJ
  const isValidCNPJ = (cnpj: string): boolean => {
    const clean = cnpj.replace(/[^\d]+/g, "");
    if (clean.length !== 14) return false;
    if (/^(\d)\1+$/.test(clean)) return false;

    let length = clean.length - 2;
    let numbers = clean.substring(0, length);
    const digits = clean.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = clean.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  };

  const validateDocument = (value: string): string => {
    if (!value) return "";
    const clean = value.replace(/[^\d]+/g, "");

    if (clean.length <= 11) {
      if (clean.length < 11) return "CPF incompleto.";
      return isValidCPF(clean) ? "" : "CPF inválido.";
    }

    if (clean.length < 14) return "CNPJ incompleto.";
    return isValidCNPJ(clean) ? "" : "CNPJ inválido.";
  };

  const descricao = (values.descricao || "") as string;
  const descricaoLen = descricao.length;

  const descricaoHint = useMemo(() => {
    if (!descricaoLen) return "Dica: descreva em 2 parágrafos e 3–6 itens em lista.";
    if (descricaoLen < 200) return "Está curto. Se fizer sentido, adicione diferenciais e atuação local.";
    if (descricaoLen <= 800) return "Tamanho ótimo para SEO e leitura.";
    return "Está longo. Considere reduzir para melhorar escaneabilidade.";
  }, [descricaoLen]);

  const hintColor = useMemo(() => {
    if (!descricaoLen) return "text-gray-500";
    if (descricaoLen < 200) return "text-amber-600";
    if (descricaoLen <= 800) return "text-green-700";
    return "text-red-600";
  }, [descricaoLen]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#B70F0A]" /> Identificação
        </h3>

        {/* ✅ Toggle Exibir no Site */}
        <div className="flex items-center gap-3 bg-gray-50 border px-4 py-2 rounded-xl shadow-sm">
          <div className="flex flex-col text-right">
            <span className="text-[11px] font-bold uppercase text-gray-600 tracking-wider">Status no Site</span>
            <span className={`text-[10px] font-medium ${values.exibir_no_site ? "text-green-600" : "text-red-500"}`}>
              {values.exibir_no_site ? " VISÍVEL AO PÚBLICO" : " OCULTO NO PORTAL"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setFieldValue("exibir_no_site", !values.exibir_no_site)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-transparent focus:ring-[#B70F0A]/20 ${values.exibir_no_site ? "bg-green-500" : "bg-gray-300"
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${values.exibir_no_site ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-600 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#B70F0A]" /> Nome Fantasia*
            </span>
            <button
              type="button"
              onClick={handleFullAiLookup}
              disabled={isFullAiLoading}
              className="text-[10px] uppercase font-black flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all border border-indigo-100"
            >
              <Sparkles className={`w-3 h-3 ${isFullAiLoading ? 'animate-spin' : ''}`} />
              Busca Inteligente (IA)
            </button>
          </label>
          <input
            type="text"
            name="nome_fantasia"
            placeholder="Ex: O Vermelhinho"
            value={values.nome_fantasia || ""}
            onChange={handleChange}
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#B70F0A]" /> Razão Social
          </label>
          <input
            type="text"
            name="razao_social"
            value={values.razao_social || ""}
            onChange={handleChange}
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#B70F0A]" /> CPF / CNPJ
          </label>
          <MaskedInput
            mask={(values.cnpj || "").replace(/\D/g, "").length <= 11 ? "999.999.999-999" : "99.999.999/9999-99"}
            maskChar=""
            formatChars={{ '9': '[0-9]' }}
            name="cnpj"
            value={values.cnpj || ""}
            onChange={(e: any) => {
              handleChange(e);
              setCnpjError(validateDocument(e.target.value));
            }}
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            className={`border rounded-md px-3 py-2 w-full focus:ring-2 ${cnpjError ? "border-red-500 focus:ring-red-500" : "focus:ring-[#B70F0A]"
              }`}
          />

          {checkingCnpj && (
            <p className="text-[10px] text-gray-400 mt-1 animate-pulse">
              Verificando banco de dados...
            </p>
          )}

          {clienteExistente && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg mt-2 shadow-sm">
              <p className="text-xs text-red-700 font-bold mb-2 flex items-center gap-1">
                <Search className="w-3 h-3" /> CNPJ JÁ CADASTRADO
              </p>
              <p className="text-[11px] text-gray-700 mb-2 uppercase font-medium">
                {clienteExistente.nome}
              </p>
              <button
                type="button"
                onClick={() => navigate(`/clientes/${clienteExistente.id}/editar`)}
                className="bg-red-600 text-white text-[10px] px-3 py-1.5 rounded-md hover:bg-red-700 transition font-bold"
              >
                IR PARA O CADASTRO EXISTENTE
              </button>
            </div>
          )}

          {cnpjError && !clienteExistente && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1 animate-pulse">
              ⚠️ {cnpjError}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#B70F0A]" /> Inscrição Estadual
          </label>
          <input
            type="text"
            name="inscricao_estadual"
            value={values.inscricao_estadual || ""}
            onChange={handleChange}
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#B70F0A]" /> Inscrição Municipal
          </label>
          <input
            type="text"
            name="inscricao_municipal"
            value={values.inscricao_municipal || ""}
            onChange={handleChange}
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#B70F0A]" /> Registro Profissional
          </label>
          <input
            type="text"
            name="registro_profissional"
            value={values.registro_profissional || ""}
            onChange={handleChange}
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#B70F0A]" /> Data de Fundação
            </span>

            {/* ✅ Toggle Exibir no Site */}
            <label className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-500 cursor-pointer select-none hover:text-[#B70F0A] transition-colors">
              <input
                type="checkbox"
                checked={values.exibir_data_fundacao !== false}
                onChange={(e) => setFieldValue("exibir_data_fundacao", e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-[#B70F0A] focus:ring-[#B70F0A]"
              />
              Exibir no site
            </label>
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              name="data_fundacao"
              value={values.data_fundacao || ""}
              onChange={handleChange}
              className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
            />
            <button
              type="button"
              onClick={handleAiFoundation}
              disabled={isPredictingFoundation}
              className="p-2 border rounded-md hover:bg-gray-50 text-[#B70F0A]"
              title="Buscar com IA"
            >
              <Sparkles className={`w-4 h-4 ${isPredictingFoundation ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>



        {/* ✅ SEO Keywords moderno */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#B70F0A]" /> Palavras-chave (SEO)
            </label>

            <label className="flex items-center gap-2 text-xs text-gray-700 select-none">
              <input
                type="checkbox"
                checked={generateSeo}
                onChange={(e) => {
                  const next = e.target.checked;
                  setFieldValue("generate_seo_keywords", next);

                  // Se desligar IA e ainda não tiver tags, tenta converter o texto antigo
                  if (!next && (!tags || tags.length === 0)) {
                    const fromLegacy = splitKeywords(values.seo_keywords_text || values.palavras_chave || "");
                    if (fromLegacy.length) commitTags(fromLegacy);
                  }

                  // Foco no input quando manual
                  if (!next) {
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-[#B70F0A]" />
                Gerar via IA (recomendado)
              </span>
            </label>
          </div>

          {generateSeo ? (
            <div className="border rounded-md px-3 py-3 bg-gray-50 text-gray-600 text-sm">
              A IA irá gerar automaticamente <b>até 100 palavras-chave</b> após salvar, usando Segmentos + Cidades atendidas + Descrição.
            </div>
          ) : (
            <div
              className="border rounded-md px-3 py-2 w-full focus-within:ring-2 focus-within:ring-[#B70F0A] bg-white"
              onClick={() => inputRef.current?.focus()}
            >
              <div className="flex flex-wrap gap-2">
                {tags.map((t, idx) => (
                  <span
                    key={`${t}-${idx}`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border bg-gray-50"
                    title={t}
                  >
                    {t}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAt(idx);
                      }}
                      className="rounded-full hover:bg-gray-200 p-0.5"
                      aria-label={`Remover ${t}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDraft();
                      return;
                    }

                    // vírgula ou ponto e vírgula também “commita”
                    if (e.key === "," || e.key === ";") {
                      e.preventDefault();
                      addDraft();
                      return;
                    }

                    // Backspace com draft vazio remove última tag (UX padrão)
                    if (e.key === "Backspace" && draft.length === 0 && tags.length > 0) {
                      e.preventDefault();
                      removeAt(tags.length - 1);
                      return;
                    }
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text");
                    const parts = splitKeywords(text);
                    if (parts.length) {
                      e.preventDefault();
                      addFromText(text);
                      setDraft("");
                    }
                  }}
                   placeholder={tags.length ? "" : "Digite e pressione Enter…"}
                  className="min-w-[180px] flex-1 outline-none text-sm py-1"
                  disabled={tags.length >= 100}
                />
              </div>

              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Enter para adicionar • Backspace remove • Cola aceita vírgulas/linhas
                </p>
                <span className={`text-xs ${tags.length >= 100 ? "text-red-600" : "text-gray-500"}`}>
                  {tags.length}/100
                </span>
              </div>

              {/* hidden text field (compat + backend) */}
              <input type="hidden" name="seo_keywords_text" value={values.seo_keywords_text || ""} readOnly />
            </div>
          )}
        </div>

        {/* Descrição */}
        <div className="md:col-span-2">
          <div className="flex items-end justify-between gap-3">
            <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#B70F0A]" /> Descrição (Sobre)
            </label>

            <div className="flex items-center gap-3">
              <span className={`text-xs ${hintColor}`}>
                {descricaoLen} caracteres • {descricaoHint}
              </span>

              <button
                type="button"
                className="text-xs px-3 py-1 rounded-md border border-[#B70F0A] text-[#B70F0A] hover:bg-[#B70F0A] hover:text-white inline-flex items-center gap-2 transition-all disabled:opacity-50"
                disabled={!values.nome_fantasia || isGeneratingDesc}
                onClick={async () => {
                  if (!values.nome_fantasia) return;
                  setIsGeneratingDesc(true);
                  try {
                    const { data } = await axios.post("/v1/clientes/ai-description", {
                      nome: values.nome_fantasia,
                      cidade: values.cidade || values.cidade_preferida || ""
                    });
                    if (data.description) {
                      setFieldValue("descricao", data.description);
                      toast.success("Descrição gerada!");
                    }
                  } catch (err) {
                    toast.error("Erro ao gerar descrição");
                  } finally {
                    setIsGeneratingDesc(false);
                  }
                }}
              >
                <Sparkles className={`w-3 h-3 ${isGeneratingDesc ? 'animate-spin' : ''}`} />
                {isGeneratingDesc ? "Gerando..." : "Gerar com IA"}
              </button>

              <button
                type="button"
                onClick={() => setShowPreviewDescricao((v) => !v)}
                className="text-xs px-3 py-1 rounded-md border hover:bg-gray-50 inline-flex items-center gap-2"
              >
                {showPreviewDescricao ? (
                  <>
                    <EyeOff className="w-4 h-4" /> Ocultar preview
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" /> Preview
                  </>
                )}
              </button>
            </div>
          </div>

          <textarea
            name="descricao"
            value={values.descricao || ""}
            onChange={handleChange}
            rows={6}
            placeholder={`Exemplo:\nA Empresa X atua em Farroupilha/RS...\n\n- Serviço 1\n- Serviço 2\n- Serviço 3`}
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A] resize-none"
          />

          {showPreviewDescricao && (
            <div className="mt-3 rounded-xl border bg-gray-50 p-4">
              <div className="text-xs font-semibold text-gray-600 mb-2">
                Preview (como ficará para o público)
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-line">
                {values.descricao || "—"}
              </div>
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (values.descricao) return;
                const cidade = values.cidade || values.cidade_preferida || "";
                const nome = values.nome_fantasia || "A empresa";
                const template =
                  `${nome}${cidade ? ` atua em ${cidade}` : ""} oferecendo soluções na sua área de atuação.\n\n` +
                  `- Atendimento\n- Serviços na área\n- Suporte e orientação\n\n` +
                  `Entre em contato para mais informações.`;
                setFieldValue("descricao", template);
              }}
              className="text-xs px-3 py-1 rounded-md border hover:bg-gray-50"
            >
              Inserir modelo
            </button>

            <span className="text-xs text-gray-500">
              A IA já pode preencher automaticamente quando você usar “Buscar com IA”.
            </span>
          </div>
        </div>

        {/* Observações */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-[#B70F0A]" /> Observações (Uso Interno)
          </label>
          <textarea
            name="observacoes"
            value={values.observacoes || ""}
            onChange={handleChange}
            rows={4}
            placeholder="Informações úteis para uso interno do sistema..."
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A] resize-none"
          />
        </div>
      </div>
    </div>
  );
}
