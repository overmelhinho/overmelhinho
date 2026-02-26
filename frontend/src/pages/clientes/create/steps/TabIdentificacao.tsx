import { useFormikContext } from "formik";
import { useMemo, useRef, useState } from "react";
import { Building2, FileText, Hash, Briefcase, Tag, Eye, EyeOff, Sparkles, X, Calendar, MapPin, Search } from "lucide-react";
import MaskedInput from "@/components/ui/masked-input";
import axios from "@/services/api";
import toast from "react-hot-toast";

const splitKeywords = (text: string): string[] => {
  if (!text) return [];
  return text
    .replace(/#/g, " ")
    .split(/[,;\n]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
};

const normalizeKeywords = (items: string[], limit = 20): string[] => {
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
  const { values, handleChange, setFieldValue } = useFormikContext<any>();
  const [cnpjError, setCnpjError] = useState("");
  const [showPreviewDescricao, setShowPreviewDescricao] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isPredictingFoundation, setIsPredictingFoundation] = useState(false);
  const [isLookingUpGoogle, setIsLookingUpGoogle] = useState(false);

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

  const handleGoogleLookup = async () => {
    if (!values.nome_fantasia || !values.cidade) {
      toast.error("Preencha Nome e Cidade para buscar no Google.");
      return;
    }
    setIsLookingUpGoogle(true);
    try {
      const query = `${values.nome_fantasia} ${values.cidade}`;
      const { data } = await axios.get("/v1/clientes/google-lookup", { params: { query } });

      if (data.success && data.details) {
        setFieldValue("google_place_id", data.details.place_id);

        // WhatsApp/Phone autofill if empty
        const phone = data.details.international_phone_number || data.details.formatted_phone_number;
        if (!values.telefone_principal && phone) {
          setFieldValue("telefone_principal", phone);
        }

        toast.success("Dados do Google sincronizados!");
      } else {
        toast.error("Local não encontrado no Google Maps.");
      }
    } catch (err) {
      toast.error("Erro ao consultar Google Places.");
    } finally {
      setIsLookingUpGoogle(false);
    }
  };

  const generateSeo = values.generate_seo_keywords !== false; // default true
  const tags: string[] = Array.isArray(values.seo_keywords) ? values.seo_keywords : [];

  const commitTags = (next: string[]) => {
    const cleaned = normalizeKeywords(next, 20);
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

  const validateCNPJ = (value: string): string => {
    if (!value) return "";
    const clean = value.replace(/[^\d]+/g, "");
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
      <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
        <Building2 className="w-5 h-5 text-[#B70F0A]" /> Identificação
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#B70F0A]" /> Nome Fantasia*
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
            <Hash className="w-4 h-4 text-[#B70F0A]" /> CNPJ*
          </label>
          <MaskedInput
            mask="99.999.999/9999-99"
            maskChar=""
            name="cnpj"
            value={values.cnpj || ""}
            onChange={(e: any) => {
              handleChange(e);
              setCnpjError(validateCNPJ(e.target.value));
            }}
            placeholder="00.000.000/0000-00"
            maxLength={18}
            className={`border rounded-md px-3 py-2 w-full focus:ring-2 ${cnpjError ? "border-red-500 focus:ring-red-500" : "focus:ring-[#B70F0A]"
              }`}
          />

          {cnpjError && (
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

        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#B70F0A]" /> Data de Fundação
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

        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#B70F0A]" /> Google Place ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="google_place_id"
              placeholder="Chave única do Google Maps"
              value={values.google_place_id || ""}
              onChange={handleChange}
              className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
            />
            <button
              type="button"
              onClick={handleGoogleLookup}
              disabled={isLookingUpGoogle}
              className="p-2 border rounded-md hover:bg-gray-50 text-[#B70F0A]"
              title="Buscar no Google Maps"
            >
              <Search className={`w-4 h-4 ${isLookingUpGoogle ? 'animate-spin' : ''}`} />
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
              A IA irá gerar automaticamente <b>20 palavras-chave</b> após salvar, usando Segmentos + Cidades atendidas + Descrição.
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
                  disabled={tags.length >= 20}
                />
              </div>

              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Enter para adicionar • Backspace remove • Cola aceita vírgulas/linhas
                </p>
                <span className={`text-xs ${tags.length >= 20 ? "text-red-600" : "text-gray-500"}`}>
                  {tags.length}/20
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
      </div>
    </div>
  );
}
