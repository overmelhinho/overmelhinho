import { useEffect, useMemo, useRef, useState } from "react";
import axios from "@/services/api";
import toast from "react-hot-toast";
import {
  Bot,
  Loader2,
  CheckCircle2,
  Database,
  Cloud,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import CpfCnpjInput from "@/components/ui/cpf-cnpj-input";
import { useNavigate } from "react-router-dom";

const cidadesSerra = [
  "Alto Feliz",
  "Arroio do Sal",
  "Barão",
  "Bento Gonçalves",
  "Boa Vista do Sul",
  "Bom Princípio",
  "Campo Bom",
  "Canela",
  "Carlos Barbosa",
  "Caxias do Sul",
  "Coronel Pilar",
  "Farroupilha",
  "Feliz",
  "Flores da Cunha",
  "Garibaldi",
  "Gramado",
  "Lajeado",
  "Monte Belo do Sul",
  "Nova Prata",
  "Nova Roma do Sul",
  "Novo Hamburgo",
  "Pinto Bandeira",
  "Salvador do Sul",
  "São Marcos",
  "São Pedro da Serra",
  "São Sebastião do Caí",
  "São Vendelino",
  "Veranópolis"
];

interface Props {
  nomeInicial: string;
  cnpjInicial?: string;
  cidadeInicial?: string;
  tipoCliente?: "gratuito" | "pagante";
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dados: Record<string, any>, tipoCliente: "gratuito" | "pagante") => void;
}

type Etapa = "IA" | "BrasilAPI" | "Receita" | "GooglePlaces" | null;

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function isValidCPF(cpf: string): boolean {
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
}

function isValidCNPJ(cnpj: string): boolean {
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
}

function isValidDocumento(v: string) {
  const raw = onlyDigits(v);
  if (raw.length === 11) return isValidCPF(raw);
  if (raw.length === 14) return isValidCNPJ(raw);
  return false;
}

function formatDateToBr(dateString: string) {
  if (!dateString) return "";
  if (dateString.includes("/")) return dateString; // já formatado ou vindo assim
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString.substring(0, 10))) return dateString;

  const [year, month, day] = dateString.substring(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

/**
 * ✅ Parse robusto:
 * - extrai CEP
 * - extrai UF
 * - extrai Cidade pelo padrão "... Bairro, Cidade - UF, CEP"
 * - extrai Bairro (antes da Cidade, quando possível)
 * - extrai Rua e Número no começo
 *
 * Importante: NÃO CONFUNDIR "Centro" (bairro) com cidade.
 */
function parseEnderecoRobusto(enderecoCompleto: string, fallbackCidade?: string) {
  const result = {
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    complemento: "",
  };

  const raw = (enderecoCompleto || "").trim();
  if (!raw) {
    result.cidade = fallbackCidade || "";
    return result;
  }

  // CEP
  const cepMatch = raw.match(/\b\d{5}-?\d{3}\b/);
  if (cepMatch) result.cep = cepMatch[0];

  // UF (padrão "... - RS, 95170-488" ou "... - RS 95170-488")
  const ufMatch = raw.match(/\b([A-Z]{2})\b(?=\s*,?\s*\d{5}-?\d{3}\b)/);
  if (ufMatch) result.estado = ufMatch[1];

  // Cidade e UF pelo padrão: ", Cidade - UF"
  // Ex: "... - Centro, Farroupilha - RS, 95170-488, Brazil"
  const cityUfMatch = raw.match(/,\s*([^,]+?)\s*-\s*([A-Z]{2})\b/);
  if (cityUfMatch) {
    const cidadeCapturada = (cityUfMatch[1] || "").trim();
    const ufCapturada = (cityUfMatch[2] || "").trim();

    // Evita casos ruins onde capturaria "Centro" como cidade
    if (cidadeCapturada && !/^(centro)$/i.test(cidadeCapturada)) {
      result.cidade = cidadeCapturada;
    }
    if (ufCapturada) result.estado = result.estado || ufCapturada;
  }

  // Bairro (tenta pegar o termo imediatamente antes de ", Cidade - UF")
  // Ex: "... - sala 1004 - Centro, Farroupilha - RS"
  const bairroCidadeUfMatch = raw.match(/-\s*([^,-]+?)\s*,\s*([^,]+?)\s*-\s*([A-Z]{2})\b/);
  if (bairroCidadeUfMatch) {
    const bairro = (bairroCidadeUfMatch[1] || "").trim();
    const cidade = (bairroCidadeUfMatch[2] || "").trim();
    const uf = (bairroCidadeUfMatch[3] || "").trim();

    if (bairro && !result.bairro) result.bairro = bairro;
    if (cidade && !/^(centro)$/i.test(cidade)) result.cidade = result.cidade || cidade;
    if (uf) result.estado = result.estado || uf;
  }

  // Rua e número (começo)
  // tenta: "R. X, 513" ou "Rua X, 513"
  const ruaNumeroMatch = raw.match(/^(.+?),\s*(\d{1,6})(\b|,|\s|-)/);
  if (ruaNumeroMatch) {
    result.rua = (ruaNumeroMatch[1] || "").trim();
    result.numero = (ruaNumeroMatch[2] || "").trim();
  } else {
    // fallback: antes do primeiro hífen costuma ter logradouro
    const firstPart = raw.split(" - ")[0]?.trim();
    if (firstPart && firstPart.length <= 80) result.rua = firstPart;
  }

  // Complemento: sala/andar/bloco/apto
  const complMatch = raw.match(/\b(sala|sl|andar|bloco|apto|apt|apartamento)\b.*$/i);
  if (complMatch) result.complemento = complMatch[0]?.trim() || "";

  // Fallback final para cidade
  if (!result.cidade) {
    result.cidade = fallbackCidade || "";
  }

  return result;
}

export default function PreFetchModal({
  nomeInicial,
  cnpjInicial = "",
  cidadeInicial = "",
  tipoCliente: tipoClienteInicial = "pagante",
  isOpen,
  onClose,
  onConfirm,
}: Props) {
  const navigate = useNavigate();
  const [tipoCliente, setTipoCliente] = useState<"gratuito" | "pagante">(tipoClienteInicial);

  const [cidade, setCidade] = useState(cidadeInicial || "");
  const [nome, setNome] = useState(nomeInicial || "");
  const [cnpj, setCnpj] = useState(cnpjInicial || "");

  useEffect(() => {
    if (cidadeInicial) setCidade(cidadeInicial);
  }, [cidadeInicial]);

  useEffect(() => {
    if (nomeInicial) setNome(nomeInicial);
  }, [nomeInicial]);

  useEffect(() => {
    if (cnpjInicial) setCnpj(cnpjInicial);
  }, [cnpjInicial]);

  const [loading, setLoading] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>(null);

  const [sugestoes, setSugestoes] = useState<Record<string, any>>({});
  const [showDetalhes, setShowDetalhes] = useState(false);

  const [clienteExistente, setClienteExistente] = useState<{ id: number; nome: string } | null>(null);
  const [checkingCnpj, setCheckingCnpj] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log('🏗️ [MODAL] Dados Iniciais Recv:', { nomeInicial, cnpjInicial, cidadeInicial });
      setNome((nomeInicial || "").trim());
      setCnpj((cnpjInicial || "").trim());

      const cityClean = (cidadeInicial || "").trim();
      if (cityClean) {
        setCidade(cityClean);
      }
    }
  }, [nomeInicial, cnpjInicial, cidadeInicial, isOpen]);

  const docValido = useMemo(() => (cnpj ? isValidDocumento(cnpj) : false), [cnpj]);

  // ✅ Verifica duplicidade ao completar 11 ou 14 dígitos
  useEffect(() => {
    const raw = onlyDigits(cnpj);
    if (raw.length === 11 || raw.length === 14) {
      (async () => {
        setCheckingCnpj(true);
        try {
          const { data } = await axios.get("/v1/clientes/check-cnpj", { params: { cnpj: raw } });

          if (data.exists) {
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
      setClienteExistente(null);
    }
  }, [cnpj]);

  const etapasUI = useMemo(
    () => [
      { id: "IA", label: "IA", icon: <Bot className="w-4 h-4" /> },
      { id: "BrasilAPI", label: "Fiscal (BrasilAPI)", icon: <Database className="w-4 h-4" /> },
      { id: "Receita", label: "Fiscal (ReceitaWS)", icon: <Cloud className="w-4 h-4" /> },
      { id: "GooglePlaces", label: "Google Places", icon: <Cloud className="w-4 h-4" /> },
    ],
    []
  );

  const limpar = () => {
    setSugestoes({});
    setShowDetalhes(false);
    toast.success("Pré-visualização limpa.");
  };

  const buscar = async () => {
    const temCnpj = !!onlyDigits(cnpj);
    const temNome = !!nome.trim();
    const temCidade = !!cidade.trim();

    // Regras UX:
    // - com CNPJ: nome/cidade opcionais (mas ajudam no Places)
    // - sem CNPJ: precisa nome + cidade para Places/IA
    if (!temNome || !temCidade) {
      return toast.error("Nome e Cidade são obrigatórios para realizar a busca.");
    }
    if (temCnpj && !docValido) {
      return toast.error("Documento inválido. Confira os dígitos (11 para CPF ou 14 para CNPJ).");
    }

    setLoading(true);
    setSugestoes({});
    setShowDetalhes(false);

    try {
      // ✅ Query SEMPRE usa o nome atual digitado (o “último nome antes de buscar”)
      const query = [nome.trim(), cidade.trim()].filter(Boolean).join(" ");

      setEtapa("IA");
      const { data } = await axios.get("/v1/lead-intel/fetch", {
        params: {
          query: query || "empresa", // backend exige query
          cnpj: temCnpj ? onlyDigits(cnpj) : undefined,
          cidade: cidade.trim(),
        },
      });

      const dados = data?.dados ? (typeof data.dados === "object" ? data.dados : {}) : {};
      if (!Object.keys(dados).length) {
        toast.error("Nenhum dado retornado.");
        return;
      }

      // ✅ Normalizações finais (frontend)
      const cidadePreferida = (dados.cidade_preferida as string) || cidade || "";
      const parsed = parseEnderecoRobusto(dados.endereco || "", cidadePreferida);

      const sugestoesCompletas: Record<string, any> = {
        ...dados,
        // garante cidade/estado/bairro coerentes:
        ...parsed,
        cidade_preferida: cidadePreferida,
        // mantém CNPJ digitado (limpo) como referência:
        cnpj: dados.cnpj || (temCnpj ? onlyDigits(cnpj) : ""),
        nome_fantasia: dados.nome_fantasia || nome.trim() || "",
      };

      setSugestoes(sugestoesCompletas);
      setShowDetalhes(true);
      toast.success("✅ Dados encontrados. Revise e aplique.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao buscar dados.");
    } finally {
      setLoading(false);
      setEtapa(null);
    }
  };

  const confirmarUso = () => {
    if (!Object.keys(sugestoes).length) return;

    // ✅ aqui garantimos de novo que cidade não vira “Centro”
    const fallbackCidade = sugestoes.cidade_preferida || cidade || "";
    const parsed = parseEnderecoRobusto(sugestoes.endereco || "", fallbackCidade);

    const dadosFinal = {
      ...sugestoes,
      ...parsed,
      cidade: parsed.cidade || fallbackCidade,
    };

    onConfirm(dadosFinal, tipoCliente);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#B70F0A]/10">
              <Bot className="w-4 h-4 text-[#B70F0A]" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Pré-preenchimento inteligente (IA + fontes oficiais)
              </h2>
              <p className="text-xs text-gray-500">
                Busque por CNPJ (fiscal) e complemente com Google Places automaticamente.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Cancelar
          </button>
        </div>

        {/* Etapas (loading) */}
        {loading && (
          <div className="px-6 pt-4">
            <div className="flex flex-wrap gap-2">
              {etapasUI.map((e) => (
                <div
                  key={e.id}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] border ${etapa === e.id
                    ? "bg-[#B70F0A] text-white border-[#B70F0A]"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                >
                  {etapa === e.id ? <Loader2 className="w-3 h-3 animate-spin" /> : e.icon}
                  {e.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conteúdo */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          {/* Linha 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo de Cliente</label>
              <select
                value={tipoCliente}
                onChange={(e) => setTipoCliente(e.target.value as "gratuito" | "pagante")}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#B70F0A] outline-none"
              >
                <option value="pagante">Cliente Pagante 💰</option>
                <option value="gratuito">Cliente Gratuito 🧾</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Cidade*</label>
              <select
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#B70F0A] outline-none"
              >
                <option value="">-- Selecione --</option>
                {cidadesSerra.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                A cidade ajuda a filtrar resultados locais e evitar homônimos em outros estados.
              </p>
            </div>

            {/* CPF / CNPJ */}
            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                CPF / CNPJ
              </label>
              <div className="relative group">
                <CpfCnpjInput
                  value={cnpj}
                  onChange={(e: any) => setCnpj(e.target.value)}
                  className={`w-full bg-gray-50 border-2 transition-all duration-200 rounded-xl px-4 py-3 text-gray-700 outline-none
                  ${cnpj && !docValido ? "border-amber-200 focus:border-amber-400" : "border-gray-100 focus:border-[#B70F0A] focus:bg-white"}
                `}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
                <div className="mt-1 flex flex-col gap-1">
                  {checkingCnpj && <span className="text-[10px] text-gray-400 animate-pulse">Verificando existência...</span>}

                  {clienteExistente && (
                    <div className="bg-red-50 border border-red-200 p-2 rounded-lg mt-1">
                      <p className="text-[10px] text-red-700 font-semibold mb-1">
                        ⚠️ Este CNPJ já possui cadastro: <br />
                        <span className="uppercase">{clienteExistente.nome}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate(`/clientes/${clienteExistente.id}/editar`)}
                        className="inline-flex items-center gap-1 text-[10px] bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ir para o Cliente
                      </button>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-0.5">
                    {cnpj ? (
                      docValido ? ( // Changed cnpjValido to docValido
                        <span className="inline-flex items-center gap-1 text-green-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Documento válido
                        </span>
                      ) : (
                        <span className="text-red-500">Documento inválido</span>
                      )
                    ) : (
                      "Se tiver o CNPJ/CPF, a precisão melhora."
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="text-sm font-medium text-gray-700">Nome*</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: O Vermelhinho"
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#B70F0A] outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Nome + Cidade ajudam a encontrar telefone/endereço/website no Google Places e validar dados fiscais.
            </p>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              <button
                onClick={buscar}
                disabled={loading || !!clienteExistente}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition text-sm font-medium
                  ${loading || !!clienteExistente
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-[#B70F0A] hover:bg-[#900B07] text-white"
                  }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    Buscar agora
                  </>
                )}
              </button>

              <button
                onClick={limpar}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-50"
              >
                <Trash2 className="w-4 h-4" />
                Limpar
              </button>
            </div>

            <div className="text-xs text-gray-500">
              {onlyDigits(cnpj).length === 14 ? "Busca fiscal (CNPJ) + complemento do Google Places." : onlyDigits(cnpj).length === 11 ? "Busca por CPF + complemento do Google Places." : "Busca por Nome + Cidade (Google Places)."}
            </div>
          </div>

          {/* Pré-visualização */}
          {Object.keys(sugestoes).length > 0 && (
            <div className="mt-2 rounded-xl border bg-white">
              <button
                type="button"
                onClick={() => setShowDetalhes((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="text-sm font-semibold text-gray-800">
                  Pré-visualização (você pode ajustar antes de aplicar)
                </div>
                <div className="text-sm text-gray-600 inline-flex items-center gap-2">
                  {showDetalhes ? (
                    <>
                      Ver menos <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Ver mais <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </div>
              </button>

              <div className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">CNPJ</label>
                    <input
                      value={sugestoes.cnpj || ""}
                      readOnly
                      className="w-full border rounded-md px-2 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Razão Social</label>
                    <input
                      value={sugestoes.razao_social || ""}
                      readOnly
                      className="w-full border rounded-md px-2 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Nome Fantasia</label>
                    <input
                      value={sugestoes.nome_fantasia || ""}
                      readOnly
                      className="w-full border rounded-md px-2 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Inscrição Estadual (IE)</label>
                    <input
                      value={sugestoes.inscricao_estadual || ""}
                      readOnly
                      className="w-full border rounded-md px-2 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Inscrição Municipal (IM)</label>
                    <input
                      value={sugestoes.inscricao_municipal || ""}
                      readOnly
                      className="w-full border rounded-md px-2 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Telefone</label>
                    <input
                      value={sugestoes.telefone || ""}
                      readOnly
                      className="w-full border rounded-md px-2 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Email</label>
                    <input
                      value={sugestoes.email || ""}
                      readOnly
                      className="w-full border rounded-md px-2 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Website</label>
                    <input
                      value={sugestoes.website || ""}
                      readOnly
                      className="w-full border rounded-md px-2 py-2 text-sm bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Data de Fundação</label>
                    <input
                      value={formatDateToBr(sugestoes.data_fundacao || "")}
                      readOnly
                      className="w-full border rounded-md px-2 py-2 text-sm bg-gray-50"
                    />
                  </div>



                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500">Endereço</label>
                    <input
                      value={sugestoes.endereco || ""}
                      readOnly
                      className="w-full border rounded-md px-2 py-2 text-sm bg-gray-50"
                    />
                  </div>

                  {showDetalhes && (
                    <div className="md:col-span-2 mt-2 border rounded-xl p-3 bg-gray-50">
                      <div className="text-sm font-semibold text-gray-700 mb-2">
                        Detalhes adicionais
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[240px] overflow-y-auto pr-2">
                        {[
                          ["instagram", sugestoes.instagram],
                          ["facebook", sugestoes.facebook],
                          ["linkedin", sugestoes.linkedin],
                          ["youtube", sugestoes.youtube],
                          ["tiktok", sugestoes.tiktok],
                          ["x", sugestoes.x],
                          ["cidade (parse)", sugestoes.cidade],
                          ["bairro (parse)", sugestoes.bairro],
                          ["estado (parse)", sugestoes.estado],
                          ["cep (parse)", sugestoes.cep],
                          ["origem_dado", sugestoes.origem_dado],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <label className="block text-xs font-semibold text-gray-500">{k}</label>
                            <input
                              value={(v as string) || ""}
                              readOnly
                              className="w-full border rounded-md px-2 py-2 text-sm bg-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
                  <p className="text-xs text-gray-500">
                    Observação: IE/IM podem não estar disponíveis para todos os CNPJs dependendo das fontes consultadas.
                  </p>

                  <button
                    onClick={confirmarUso}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg shadow-sm text-sm font-semibold"
                  >
                    Aplicar dados ao cadastro
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer “limpo” */}
        <div className="px-6 py-3 border-t bg-gray-50 text-[11px] text-gray-500">
          Dica: se você tiver o CNPJ, use-o. Se não tiver, informe Nome + Cidade para uma busca precisa no Google Places.
        </div>
      </div>
    </div>
  );
}
