// /var/www/frontend/src/pages/clientes/ClientesList.tsx
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "@/services/api";
import Skeleton from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  ExternalLink,
  Pencil,
  Copy,
  Phone,
  MapPin,
  Building2,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type TipoCliente = "pagante" | "gratuito";
type StatusAssinatura =
  | "ativa"
  | "pendente"
  | "atrasada"
  | "suspensa"
  | "cancelada"
  | string;

type ClienteLite = {
  id: number;
  nome_fantasia: string;
  cpf_cnpj: string | null;
  logo_url?: string | null;
  tipo_cliente?: TipoCliente | string | null;
  status_assinatura?: StatusAssinatura | null;

  seo_keywords?: any;
  galeria_imagens_count?: number;

  enderecos?: Array<{
    cidade?: string;
    estado?: string;
    bairro?: string;
    rua?: string;
    numero?: string;
    complemento?: string; // pode vir no futuro; não quebra se não vier
  }>;
  contatos?: Array<{
    email_principal?: string;
    telefone_principal?: string;
    nome_contato?: string;
  }>;
  segmentos?: Array<{ id: number; nome: string }>;
  cidades_atendidas?: Array<{ id: number; nome: string }>;

  portfolio_url?: string | null;
  video?: string | null;

  created_at?: string;
  updated_at?: string;
};

function debounce<T>(fn: (v: T) => void, ms: number) {
  let t: any;
  return (v: T) => {
    clearTimeout(t);
    t = setTimeout(() => fn(v), ms);
  };
}

function safeDigits(v: string) {
  return (v || "").replace(/\D+/g, "");
}

function formatDateBR(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  } catch {
    return "—";
  }
}

function getCidadeUF(c: ClienteLite) {
  const e = c?.enderecos?.[0];
  const cidade = e?.cidade || "";
  const uf = e?.estado || "";
  return [cidade, uf].filter(Boolean).join(" / ");
}

/**
 * ✅ Endereço curto p/ LISTAGEM:
 * - sem cidade/UF
 * - sem prefixos "Bairro:"/"Compl.:" (mais SaaS e limpo)
 */
function formatEnderecoLista(c: ClienteLite) {
  const e = c?.enderecos?.[0];
  if (!e) return "—";

  const ruaNumero = [e.rua, e.numero].filter(Boolean).join(", ");
  const bairro = e.bairro ? e.bairro : "";
  const complemento = e.complemento ? e.complemento : "";

  const parts = [ruaNumero, bairro, complemento].filter(Boolean);
  return parts.join(" • ") || "—";
}

// Endereço completo (p/ drawer / cards)
function formatEnderecoCompleto(c: ClienteLite) {
  const e = c?.enderecos?.[0];
  if (!e) return "—";
  const parts = [
    e.cidade ? e.cidade : null,
    e.estado ? e.estado : null,
    e.bairro ? e.bairro : null,
    e.rua ? e.rua : null,
    e.numero ? e.numero : null,
    e.complemento ? e.complemento : null,
  ].filter(Boolean);
  return parts.join(", ") || "—";
}

function hasSeoKeywords(c: ClienteLite) {
  const k = (c as any)?.seo_keywords;
  if (!k) return false;
  if (Array.isArray(k)) return k.length > 0;
  if (typeof k === "string") return k.trim().length > 2;
  return true;
}

function computePendencias(c: ClienteLite) {
  const missingLogo = !c.logo_url;
  const missingGaleria = (c.galeria_imagens_count ?? 0) <= 0;
  const missingSeo = !hasSeoKeywords(c);

  const missingMidia =
    typeof (c as any).portfolio_url !== "undefined"
      ? !(c as any).portfolio_url
      : false;

  return { missingLogo, missingGaleria, missingSeo, missingMidia };
}

function clienteRowKey(c: ClienteLite) {
  return `cliente-${c.id}-${c.updated_at || c.created_at || ""}`;
}

function formatContato(c: ClienteLite) {
  const ct = c?.contatos?.[0];
  if (!ct) return "—";
  const parts = [
    ct.nome_contato ? `Responsável: ${ct.nome_contato}` : null,
    ct.telefone_principal ? `Tel: ${ct.telefone_principal}` : null,
    ct.email_principal ? `Email: ${ct.email_principal}` : null,
  ].filter(Boolean);
  return parts.join(" • ") || "—";
}

function statusLabel(s?: StatusAssinatura | null) {
  const v = (s || "").toString().toLowerCase();
  if (!v) return "—";
  const map: Record<string, string> = {
    ativa: "Ativa",
    pendente: "Pendente",
    atrasada: "Atrasada",
    suspensa: "Suspensa",
    cancelada: "Cancelada",
  };
  return map[v] || v;
}

function statusChipClass(s?: StatusAssinatura | null) {
  const v = (s || "").toString().toLowerCase();
  if (v === "ativa") return "bg-green-50 text-green-700 border-green-200";
  if (v === "pendente") return "bg-yellow-50 text-yellow-800 border-yellow-200";
  if (v === "atrasada") return "bg-red-50 text-red-700 border-red-200";
  if (v === "suspensa") return "bg-red-50 text-red-700 border-red-200";
  if (v === "cancelada") return "bg-gray-50 text-gray-700 border-gray-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

function InfoCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-2xl p-4 bg-white shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        {icon ? <span className="text-gray-400">{icon}</span> : null}
        <span>{title}</span>
      </div>
      <div className="text-sm text-gray-800 mt-2">{children}</div>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  variant = "secondary",
}: {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150";
  const styles =
    variant === "primary"
      ? "bg-[#B70F0A] text-white hover:bg-[#900B07]"
      : "border bg-white hover:bg-gray-50 text-gray-800";
  return (
    <button type="button" className={`${base} ${styles}`} onClick={onClick}>
      {icon ? <span className="text-current">{icon}</span> : null}
      {label}
    </button>
  );
}

export default function ClientesList() {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [tipo, setTipo] = useState<"all" | TipoCliente>("all");
  const [page, setPage] = useState<number>(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<ClienteLite | null>(null);

  const copyToClipboard = async (text: string, msg = "Copiado!") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const onSearchDebounced = useMemo(
    () =>
      debounce<string>((v) => {
        setSearchDebounced(v);
        setPage(1);
      }, 350),
    []
  );

  useEffect(() => {
    onSearchDebounced(search);
  }, [search, onSearchDebounced]);

  const queryKey = useMemo(() => ["clientes", { page }], [page]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey,
    placeholderData: (prev) => prev,
    staleTime: 60_000,
    queryFn: async () => {
      const resp = await axios.get("/v1/clientes", { params: { page, lite: true } });
      return resp?.data;
    },
  });

  const clientesRaw: ClienteLite[] = data?.data ?? [];
  const meta = data?.meta;

  // métricas rápidas (cards)
  const stats = useMemo(() => {
    const s = {
      totalPagina: clientesRaw.length,
      ativa: 0,
      pendente: 0,
      atrasada: 0,
      suspensa: 0,
      cancelada: 0,
    };
    for (const c of clientesRaw) {
      const v = (c.status_assinatura || "").toString().toLowerCase();
      if (v === "ativa") s.ativa += 1;
      else if (v === "pendente") s.pendente += 1;
      else if (v === "atrasada") s.atrasada += 1;
      else if (v === "suspensa") s.suspensa += 1;
      else if (v === "cancelada") s.cancelada += 1;
    }
    return s;
  }, [clientesRaw]);

  const clientes = useMemo(() => {
    let list = [...clientesRaw];

    if (tipo !== "all") {
      list = list.filter((c) => (c.tipo_cliente || "gratuito") === tipo);
    }

    const q = searchDebounced.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const cidadeUf = getCidadeUF(c).toLowerCase();
        const cnpj = (c.cpf_cnpj || "").toLowerCase();
        const nome = (c.nome_fantasia || "").toLowerCase();
        const contato = formatContato(c).toLowerCase();
        const enderecoLista = formatEnderecoLista(c).toLowerCase();
        const tel = (c?.contatos?.[0]?.telefone_principal || "").toLowerCase();
        return (
          nome.includes(q) ||
          cnpj.includes(q) ||
          cidadeUf.includes(q) ||
          contato.includes(q) ||
          enderecoLista.includes(q) ||
          tel.includes(q)
        );
      });
    }

    return list;
  }, [clientesRaw, tipo, searchDebounced]);

  const openDrawer = (c: ClienteLite) => {
    setSelected(c);
    setDrawerOpen(true);
  };

  const tipoLabel = (c: ClienteLite) => {
    const t = (c.tipo_cliente as any) || "gratuito";
    return t === "pagante" ? "Pagante" : "Gratuito";
  };

  const tipoChipClass = (c: ClienteLite) => {
    const t = (c.tipo_cliente as any) || "gratuito";
    return t === "pagante"
      ? "bg-green-100 text-green-700 border-green-300"
      : "bg-gray-100 text-gray-700 border-gray-300";
  };

  const pendenciaItems = (c: ClienteLite) => {
    const p = computePendencias(c);
    const items: Array<{ id: string; label: string; actionLabel: string; hash?: string }> = [];

    if (p.missingLogo)
      items.push({ id: "logo", label: "Logo ausente", actionLabel: "Adicionar", hash: "logo" });
    if (p.missingGaleria)
      items.push({
        id: "galeria",
        label: "Galeria vazia",
        actionLabel: "Enviar imagens",
        hash: "galeria",
      });
    if (p.missingSeo)
      items.push({ id: "seo", label: "SEO pendente", actionLabel: "Configurar", hash: "seo" });
    if (p.missingMidia)
      items.push({ id: "midia", label: "Mídia ausente", actionLabel: "Adicionar", hash: "midia" });

    return items;
  };

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header “SaaS” */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">
            Encontre rapidamente clientes, visualize status de assinatura e ações rápidas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-[#B70F0A] text-white hover:bg-[#900B07] transition"
            onClick={() => {
              toast("Criação direta ainda não definida. Use a conversão por Lead.");
              window.location.href = "/clientes/novo";
            }}
          >
            + Novo cliente
          </button>
        </div>
      </div>

      {/* Cards rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="border rounded-2xl p-4 bg-white shadow-sm">
          <div className="text-xs font-semibold text-gray-500">Total</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">
            {meta?.total ?? stats.totalPagina}
          </div>
          <div className="text-xs text-gray-400 mt-1">Sistema</div>
        </div>

        <div className="border rounded-2xl p-4 bg-white shadow-sm">
          <div className="text-xs font-semibold text-gray-500">Ativas</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">{stats.ativa}</div>
          <div className="text-xs text-gray-400 mt-1">Página atual</div>
        </div>

        <div className="border rounded-2xl p-4 bg-white shadow-sm">
          <div className="text-xs font-semibold text-gray-500">Pendentes</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">{stats.pendente}</div>
          <div className="text-xs text-gray-400 mt-1">Página atual</div>
        </div>

        <div className="border rounded-2xl p-4 bg-white shadow-sm">
          <div className="text-xs font-semibold text-gray-500">Atrasadas</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">{stats.atrasada}</div>
          <div className="text-xs text-gray-400 mt-1">Página atual</div>
        </div>

        <div className="border rounded-2xl p-4 bg-white shadow-sm">
          <div className="text-xs font-semibold text-gray-500">Suspensas</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">{stats.suspensa}</div>
          <div className="text-xs text-gray-400 mt-1">Página atual</div>
        </div>

        <div className="border rounded-2xl p-4 bg-white shadow-sm">
          <div className="text-xs font-semibold text-gray-500">Canceladas</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">{stats.cancelada}</div>
          <div className="text-xs text-gray-400 mt-1">Página atual</div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, CNPJ, rua/bairro, email ou telefone..."
              className="w-full border rounded-xl pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#B70F0A] outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-2 border rounded-xl bg-white">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="text-sm outline-none"
              >
                <option value="all">Todos</option>
                <option value="pagante">Pagantes</option>
                <option value="gratuito">Gratuitos</option>
              </select>
            </div>

            <button
              className="px-3 py-2 border rounded-xl text-sm hover:bg-gray-50 transition"
              onClick={() => {
                setSearch("");
                setTipo("all");
                setPage(1);
                setTimeout(() => refetch(), 0);
                toast.success("Filtros limpos.");
              }}
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
          <div>
            {meta?.total ? (
              <span>
                {meta.total} clientes • Página {meta.current_page} de {meta.last_page}
              </span>
            ) : (
              <span>{clientes.length} clientes</span>
            )}
          </div>
          {isFetching ? <div className="text-gray-400">Atualizando…</div> : null}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
        {clientes.length === 0 ? (
          <div className="p-10 text-center text-gray-500">Nenhum cliente encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Cliente</th>
                  <th className="text-left font-medium px-4 py-3">Tipo</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Endereço</th>
                  <th className="text-left font-medium px-4 py-3">Telefone</th>
                  <th className="text-right font-medium px-4 py-3">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {clientes.map((c) => {
                  const cidadeUF = getCidadeUF(c);
                  const enderecoLista = formatEnderecoLista(c);
                  const telefone = c?.contatos?.[0]?.telefone_principal || "";

                  return (
                    <tr
                      key={clienteRowKey(c)}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => openDrawer(c)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg border bg-gray-50 overflow-hidden flex items-center justify-center">
                            {c.logo_url ? (
                              <img src={c.logo_url} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs text-gray-400">LOGO</span>
                            )}
                          </div>

                          <div>
                            <div className="font-medium text-gray-900">{c.nome_fantasia}</div>
                            <div className="text-xs text-gray-500">
                              {cidadeUF || "—"} {c.cpf_cnpj ? `• ${c.cpf_cnpj}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full border text-xs ${tipoChipClass(
                            c
                          )}`}
                        >
                          {tipoLabel(c)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full border text-xs ${statusChipClass(
                            c.status_assinatura
                          )}`}
                        >
                          {statusLabel(c.status_assinatura)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div
                          className="text-sm text-gray-800 max-w-[420px] truncate"
                          title={enderecoLista}
                        >
                          {enderecoLista}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {telefone ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(telefone, "Telefone copiado!");
                            }}
                            title="Clique para copiar"
                          >
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span>{telefone}</span>
                            <Copy className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border text-xs hover:bg-gray-50 transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/clientes/${c.id}`;
                          }}
                        >
                          Abrir <ExternalLink className="inline w-3 h-3 ml-1" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta?.last_page ? (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <button
              className="px-3 py-2 rounded border text-sm disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Anterior
            </button>

            <div className="text-xs text-gray-500">
              Página {meta.current_page} de {meta.last_page}
            </div>

            <button
              className="px-3 py-2 rounded border text-sm disabled:opacity-50"
              disabled={page >= meta.last_page}
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            >
              Próxima →
            </button>
          </div>
        ) : null}
      </div>

      {/* Drawer (Dialog) - mantido */}
      <Dialog
        open={drawerOpen}
        onOpenChange={(v) => {
          if (!v) setDrawerOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[860px] p-0 overflow-hidden">
          <div className="p-5 border-b bg-white">
            <DialogHeader>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl border bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                  {selected?.logo_url ? (
                    <img src={selected.logo_url} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">SEM LOGO</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-lg">
                    <span className="truncate inline-block max-w-full">
                      {selected?.nome_fantasia || "Cliente"}
                    </span>
                  </DialogTitle>

                  <DialogDescription className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {selected ? getCidadeUF(selected) || "—" : "—"}
                    </span>

                    {selected ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${tipoChipClass(
                          selected
                        )}`}
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                        {tipoLabel(selected)}
                      </span>
                    ) : null}

                    {selected?.cpf_cnpj ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border bg-gray-50 text-gray-700 hover:bg-gray-100 transition"
                        onClick={() => copyToClipboard(selected.cpf_cnpj || "", "CNPJ copiado!")}
                        title="Copiar CNPJ"
                      >
                        <span className="font-medium">CNPJ:</span>
                        <span>{selected.cpf_cnpj}</span>
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </DialogDescription>
                </div>

                <div className="flex items-center gap-2">
                  <ActionButton
                    label="Editar"
                    icon={<Pencil className="w-4 h-4" />}
                    variant="primary"
                    onClick={() => {
                      if (!selected) return;
                      window.location.href = `/clientes/${selected.id}/editar`;
                    }}
                  />

                  <ActionButton
                    label="Abrir"
                    icon={<ExternalLink className="w-4 h-4" />}
                    onClick={() => {
                      if (!selected) return;
                      window.location.href = `/clientes/${selected.id}`;
                    }}
                  />
                </div>
              </div>
            </DialogHeader>
          </div>

          {selected ? (
            <div className="p-5 space-y-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoCard title="Contato principal" icon={<Phone className="w-4 h-4" />}>
                  {formatContato(selected)}
                </InfoCard>

                <InfoCard title="Endereço" icon={<Building2 className="w-4 h-4" />}>
                  {formatEnderecoCompleto(selected)}
                </InfoCard>

                <InfoCard title="Segmentos" icon={<BadgeCheck className="w-4 h-4" />}>
                  {(selected.segmentos || []).map((s) => s.nome).join(", ") || "—"}
                </InfoCard>

                <InfoCard title="Cidades atendidas" icon={<MapPin className="w-4 h-4" />}>
                  {(selected.cidades_atendidas || []).map((c) => c.nome).join(", ") || "—"}
                </InfoCard>
              </div>

              <div className="border rounded-2xl p-4 bg-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#B70F0A]" />
                    <div className="text-sm font-semibold text-gray-800">Pendências</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Atualizado em {formatDateBR(selected.updated_at)}
                  </div>
                </div>

                <div className="mt-3">
                  {pendenciaItems(selected).length ? (
                    <div className="flex flex-col gap-2">
                      {pendenciaItems(selected).map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-red-50/40"
                        >
                          <div className="text-sm text-red-800 font-medium">{p.label}</div>
                          <button
                            type="button"
                            className="text-sm px-3 py-1.5 rounded-lg bg-white border hover:bg-gray-50 transition"
                            onClick={() => {
                              window.location.href = `/clientes/${selected.id}/editar#${p.hash || ""}`;
                            }}
                          >
                            {p.actionLabel} →
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                      <BadgeCheck className="w-4 h-4" />
                      Tudo certo por aqui
                    </div>
                  )}
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Dica: completar pendências melhora a consistência do cadastro e facilita publicação/atualizações.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <Skeleton className="h-24 w-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
