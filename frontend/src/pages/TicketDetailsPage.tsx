import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTicket, useUpdateTicket, TicketStatus, TicketPrioridade, useCreateSubtask, useToggleSubtask, useDeleteSubtask } from "@/hooks/useTickets";

/** ---------------------------
 * Utils
 * -------------------------- */
function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

function toDateInputValue(iso?: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
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

function prioridadeLabelPt(p: string) {
  const map: Record<string, string> = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    urgente: "Urgente",
  };
  return map[p] ?? p;
}

function statusTone(status: string): "neutral" | "info" | "warn" | "danger" | "success" {
  if (["aberto"].includes(status)) return "neutral";
  if (["assigned", "em_andamento"].includes(status)) return "info";
  if (["aguardando_cliente", "aguardando_interno"].includes(status)) return "warn";
  if (["resolvido", "concluido"].includes(status)) return "success";
  if (["fechado", "closed"].includes(status)) return "neutral";
  if (["cancelado", "canceled"].includes(status)) return "danger";
  return "neutral";
}

function prioridadeTone(p: string): "neutral" | "info" | "warn" | "danger" {
  if (p === "baixa") return "neutral";
  if (p === "media") return "info";
  if (p === "alta") return "warn";
  if (p === "urgente") return "danger";
  return "neutral";
}

function extractErrorMessage(err: any) {
  const apiMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message;

  const validation = err?.response?.data?.errors;
  if (validation && typeof validation === "object") {
    const firstKey = Object.keys(validation)[0];
    const firstMsg = validation[firstKey]?.[0];
    if (firstMsg) return String(firstMsg);
  }

  return apiMsg ? String(apiMsg) : "Erro inesperado ao salvar.";
}

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
      className={`mb-4 flex items-start justify-between gap-4 rounded-2xl border p-4 text-sm shadow-sm ${type === "success"
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
              className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50 ${tone === "danger" ? "bg-red-600 hover:opacity-95" : "bg-gray-900 hover:opacity-95"
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
function ActionMenu({
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
        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        title="Mais ações"
      >
        Mais ações ▾
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          />
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
            {items.map((it, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
                className={`w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 ${it.danger ? "text-red-700" : "text-gray-800"
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
 * Timeline feed helpers
 * -------------------------- */
function actionIcon(action: string) {
  const a = String(action || "").toLowerCase();

  if (a.includes("created")) return "🟦";
  if (a.includes("assigned")) return "👤";
  if (a.includes("status")) return "🔁";
  if (a.includes("priority")) return "⚡";
  if (a.includes("comment")) return "💬";
  return "•";
}

function actionLabel(action: string) {
  const a = String(action || "").toLowerCase();

  if (a === "created") return "Ticket criado";
  if (a === "assigned") return "Responsável alterado";
  if (a === "status_changed") return "Status alterado";
  if (a === "priority_changed") return "Prioridade alterada";
  if (a === "comment") return "Comentário";
  return action || "Evento";
}

/** ---------------------------
 * Page
 * -------------------------- */
export default function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const ticketId = useMemo(() => (id ? Number(id) : undefined), [id]);
  const { data: ticket, isLoading, isError } = useTicket(ticketId);

  const update = useUpdateTicket(ticketId || 0);

  const [newSubtask, setNewSubtask] = useState("");
  const createSubtask = useCreateSubtask(ticketId || 0);
  const toggleSubtask = useToggleSubtask(ticketId || 0);
  const deleteSubtask = useDeleteSubtask(ticketId || 0);

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [prioridade, setPrioridade] = useState<TicketPrioridade | "">("");
  const [dueAt, setDueAt] = useState<string>("");

  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const canSubmit = !!ticketId && !update.isPending;

  const clienteNome = ticket?.cliente?.nome_fantasia || ticket?.cliente?.razao_social || "—";
  const clienteId = ticket?.cliente?.id ?? ticket?.cliente_id ?? null;

  async function quickUpdate(payload: any, successMsg: string) {
    setToast(null);
    try {
      await update.mutateAsync(payload);
      setToast({ type: "success", msg: successMsg });
    } catch (e: any) {
      // ✅ pega o 422 do Criativo (logo + imagens) e exibe
      setToast({ type: "error", msg: extractErrorMessage(e) });
      throw e;
    }
  }

  async function onAddComment() {
    const msg = comment.trim();
    if (!ticketId || !msg) return;
    await quickUpdate({ comment: msg }, "Comentário adicionado e registrado na timeline.");
    setComment("");
  }

  async function onAddSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    try {
      await createSubtask.mutateAsync({ title: newSubtask });
      setNewSubtask("");
    } catch {
      setToast({ type: "error", msg: "Erro ao criar subtarefa." });
    }
  }

  function openConfirm(cfg: Omit<NonNullable<ConfirmState>, "onConfirm"> & { onConfirm: NonNullable<ConfirmState>["onConfirm"] }) {
    setConfirm({
      title: cfg.title,
      description: cfg.description,
      confirmText: cfg.confirmText,
      cancelText: cfg.cancelText,
      tone: cfg.tone,
      onConfirm: cfg.onConfirm,
    });
  }

  async function onAssume() {
    if (!ticketId || !user?.id) return;

    openConfirm({
      title: `Assumir Ticket #${ticketId}?`,
      description: `Cliente: ${clienteNome}\nTítulo: ${ticket?.titulo || ""}`,
      confirmText: "Assumir",
      cancelText: "Cancelar",
      onConfirm: async () => {
        await quickUpdate(
          { assignee_id: user.id, status: ticket?.status === "aberto" ? "assigned" : ticket?.status, comment: "Ticket assumido" },
          "Ticket assumido."
        );
      },
    });
  }

  function confirmStatusChange(next: TicketStatus, opts?: { comment?: string; title?: string; description?: string; tone?: "default" | "danger" }) {
    if (!ticketId) return;

    const label = statusLabelPt(next);
    const isStrong = ["resolvido", "concluido", "fechado", "cancelado"].includes(next);

    const title = opts?.title || `Confirmar: ${label}`;
    const description =
      opts?.description ||
      (next === "resolvido"
        ? `No setor Criativo, só resolve se o cliente tiver LOGO e IMAGENS cadastradas.\n\nDeseja continuar?`
        : `Deseja realmente marcar este ticket como ${label}?`);

    openConfirm({
      title,
      description: isStrong ? description : `Deseja marcar como ${label}?`,
      confirmText: "Confirmar",
      cancelText: "Cancelar",
      tone: opts?.tone || (next === "cancelado" ? "danger" : "default"),
      onConfirm: async () => {
        await quickUpdate({ status: next, comment: opts?.comment || label }, `Marcado como ${label}.`);
      },
    });
  }

  async function onChangeStatus() {
    if (!ticketId || !status) return;
    // manda por modal para todos; fica consistente
    confirmStatusChange(status, { comment: `Status alterado para ${statusLabelPt(status)}` });
    setStatus("");
  }

  async function onChangePrioridade() {
    if (!ticketId || !prioridade) return;
    await quickUpdate({ prioridade }, "Prioridade atualizada.");
    setPrioridade("");
  }

  async function onChangeDueAt() {
    if (!ticketId) return;
    const payload = dueAt ? { due_at: dueAt } : { due_at: null };
    await quickUpdate(payload, dueAt ? "Prazo atualizado." : "Prazo removido.");
  }

  const headerBadges = (
    <div className="flex flex-wrap items-center gap-2">
      {ticket?.setor && <Badge>{ticket.setor}</Badge>}
      {ticket?.status && <Badge tone={statusTone(ticket.status)}>{statusLabelPt(ticket.status)}</Badge>}
      {ticket?.prioridade && <Badge tone={prioridadeTone(ticket.prioridade)}>{prioridadeLabelPt(ticket.prioridade)}</Badge>}
      {ticket?.due_at && <Badge tone="warn">Prazo: {fmtDate(ticket.due_at)}</Badge>}
    </div>
  );

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
        loading={update.isPending}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          const fn = confirm?.onConfirm;
          setConfirm(null);
          if (fn) await fn();
        }}
      />

      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-1 text-sm text-gray-600">
            <Link to="/tickets" className="hover:underline">
              Tickets
            </Link>{" "}
            / #{ticketId}
          </div>

          <h1 className="truncate text-2xl font-semibold text-gray-900">
            {ticket?.titulo ? ticket.titulo : "Detalhe do Ticket"}
          </h1>

          <div className="mt-2">{headerBadges}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
            onClick={() => navigate(-1)}
          >
            Voltar
          </button>

          {/* Primárias */}
          {ticket && !ticket.assignee_id && (
            <button
              disabled={!canSubmit}
              onClick={onAssume}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
              title="Assumir este ticket"
            >
              Assumir
            </button>
          )}

          {ticket && (
            <button
              disabled={!canSubmit}
              onClick={() => confirmStatusChange("resolvido", { comment: "Resolvido" })}
              className="rounded-xl bg-[#B70F0A] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
              title="No Criativo, só resolve se cliente tiver logo e imagens"
            >
              Resolver
            </button>
          )}

          {/* Secundárias em dropdown */}
          {ticket && (
            <ActionMenu
              disabled={!canSubmit}
              items={[
                { label: "Marcar como Em andamento", onClick: () => confirmStatusChange("em_andamento", { comment: "Em andamento" }) },
                { label: "Marcar como Aguardando cliente", onClick: () => confirmStatusChange("aguardando_cliente", { comment: "Aguardando retorno do cliente" }) },
                { label: "Marcar como Aguardando interno", onClick: () => confirmStatusChange("aguardando_interno", { comment: "Aguardando interno" }) },
                { label: "Fechar ticket", onClick: () => confirmStatusChange("fechado", { comment: "Fechado" }) },
                { label: "Cancelar ticket", danger: true, onClick: () => confirmStatusChange("cancelado", { comment: "Cancelado", tone: "danger" }) },
              ]}
            />
          )}
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.msg} onClose={() => setToast(null)} />}

      {isLoading && <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Carregando...</div>}

      {isError && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-red-600 shadow-sm">
          Erro ao carregar ticket.
        </div>
      )}

      {ticket && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Conteúdo principal */}
          <div className="lg:col-span-2 space-y-4">
            {/* Descrição */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-600">Descrição</div>
              {ticket.descricao ? (
                <div className="mt-2 whitespace-pre-line text-sm text-gray-800">{ticket.descricao}</div>
              ) : (
                <div className="mt-2 text-sm text-gray-500">Sem descrição.</div>
              )}
            </div>

            {/* Subtarefas */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Checklist (Subtarefas)</div>
                <div className="text-xs text-gray-500 font-medium">
                  {ticket.completed_subtasks_count || 0}/{ticket.subtasks_count || 0}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {ticket.subtasks?.map(st => (
                  <div key={st.id} className="flex items-start gap-3 group">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                      checked={st.is_completed}
                      onChange={() => toggleSubtask.mutate(st.id)}
                      disabled={toggleSubtask.isPending || deleteSubtask.isPending}
                    />
                    <div className="flex-1">
                      <div className={`text-sm ${st.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {st.title}
                      </div>
                      {st.is_completed && st.completedBy && (
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          Concluído por {st.completedBy.name} em {fmtDate(st.completed_at)}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm("Tem certeza que deseja remover esta subtarefa?")) {
                          deleteSubtask.mutate(st.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                      title="Excluir"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {(!ticket.subtasks || ticket.subtasks.length === 0) && (
                  <div className="text-sm text-gray-500 italic">Nenhuma subtarefa.</div>
                )}
              </div>

              <form onSubmit={onAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nova subtarefa..."
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:bg-white"
                  value={newSubtask}
                  onChange={e => setNewSubtask(e.target.value)}
                  disabled={createSubtask.isPending}
                />
                <button
                  type="submit"
                  disabled={!newSubtask.trim() || createSubtask.isPending}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                >
                  Adicionar
                </button>
              </form>
            </div>

            {/* Meta cards */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium text-gray-600">Cliente</div>

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

                <div className="mt-1 font-semibold text-gray-900">{clienteNome}</div>
                {ticket.cliente?.cpf_cnpj && <div className="mt-1 text-xs text-gray-500">{ticket.cliente.cpf_cnpj}</div>}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-medium text-gray-600">Informações</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{ticket.setor}</Badge>
                  <Badge tone={statusTone(ticket.status)}>{statusLabelPt(ticket.status)}</Badge>
                  <Badge tone={prioridadeTone(ticket.prioridade)}>{prioridadeLabelPt(ticket.prioridade)}</Badge>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Criado em: {fmtDate(ticket.created_at)} <br />
                  Atualizado em: {fmtDate(ticket.updated_at)}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-medium text-gray-600">Responsável</div>
                <div className="mt-1 font-semibold text-gray-900">{ticket.assignee?.name ? ticket.assignee.name : "Sem responsável"}</div>
                <div className="mt-1 text-xs text-gray-500">{ticket.assignee?.email ? ticket.assignee.email : "—"}</div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-medium text-gray-600">Prazo</div>
                <div className="mt-1 font-semibold text-gray-900">{fmtDate(ticket.due_at)}</div>

                <div className="mt-3 flex flex-col gap-2">
                  <input
                    type="date"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={dueAt || toDateInputValue(ticket.due_at)}
                    onChange={(e) => setDueAt(e.target.value)}
                  />

                  <div className="flex gap-2">
                    <button
                      disabled={!canSubmit}
                      onClick={onChangeDueAt}
                      className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      Salvar
                    </button>

                    <button
                      disabled={!canSubmit}
                      onClick={() =>
                        openConfirm({
                          title: "Remover prazo?",
                          description: "Tem certeza que deseja remover o prazo deste ticket?",
                          confirmText: "Remover",
                          cancelText: "Cancelar",
                          tone: "danger",
                          onConfirm: async () => {
                            setDueAt("");
                            await quickUpdate({ due_at: null, comment: "Prazo removido" }, "Prazo removido.");
                          },
                        })
                      }
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                      title="Remover prazo"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Ajustes manuais (status/prioridade) */}
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Alterar status</label>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="">Selecione…</option>
                  <option value="aberto">Aberto</option>
                  <option value="assigned">Atribuído</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="aguardando_cliente">Aguardando cliente</option>
                  <option value="aguardando_interno">Aguardando interno</option>
                  <option value="resolvido">Resolvido</option>
                  <option value="concluido">Concluído</option>
                  <option value="fechado">Fechado</option>
                  <option value="cancelado">Cancelado</option>
                </select>

                <button
                  disabled={!canSubmit || !status}
                  onClick={onChangeStatus}
                  className="mt-2 w-full rounded-xl bg-[#B70F0A] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                >
                  Salvar status
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Prioridade</label>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value as any)}
                >
                  <option value="">Selecione…</option>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>

                <button
                  disabled={!canSubmit || !prioridade}
                  onClick={onChangePrioridade}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Salvar prioridade
                </button>
              </div>
            </div>

            {/* Comentário */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-2 text-sm font-semibold text-gray-900">Atualização / Comentário</div>

              <textarea
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                rows={3}
                placeholder="Escreva um update… (isso entra na timeline)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-gray-500">{update.isPending ? "Salvando…" : "Comentários ficam registrados na timeline."}</div>
                <button
                  disabled={!canSubmit || !comment.trim()}
                  onClick={onAddComment}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                >
                  Publicar
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Activity Feed */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-gray-900">Timeline</div>

            {(!ticket.logs || ticket.logs.length === 0) && <div className="text-sm text-gray-600">Sem histórico ainda.</div>}

            {ticket.logs && ticket.logs.length > 0 && (
              <div className="space-y-3">
                {ticket.logs.map((l) => (
                  <div key={l.id} className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm">
                      {actionIcon(l.action)}
                    </div>

                    <div className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-gray-800">{actionLabel(l.action)}</div>
                        <div className="text-xs text-gray-500">{fmtDate(l.created_at)}</div>
                      </div>

                      {l.message && <div className="mt-1 whitespace-pre-line text-sm text-gray-800">{l.message}</div>}

                      <div className="mt-2 text-xs text-gray-500">
                        {l.user?.name ? `por ${l.user.name}` : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
