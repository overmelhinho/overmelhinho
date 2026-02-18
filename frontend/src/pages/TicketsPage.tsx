import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTickets, useTicketAssignees, Ticket } from "@/hooks/useTickets";

type TabKey = "open_all" | "my_open" | "overdue" | "all";

/** ---------------------------
 * UI atoms
 * -------------------------- */
function Badge({
  children,
  tone = "neutral",
}: {
  children: any;
  tone?: "neutral" | "info" | "warn" | "danger" | "success";
}) {
  const cls =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "warn"
      ? "border-yellow-200 bg-yellow-50 text-yellow-800"
      : tone === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : tone === "info"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-gray-200 bg-white text-gray-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function Toast({
  type,
  message,
  onClose,
}: {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className={`mb-4 flex items-start justify-between gap-4 rounded-2xl border p-4 text-sm shadow-sm ${
        type === "success"
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <div className="leading-relaxed whitespace-pre-line">{message}</div>
      <button onClick={onClose} className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-black/5">
        ✕
      </button>
    </div>
  );
}

/** ---------------------------
 * Confirm modal (sem libs)
 * -------------------------- */
type ConfirmState =
  | null
  | {
      title: string;
      description?: string;
      confirmText?: string;
      cancelText?: string;
      tone?: "default" | "danger";
      onConfirm: () => Promise<void> | void;
    };

function ConfirmDialog({
  open,
  loading,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  tone = "default",
}: {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "default" | "danger";
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={loading ? undefined : onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
          <div className="text-base font-semibold text-gray-900">{title}</div>
          {description && <div className="mt-2 text-sm text-gray-600 whitespace-pre-line">{description}</div>}

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              disabled={!!loading}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              disabled={!!loading}
              className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50 ${
                tone === "danger" ? "bg-red-600 hover:opacity-95" : "bg-gray-900 hover:opacity-95"
              }`}
            >
              {loading ? "Processando..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ---------------------------
 * Dropdown menu (sem libs)
 * -------------------------- */
function RowMenu({
  disabled,
  items,
}: {
  disabled?: boolean;
  items: { label: string; danger?: boolean; onClick: () => void }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        title="Mais ações"
      >
        ⋯
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} aria-label="Fechar menu" />
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
            {items.map((it, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
                className={`w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 ${
                  it.danger ? "text-red-700" : "text-gray-800"
                }`}
              >
                {it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** ---------------------------
 * Helpers
 * -------------------------- */
function statusTone(status: string): "neutral" | "info" | "warn" | "danger" | "success" {
  if (["aberto"].includes(status)) return "neutral";
  if (["assigned", "em_andamento"].includes(status)) return "info";
  if (["aguardando_cliente", "aguardando_interno"].includes(status)) return "warn";
  if (["resolvido", "concluido"].includes(status)) return "success";
  if (["fechado", "closed"].includes(status)) return "neutral";
  if (["cancelado", "canceled"].includes(status)) return "danger";
  return "neutral";
}

function statusLabelPt(status: string) {
  const map: Record<string, string> = {
    aberto: "Aberto",
    assigned: "Atribuído",
    em_andamento: "Em andamento",
    aguardando_cliente: "Aguardando cliente",
    aguardando_interno: "Aguardando interno",
    resolvido: "Resolvido",
    concluido: "Concluído",
    fechado: "Fechado",
    closed: "Fechado",
    cancelado: "Cancelado",
    canceled: "Cancelado",
  };
  return map[status] ?? status;
}

function prioridadeTone(p: string): "neutral" | "info" | "warn" | "danger" {
  if (p === "baixa") return "neutral";
  if (p === "media") return "info";
  if (p === "alta") return "warn";
  if (p === "urgente") return "danger";
  return "neutral";
}

function prioridadeLabelPt(p: string) {
  const map: Record<string, string> = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    urgente: "Urgente",
  };
  return map[p] ?? p;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

function extractErrorMessage(err: any) {
  const apiMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message;
  const validation = err?.response?.data?.errors;
  if (validation && typeof validation === "object") {
    const firstKey = Object.keys(validation)[0];
    const firstMsg = validation[firstKey]?.[0];
    if (firstMsg) return String(firstMsg);
  }
  return apiMsg ? String(apiMsg) : "Erro inesperado.";
}

function isManagerUser(user: any) {
  const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
  const perms: string[] = Array.isArray(user?.permissions) ? user.permissions : [];

  const rolesLower = roles.map((r) => String(r).toLowerCase());
  const isAdminOrGestor =
    rolesLower.includes("admin") ||
    rolesLower.includes("gestor") ||
    rolesLower.includes("gerente") ||
    rolesLower.includes("manager");

  const canManageTickets = perms.includes("manage_tickets");

  return isAdminOrGestor || canManageTickets;
}

/** Delegar select (mantive, mas mais discreto) */
function DelegarSelect({
  setor,
  currentAssigneeId,
  disabled,
  onDelegate,
}: {
  setor: string;
  currentAssigneeId?: number | null;
  disabled?: boolean;
  onDelegate: (assigneeId: number | null, label?: string) => void;
}) {
  const { data: assignees, isLoading } = useTicketAssignees(setor);

  const options = assignees ?? [];
  const value = currentAssigneeId ?? "";

  return (
    <div className="min-w-[190px]">
      <select
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        value={value as any}
        disabled={disabled || isLoading}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") {
            onDelegate(null, "Sem responsável");
            return;
          }
          const id = Number(v);
          const found = options.find((o) => o.id === id);
          onDelegate(id, found?.name);
        }}
        title="Delegar para usuário do setor"
      >
        <option value="">{isLoading ? "Carregando…" : options.length ? "Delegar…" : "Sem usuários"}</option>
        {options.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function TicketsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canDelegate = isManagerUser(user);

  const [tab, setTab] = useState<TabKey>("open_all");
  const [filters, setFilters] = useState({
    setor: "",
    prioridade: "",
    per_page: 20,
    page: 1,
    search: "",
  });

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const queryParams = useMemo(() => {
    const base: any = {
      setor: filters.setor || undefined,
      prioridade: filters.prioridade || undefined,
      per_page: filters.per_page,
      page: filters.page,
    };

    if (tab === "open_all") base.open = true;
    if (tab === "my_open") {
      base.open = true;
      base.my = true;
    }
    if (tab === "overdue") {
      base.overdue = true;
      base.open = false;
      base.my = false;
    }
    if (tab === "all") {
      base.open = false;
      base.my = false;
      base.overdue = false;
    }

    return base;
  }, [tab, filters]);

  const { data, isLoading, isError } = useTickets(queryParams);
  const rows: Ticket[] = data?.data ?? [];

  const filteredRows = useMemo(() => {
    const s = filters.search.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((t) => {
      const cliente = (t.cliente?.nome_fantasia || t.cliente?.razao_social || "").toLowerCase();
      const titulo = (t.titulo || "").toLowerCase();
      const setor = (t.setor || "").toLowerCase();
      const idStr = String(t.id);
      return cliente.includes(s) || titulo.includes(s) || setor.includes(s) || idStr.includes(s);
    });
  }, [rows, filters.search]);

  const quickMutation = useMutation({
    mutationFn: async (payload: { id: number; data: any; successMsg: string }) => {
      const { data } = await api.patch(`/v1/tickets/${payload.id}`, payload.data);
      return { ticket: data.data as Ticket, successMsg: payload.successMsg };
    },
    onSuccess: async (res) => {
      setToast({ type: "success", msg: res.successMsg });
      await qc.invalidateQueries({ queryKey: ["tickets"] });
      await qc.invalidateQueries({ queryKey: ["ticket"] });
    },
    onError: (e: any) => setToast({ type: "error", msg: extractErrorMessage(e) }),
  });

  function openConfirm(cfg: NonNullable<ConfirmState>) {
    setConfirm(cfg);
  }

  function confirmAssume(t: Ticket) {
    if (!user?.id) return;

    const clienteNome = t.cliente?.nome_fantasia || t.cliente?.razao_social || `Cliente #${t.cliente_id ?? "—"}`;

    openConfirm({
      title: `Assumir Ticket #${t.id}?`,
      description: `Cliente: ${clienteNome}\nTítulo: ${t.titulo}`,
      confirmText: "Assumir",
      cancelText: "Cancelar",
      onConfirm: async () => {
        quickMutation.mutate({
          id: t.id,
          data: { assignee_id: user.id, status: t.status === "aberto" ? "assigned" : t.status, comment: "Ticket assumido" },
          successMsg: `Ticket #${t.id} assumido.`,
        });
      },
    });
  }

  function delegate(t: Ticket, assigneeId: number | null, label?: string) {
    const msg = assigneeId ? `Delegado para ${label || `usuário #${assigneeId}`}` : "Responsável removido (sem responsável)";

    quickMutation.mutate({
      id: t.id,
      data: { assignee_id: assigneeId, comment: msg },
      successMsg: `Ticket #${t.id}: ${msg}`,
    });
  }

  const total = data?.total ?? 0;

  return (
    <div className="p-6">
      {/* Modal global */}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title || ""}
        description={confirm?.description}
        confirmText={confirm?.confirmText}
        cancelText={confirm?.cancelText}
        tone={confirm?.tone}
        loading={quickMutation.isPending}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          const fn = confirm?.onConfirm;
          setConfirm(null);
          if (fn) await fn();
        }}
      />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tickets</h1>
          <p className="text-sm text-gray-600">Central operacional (Criativo, Financeiro, etc.)</p>
        </div>

        <div className="inline-flex flex-wrap gap-2">
          <div className="inline-flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => {
                setTab("open_all");
                setFilters((f) => ({ ...f, page: 1 }));
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                tab === "open_all" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Abertos
            </button>

            <button
              onClick={() => {
                setTab("my_open");
                setFilters((f) => ({ ...f, page: 1 }));
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                tab === "my_open" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Minha fila
            </button>

            <button
              onClick={() => {
                setTab("overdue");
                setFilters((f) => ({ ...f, page: 1 }));
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                tab === "overdue" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Vencidos
            </button>

            <button
              onClick={() => {
                setTab("all");
                setFilters((f) => ({ ...f, page: 1 }));
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                tab === "all" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
              title="Inclui resolvidos/fechados/cancelados"
            >
              Todos
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.msg} onClose={() => setToast(null)} />}

      {/* Filtros */}
      <div className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-12">
        <div className="md:col-span-6">
          <label className="mb-1 block text-xs font-medium text-gray-600">Buscar</label>
          <input
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            placeholder="ID, cliente, título, setor…"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">Setor</label>
          <select
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            value={filters.setor}
            onChange={(e) => setFilters((f) => ({ ...f, setor: e.target.value, page: 1 }))}
          >
            <option value="">Todos</option>
            <option value="criativo">Criativo</option>
            <option value="financeiro">Financeiro</option>
            <option value="admin">Admin</option>
            <option value="suporte">Suporte</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">Prioridade</label>
          <select
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            value={filters.prioridade}
            onChange={(e) => setFilters((f) => ({ ...f, prioridade: e.target.value, page: 1 }))}
          >
            <option value="">Todas</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">Itens</label>
          <select
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            value={filters.per_page}
            onChange={(e) => setFilters((f) => ({ ...f, per_page: Number(e.target.value), page: 1 }))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="text-sm text-gray-700">
            {isLoading
              ? "Carregando…"
              : `Total: ${total}${filters.search.trim() ? ` (filtrado: ${filteredRows.length})` : ""}`}
          </div>

          {tab === "my_open" && (
            <div className="text-xs text-gray-500">
              Dica: tickets só aparecem aqui quando você <span className="font-semibold">assume</span> ou alguém atribui.
            </div>
          )}
        </div>

        {isError && <div className="p-6 text-sm text-red-600">Erro ao carregar tickets. Verifique token/permissões.</div>}

        {isLoading && (
          <div className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-1/2 rounded bg-gray-200" />
              <div className="h-4 w-2/3 rounded bg-gray-200" />
              <div className="h-4 w-1/3 rounded bg-gray-200" />
            </div>
          </div>
        )}

        {!isLoading && !isError && filteredRows.length === 0 && (
          <div className="p-8 text-center">
            <div className="mx-auto mb-2 text-sm font-semibold text-gray-900">Nada por aqui</div>
            <div className="mx-auto max-w-lg text-sm text-gray-600">
              {tab === "my_open"
                ? "Você não tem tickets atribuídos. Vá em “Abertos” e clique em “Assumir”."
                : "Nenhum ticket encontrado com esses filtros."}
            </div>
            {tab === "my_open" && (
              <button
                className="mt-4 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                onClick={() => setTab("open_all")}
              >
                Ver abertos
              </button>
            )}
          </div>
        )}

        {!isLoading && filteredRows.length > 0 && (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Setor</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Prioridade</th>
                  <th className="px-4 py-3">Prazo</th>
                  <th className="px-4 py-3">Criado</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredRows.map((t) => {
                  const isUnassigned = !t.assignee_id;

                  const clienteNome = t.cliente?.nome_fantasia || t.cliente?.razao_social || "—";
                  const clienteId = t.cliente?.id ?? t.cliente_id ?? null;

                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">#{t.id}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900">{clienteNome}</div>

                          {clienteId && (
                            <a
                              href={`/clientes/${clienteId}/editar`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                              title="Abrir cliente em nova aba"
                            >
                              Abrir cliente ↗
                            </a>
                          )}
                        </div>

                        {t.titulo && <div className="text-xs text-gray-500 line-clamp-1">{t.titulo}</div>}
                      </td>

                      <td className="px-4 py-3">
                        <Badge>{t.setor}</Badge>
                      </td>

                      <td className="px-4 py-3">
                        {t.assignee?.name ? (
                          <span className="text-gray-900 font-medium">{t.assignee.name}</span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}

                        {canDelegate && (
                          <div className="mt-2">
                            <DelegarSelect
                              setor={t.setor}
                              currentAssigneeId={t.assignee_id}
                              disabled={quickMutation.isPending}
                              onDelegate={(assigneeId, label) => delegate(t, assigneeId, label)}
                            />
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <Badge tone={statusTone(t.status)}>{statusLabelPt(t.status)}</Badge>
                      </td>

                      <td className="px-4 py-3">
                        <Badge tone={prioridadeTone(t.prioridade)}>{prioridadeLabelPt(t.prioridade)}</Badge>
                      </td>

                      <td className="px-4 py-3">{fmtDate(t.due_at)}</td>
                      <td className="px-4 py-3">{fmtDate(t.created_at)}</td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Primária: assumir (com modal) */}
                          {isUnassigned && tab !== "overdue" && (
                            <button
                              disabled={quickMutation.isPending}
                              onClick={() => confirmAssume(t)}
                              className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                              title="Assumir este ticket"
                            >
                              Assumir
                            </button>
                          )}

                          {/* Primária: ver */}
                          <Link
                            to={`/tickets/${t.id}`}
                            className="rounded-xl bg-[#B70F0A] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95"
                          >
                            Ver
                          </Link>

                          {/* Secundárias: dropdown (sem ações rápidas de status) */}
                          <RowMenu
                            disabled={quickMutation.isPending}
                            items={[
                              ...(clienteId
                                ? [
                                    {
                                      label: "Abrir cliente em nova aba",
                                      onClick: () => window.open(`/clientes/${clienteId}/editar`, "_blank", "noreferrer"),
                                    },
                                  ]
                                : []),
                              {
                                label: "Abrir ticket em nova aba",
                                onClick: () => window.open(`/tickets/${t.id}`, "_blank", "noreferrer"),
                              },
                              {
                                label: "Copiar ID do ticket",
                                onClick: async () => {
                                  try {
                                    await navigator.clipboard.writeText(String(t.id));
                                    setToast({ type: "success", msg: `ID #${t.id} copiado.` });
                                  } catch {
                                    setToast({ type: "error", msg: "Não foi possível copiar." });
                                  }
                                },
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && data && data.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <div className="text-sm text-gray-600">
              Página {data.current_page} de {data.last_page}
            </div>

            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                disabled={filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))}
              >
                Anterior
              </button>

              <button
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                disabled={filters.page >= data.last_page}
                onClick={() => setFilters((f) => ({ ...f, page: Math.min(data.last_page, f.page + 1) }))}
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
