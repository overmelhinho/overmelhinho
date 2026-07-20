// /var/www/frontend/src/pages/clientes/ClientesList.tsx
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
  ClipboardCheck,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import { FaWaze } from "react-icons/fa";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  slug: string;
  nome_fantasia: string;
  cpf_cnpj: string | null;
  logo_url?: string | null;
  tipo_cliente?: TipoCliente | string | null;
  status_assinatura?: StatusAssinatura | null;
  observacoes?: string | null;
  exibir_no_site?: boolean;

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
  // Verifica se existe logo (não nulo e não string vazia)
  const hasLogo = !!c.logo_url && c.logo_url.trim().length > 0;
  
  // Verifica galeria (pode vir via count ou array se for completo)
  const galCount = c.galeria_imagens_count ?? (c as any).galeria_imagens?.length ?? 0;
  const hasGaleria = galCount > 0;

  // SEO
  const hasSeo = hasSeoKeywords(c);

  // Mídia (Portfolio/Catálogo ou Vídeo)
  const hasPortfolio = !!c.portfolio_url && c.portfolio_url.trim().length > 0;
  const hasVideo = !!c.video && c.video.trim().length > 0;
  const hasMidia = hasPortfolio || hasVideo;

  return { 
    missingLogo: !hasLogo, 
    missingGaleria: !hasGaleria, 
    missingSeo: !hasSeo, 
    missingMidia: !hasMidia 
  };
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

function statusLabel(s?: StatusAssinatura | null, tipo?: string | null) {
  const v = (s || "").toString().toLowerCase();
  if (v === "inadimplente") return "Inadimplente";
  if (tipo === "gratuito") return "Ativa";
  if (!v) return "—";
  const map: Record<string, string> = {
    ativa: "Ativa",
    pendente: "Pendente",
    atrasada: "Atrasada",
    suspensa: "Suspensa",
    cancelada: "Cancelada",
    inadimplente: "Inadimplente",
  };
  return map[v] || v;
}

function statusChipClass(s?: StatusAssinatura | null, tipo?: string | null) {
  const v = (s || "").toString().toLowerCase();
  if (v === "inadimplente") return "bg-red-50 text-red-700 border-red-200";
  if (tipo === "gratuito") return "bg-green-50 text-green-700 border-green-200";
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
  const navigate = useNavigate();
  const [search, setSearch] = useState(() => sessionStorage.getItem('clientes_search') || "");

  const [searchDebounced, setSearchDebounced] = useState(() => sessionStorage.getItem('clientes_searchDebounced') || "");
  const [tipo, setTipo] = useState<"all" | TipoCliente>(() => (sessionStorage.getItem('clientes_tipo') as any) || "all");
  const [visibilidade, setVisibilidade] = useState<"all" | "visible" | "hidden">(() => (sessionStorage.getItem('clientes_visibilidade') as any) || "all");
  const [statusFilter, setStatusFilter] = useState<string>(() => sessionStorage.getItem('clientes_statusFilter') || "all");
  const [sort, setSort] = useState<string>(() => sessionStorage.getItem('clientes_sort') || "latest");
  const [page, setPage] = useState<number>(() => Number(sessionStorage.getItem('clientes_page')) || 1);

  useEffect(() => {
    sessionStorage.setItem('clientes_search', search);
    sessionStorage.setItem('clientes_searchDebounced', searchDebounced);
    sessionStorage.setItem('clientes_tipo', tipo);
    sessionStorage.setItem('clientes_visibilidade', visibilidade);
    sessionStorage.setItem('clientes_statusFilter', statusFilter);
    sessionStorage.setItem('clientes_sort', sort);
    sessionStorage.setItem('clientes_page', page.toString());
  }, [search, searchDebounced, tipo, visibilidade, statusFilter, sort, page]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<ClienteLite | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<ClienteLite | null>(null);

  const handleDelete = async () => {
    if (!clienteToDelete) return;

    try {
      await axios.delete(`/v1/clientes/${clienteToDelete.id}`);
      toast.success("Cliente excluído com sucesso!");
      setDeleteModalOpen(false);
      setClienteToDelete(null);
      refetch();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Erro ao excluir cliente.";
      toast.error(msg);
    }
  };

  const copyToClipboard = async (text: string, msg = "Copiado!") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const handleSearchTrigger = (v: string) => {
    setSearchDebounced(v);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchTrigger(search);
    }
  };

  const queryKey = useMemo(() => ["clientes", { page, sort, searchDebounced, tipo, visibilidade, statusFilter }], [page, sort, searchDebounced, tipo, visibilidade, statusFilter]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey,
    placeholderData: (prev: any) => prev,
    staleTime: 60_000,
    queryFn: async () => {
      if (!navigator.onLine) {
        try {
          const { get } = await import('idb-keyval');
          const offlineDb: any[] = (await get('offline_clientes_db')) || [];
          
          let filteredRows = offlineDb;
          if (searchDebounced) {
            const qLower = searchDebounced.toLowerCase();
            filteredRows = filteredRows.filter(r => 
              (r.nome_fantasia?.toLowerCase() || "").includes(qLower) ||
              (r.razao_social?.toLowerCase() || "").includes(qLower) ||
              (r.cpf_cnpj || "").includes(qLower)
            );
          }
          if (tipo !== "all") filteredRows = filteredRows.filter(r => r.tipo_cliente === tipo);
          if (statusFilter !== "all") filteredRows = filteredRows.filter(r => r.status_assinatura === statusFilter);
          
          const perPage = 15; // default pagination
          const total = filteredRows.length;
          const start = (page - 1) * perPage;
          const paginated = filteredRows.slice(start, start + perPage);
          
          return {
             data: paginated,
             meta: {
                current_page: page,
                last_page: Math.ceil(total / perPage) || 1,
                per_page: perPage,
                total,
             }
          };
        } catch(e) {
          console.error('Erro ao ler banco offline na listagem', e);
          return { data: [], meta: null };
        }
      }

      const resp = await axios.get("/v1/clientes", {
        params: {
          page,
          lite: true,
          sort,
          q: searchDebounced,
          tipo: tipo !== "all" ? tipo : undefined,
          visibilidade: visibilidade !== "all" ? visibilidade : undefined,
          status_assinatura: statusFilter !== "all" ? statusFilter : undefined,
        },
      });
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
      inadimplente: 0,
    };
    for (const c of clientesRaw) {
      const isGratuito = (c.tipo_cliente || "").toLowerCase() === "gratuito";
      let v = (c.status_assinatura || "").toString().toLowerCase();
      
      if (v !== "inadimplente" && isGratuito) {
        v = "ativa";
      }

      if (v === "ativa") s.ativa += 1;
      else if (v === "pendente") s.pendente += 1;
      else if (v === "atrasada") s.atrasada += 1;
      else if (v === "suspensa") s.suspensa += 1;
      else if (v === "cancelada") s.cancelada += 1;
      else if (v === "inadimplente") s.inadimplente += 1;
    }
    return s;
  }, [clientesRaw]);

  const clientes = useMemo(() => {
    return clientesRaw;
  }, [clientesRaw]);

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
    <div className="p-2 md:p-6 lg:p-10 w-full space-y-6">
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
            onClick={() => navigate("/clientes/novo")}
          >
            + Novo cliente
          </button>
        </div>
      </div>

      {/* Cards rápidos */}
      <div className="flex md:grid md:grid-cols-7 gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
        <div className="border rounded-2xl p-4 bg-white shadow-sm min-w-[140px] md:min-w-0 snap-start shrink-0">
          <div className="text-xs font-semibold text-gray-500">Total</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">
            {meta?.total ?? stats.totalPagina}
          </div>
          <div className="text-xs text-gray-400 mt-1">Sistema</div>
        </div>

        <div className="border rounded-2xl p-4 bg-white shadow-sm min-w-[140px] md:min-w-0 snap-start shrink-0">
          <div className="text-xs font-semibold text-gray-500">Ativas</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">{stats.ativa}</div>
          <div className="text-xs text-gray-400 mt-1">Página atual</div>
        </div>

        <div className="border rounded-2xl p-4 bg-white shadow-sm min-w-[140px] md:min-w-0 snap-start shrink-0">
          <div className="text-xs font-semibold text-gray-500">Pendentes</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">{stats.pendente}</div>
          <div className="text-xs text-gray-400 mt-1">Página atual</div>
        </div>

        <div className="border rounded-2xl p-4 bg-white shadow-sm min-w-[140px] md:min-w-0 snap-start shrink-0">
          <div className="text-xs font-semibold text-gray-500">Atrasadas</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">{stats.atrasada}</div>
          <div className="text-xs text-gray-400 mt-1">Página atual</div>
        </div>

        <div className="border rounded-2xl p-4 bg-white shadow-sm min-w-[140px] md:min-w-0 snap-start shrink-0">
          <div className="text-xs font-semibold text-gray-500">Suspensas</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">{stats.suspensa}</div>
          <div className="text-xs text-gray-400 mt-1">Página atual</div>
        </div>

        <div className="border rounded-2xl p-4 bg-white shadow-sm min-w-[140px] md:min-w-0 snap-start shrink-0">
          <div className="text-xs font-semibold text-gray-500">Inadimplentes</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">{stats.inadimplente}</div>
          <div className="text-xs text-gray-400 mt-1">Página atual</div>
        </div>

        <div className="border rounded-2xl p-4 bg-white shadow-sm min-w-[140px] md:min-w-0 snap-start shrink-0">
          <div className="text-xs font-semibold text-gray-500">Canceladas</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">{stats.cancelada}</div>
          <div className="text-xs text-gray-400 mt-1">Página atual</div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm sticky top-4 z-20">
        <div className="flex flex-col gap-4">
          {/* Row 1: Search */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pesquisar..."
                className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-[#B70F0A] outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden p-2.5 border rounded-xl bg-gray-50 text-gray-600 active:scale-95 transition-transform"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Row 2: Filters */}
          <div className={`flex items-center gap-2 flex-wrap ${showFilters ? 'flex' : 'hidden md:flex'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-2 border rounded-xl bg-white w-full md:w-auto">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={tipo || "all"} onValueChange={(val: any) => setTipo(val)}>
                <SelectTrigger className="h-auto border-0 p-0 shadow-none text-sm outline-none w-full md:w-[130px] focus:ring-0 [&>svg]:opacity-50 font-medium text-slate-700 bg-transparent">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="pagante">Apenas Pagantes</SelectItem>
                  <SelectItem value="gratuito">Apenas Gratuitos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-2 border rounded-xl bg-white w-full md:w-auto">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={statusFilter || "all"} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger className="h-auto border-0 p-0 shadow-none text-sm outline-none w-full md:w-[140px] focus:ring-0 [&>svg]:opacity-50 font-medium text-slate-700 bg-transparent">
                  <SelectValue placeholder="Qualquer Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer Status</SelectItem>
                  <SelectItem value="ativa">Ativo</SelectItem>
                  <SelectItem value="inadimplente">Inadimplente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-2 border rounded-xl bg-white w-full md:w-auto">
              <Eye className="w-4 h-4 text-gray-500" />
              <Select value={visibilidade || "all"} onValueChange={(val: any) => setVisibilidade(val)}>
                <SelectTrigger className="h-auto border-0 p-0 shadow-none text-sm outline-none w-full md:w-[170px] focus:ring-0 [&>svg]:opacity-50 font-medium text-slate-700 bg-transparent">
                  <SelectValue placeholder="Qualquer Visibilidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer Visibilidade</SelectItem>
                  <SelectItem value="visible">Apenas Visíveis no Site</SelectItem>
                  <SelectItem value="hidden">Apenas Ocultos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-2 border rounded-xl bg-white w-full md:w-auto">
              <Select value={sort} onValueChange={(val) => setSort(val)}>
                <SelectTrigger className="h-auto border-0 p-0 shadow-none text-sm font-medium w-full md:w-[170px] outline-none focus:ring-0 [&>svg]:opacity-50 text-slate-700 bg-transparent">
                  <SelectValue placeholder="Ordernar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">✨ Recém Cadastrados</SelectItem>
                  <SelectItem value="oldest">Mais Antigos</SelectItem>
                  <SelectItem value="nome">Nome (A-Z)</SelectItem>
                  <SelectItem value="default">Ranking SaaS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <button
              className="px-3 py-2.5 border rounded-xl text-sm bg-gray-50 font-bold hover:bg-gray-100 transition w-full md:w-auto"
              onClick={() => {
                setSearch("");
                setSearchDebounced("");
                setTipo("all");
                setVisibilidade("all");
                setStatusFilter("all");
                setSort("latest");
                setPage(1);
                setTimeout(() => refetch(), 0);
                toast.success("Filtros limpos.");
                setShowFilters(false);
              }}
            >
              Limpar Filtros
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
          <>
            <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-medium px-2 py-3">Cliente</th>
                  <th className="text-left font-medium px-2 py-3 hidden md:table-cell">Tipo</th>
                  <th className="text-left font-medium px-2 py-3">Status</th>
                  <th className="text-left font-medium px-2 py-3 hidden md:table-cell">Endereço</th>
                  <th className="text-left font-medium px-2 py-3 hidden md:table-cell">Telefone</th>
                  <th className="text-right font-medium px-2 py-3">Ações</th>
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
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg border bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                            {c.logo_url ? (
                              <img src={c.logo_url} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] text-gray-400 font-bold">LOGO</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {c.nome_fantasia}
                              {(c.exibir_no_site === false || c.exibir_no_site === "false") && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-700 border border-red-200">
                                  <EyeOff className="w-3 h-3" /> Oculto no Site
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {cidadeUF || "—"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-2 py-3 hidden md:table-cell">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full border text-[10px] ${tipoChipClass(
                            c
                          )}`}
                        >
                          {tipoLabel(c)}
                        </span>
                      </td>

                      <td className="px-2 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full border text-[10px] ${statusChipClass(
                            c.status_assinatura,
                            c.tipo_cliente
                          )}`}
                        >
                          {statusLabel(c.status_assinatura, c.tipo_cliente)}
                        </span>
                      </td>

                      <td className="px-2 py-3 hidden md:table-cell">
                        <div
                          className="text-xs text-gray-500 max-w-[140px] truncate"
                          title={enderecoLista}
                        >
                          {enderecoLista}
                        </div>
                      </td>

                      <td className="px-2 py-3 hidden md:table-cell">
                        {telefone ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-1.5 py-1 rounded-lg border bg-white hover:bg-gray-50 text-[11px] transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(telefone, "Telefone copiado!");
                            }}
                            title="Clique para copiar"
                          >
                            <Phone className="w-3.5 h-3.5 text-gray-500" />
                            <span>{telefone}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">—</span>
                        )}
                      </td>

                      <td className="px-2 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            className="px-2 py-1.5 rounded-lg border text-[10px] bg-red-600 border-red-700 text-white hover:bg-red-700 transition font-bold flex items-center gap-1 shadow-sm md:hidden"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/clientes/${c.id}/venda`);
                            }}
                          >
                            <span className="hidden sm:inline">Modo Venda</span>
                            <span className="sm:hidden">Venda</span>
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1.5 rounded-lg border text-[10px] bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 transition font-bold flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/auditoria/${c.id}`);
                            }}
                          >
                            <ClipboardCheck size={12} />
                            <span className="hidden sm:inline">Conf.</span>
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1.5 rounded-lg border text-[10px] bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100 transition font-bold"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/clientes/${c.id}/hub`);
                            }}
                          >
                            <span className="hidden sm:inline">Relatórios</span>
                            <span className="sm:hidden">Relat.</span>
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1.5 rounded-lg border text-[10px] hover:bg-gray-50 transition font-bold"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/clientes/${c.id}/editar`);
                            }}
                          >
                            <span className="hidden sm:inline">Editar</span>
                            <span className="sm:hidden">Edit</span>
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1.5 rounded-lg border text-[10px] bg-red-50 border-red-100 text-red-700 hover:bg-red-100 transition font-bold"
                            onClick={(e) => {
                              e.stopPropagation();
                              setClienteToDelete(c);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 size={12} className="sm:hidden" />
                            <span className="hidden sm:inline">Excluir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-gray-100 flex flex-col">
              {clientes.map((c) => {
                const cidadeUF = getCidadeUF(c);
                const telefone = c?.contatos?.[0]?.telefone_principal || "";
                
                // Monta o endereço para o Waze
                const end = c.enderecos?.[0];
                const wazeParts = [c.nome_fantasia];
                if (end?.rua) wazeParts.push(end.rua);
                if (end?.numero) wazeParts.push(end.numero);
                if (end?.cidade || cidadeUF) wazeParts.push(end?.cidade || cidadeUF);
                const wazeQuery = encodeURIComponent(wazeParts.join(", "));
                const wazeUrl = `https://waze.com/ul?q=${wazeQuery}`;

                return (
                  <div key={clienteRowKey(c) + '_mob'} className="p-4 bg-white flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl border bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                        {c.logo_url ? (
                          <img src={c.logo_url} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[12px] text-gray-400 font-bold">LOGO</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate text-base">{c.nome_fantasia}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{cidadeUF || "Sem endereço"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => navigate(`/clientes/${c.id}/venda`)}
                        className="flex-1 bg-red-600 text-white font-bold text-sm h-11 rounded-[14px] shadow-sm flex justify-center items-center gap-2 active:scale-95 transition-transform"
                      >
                        Modo Venda
                      </button>
                      
                      {/* Waze Button */}
                      <a
                        href={wazeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-11 h-11 bg-blue-500 text-white rounded-[14px] shadow-sm flex justify-center items-center shrink-0 active:scale-95 transition-transform"
                        title="Abrir no Waze"
                      >
                        <FaWaze size={22} fill="currentColor" />
                      </a>

                      {telefone ? (
                        <a
                          href={`https://wa.me/55${telefone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-11 h-11 bg-green-500 text-white rounded-[14px] shadow-sm flex justify-center items-center shrink-0 active:scale-95 transition-transform"
                          title="Abrir no WhatsApp"
                        >
                          <Phone size={18} fill="currentColor" />
                        </a>
                      ) : (
                        <div className="w-11 h-11 bg-gray-100 rounded-[14px] shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
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
        <DialogContent className="sm:max-w-[860px] p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-5 border-b bg-white shrink-0">
            <DialogHeader>
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex items-start gap-4 flex-1 w-full">
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
                </div>

                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full md:w-auto">
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
                    label="Modo Venda"
                    icon={<ClipboardCheck className="w-4 h-4 text-amber-600" />}
                    onClick={() => {
                      if (!selected) return;
                      navigate(`/clientes/${selected.id}/venda`);
                    }}
                  />

                  <ActionButton
                    label="Conferência"
                    icon={<ClipboardCheck className="w-4 h-4" />}
                    onClick={() => {
                      if (!selected) return;
                      window.location.href = `/auditoria/${selected.id}`;
                    }}
                  />

                  <ActionButton
                    label="Abrir"
                    icon={<ExternalLink className="w-4 h-4" />}
                    onClick={() => {
                      if (!selected) return;
                      const siteUrl = window.location.hostname === "localhost" 
                        ? "http://localhost:3000" 
                        : "https://novo.overmelhinho.com.br";
                      window.open(`${siteUrl}/cliente/${selected.slug || selected.id}`, "_blank");
                    }}
                  />


                </div>
              </div>
            </DialogHeader>
          </div>

          {selected ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 custom-scrollbar">
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

                {selected.observacoes && (
                  <div className="md:col-span-2">
                    <InfoCard title="Observações Internas" icon={<Search className="w-4 h-4" />}>
                      <div className="whitespace-pre-line text-xs italic text-gray-600">
                        {selected.observacoes}
                      </div>
                    </InfoCard>
                  </div>
                )}
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

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="py-4">
              Você está prestes a excluir o cliente{" "}
              <span className="font-bold text-gray-900">
                {clienteToDelete?.nome_fantasia}
              </span>
              . <br />
              Esta ação é <span className="text-red-600 font-bold uppercase">irreversível</span> e removerá
              todos os dados vinculados (contatos, faturas, vagas, etc).
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border hover:bg-gray-50 text-sm font-medium transition"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium transition"
              onClick={handleDelete}
            >
              Sim, excluir permanentemente
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
