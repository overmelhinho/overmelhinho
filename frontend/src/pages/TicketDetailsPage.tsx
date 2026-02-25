import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Settings2, UserCircle, Send, CheckCircle2, AlertCircle } from "lucide-react";
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

  const [isPropsModalOpen, setIsPropsModalOpen] = useState(false);

  async function handleSaveProps() {
    if (!ticketId) return;
    const payload: any = {};
    if (status) payload.status = status;
    if (prioridade) payload.prioridade = prioridade;
    payload.due_at = dueAt || null;

    try {
      await update.mutateAsync(payload);
      setToast({ type: "success", msg: "Propriedades atualizadas." });
      setIsPropsModalOpen(false);
    } catch (e: any) {
      setToast({ type: "error", msg: extractErrorMessage(e) });
    }
  }

  const headerBadges = (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {ticket?.setor && <Badge>{ticket.setor}</Badge>}
      {ticket?.status && <Badge tone={statusTone(ticket.status)}>{statusLabelPt(ticket.status)}</Badge>}
      {ticket?.prioridade && <Badge tone={prioridadeTone(ticket.prioridade)}>{prioridadeLabelPt(ticket.prioridade)}</Badge>}
      {ticket?.due_at && <Badge tone="warn">Prazo: {fmtDate(ticket.due_at)}</Badge>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F2F2F2] p-4 md:p-6 lg:p-8">
      {/* Modal Global de Confirmação */}
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

      {/* Modal Simplificado: Editar Propriedades */}
      {isPropsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsPropsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6 z-10 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Editar Propriedades</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Status</label>
                <select
                  className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold focus:ring-0 focus:border-gray-300"
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
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Prioridade</label>
                <select
                  className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold focus:ring-0 focus:border-gray-300"
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value as any)}
                >
                  <option value="">Selecione…</option>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Prazo (Due Date)</label>
                <input
                  type="date"
                  className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold focus:ring-0 focus:border-gray-300"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  onClick={() => setIsPropsModalOpen(false)}
                  className="px-5 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={!canSubmit || update.isPending}
                  onClick={handleSaveProps}
                  className="px-5 py-2 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {update.isPending ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.msg} onClose={() => setToast(null)} />}

      {isLoading && <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Carregando chamada...</div>}

      {isError && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-red-600 shadow-sm">
          Erro ao carregar ticket.
        </div>
      )}

      {ticket && (
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumbs & Actions Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} /> Voltar aos Tickets
            </button>

            <ActionMenu
              disabled={!canSubmit}
              items={[
                { label: "Marcar como Em Andamento", onClick: () => confirmStatusChange("em_andamento", { comment: "Em andamento" }) },
                { label: "Marcar como Aguardando Cliente", onClick: () => confirmStatusChange("aguardando_cliente", { comment: "Aguardando retorno do cliente" }) },
                { label: "Cancelar Ticket", danger: true, onClick: () => confirmStatusChange("cancelado", { comment: "Cancelado", tone: "danger" }) },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Coluna Principal: Foco na Tarefa (col-span-2) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Header Limpo */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket #{ticket.id}</span>
                <h1 className="mt-1 text-2xl md:text-3xl font-bold font-serif text-gray-900 leading-tight">
                  {ticket.titulo || "Ticket Sem Título"}
                </h1>
                {headerBadges}
              </div>

              {/* Bloco 1: O Problema */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle size={20} className="text-gray-400" /> Descrição
                </h2>
                <div className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-xl border border-gray-50">
                  {ticket.descricao || <span className="italic opacity-50">Nenhum detalhe informado no escopo deste ticket.</span>}
                </div>
              </div>

              {/* Bloco 2: O Trabalho (Checklist) */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-gray-400" /> O Trabalho
                  </h2>
                  <span className="text-xs font-black text-gray-500 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    {ticket.completed_subtasks_count || 0}/{ticket.subtasks_count || 0}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  {ticket.subtasks?.map(st => (
                    <div key={st.id} className="group flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        className="mt-1 flex-shrink-0 h-5 w-5 rounded-md border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer transition-all"
                        checked={st.is_completed}
                        onChange={() => toggleSubtask.mutate(st.id)}
                        disabled={toggleSubtask.isPending || deleteSubtask.isPending}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${st.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {st.title}
                        </p>
                        {st.is_completed && st.completedBy && (
                          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                            ✓ {st.completedBy.name.split(' ')[0]} em {fmtDate(st.completed_at)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm("Remover esta subtarefa?")) deleteSubtask.mutate(st.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Remover Tarefa"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {(!ticket.subtasks || ticket.subtasks.length === 0) && (
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-100 rounded-xl">
                      <p className="text-sm font-medium text-gray-400">Nenhuma subtarefa criada.</p>
                      <p className="text-xs text-gray-400 mt-1">Divida a entrega para organizar o andamento.</p>
                    </div>
                  )}
                </div>

                <form onSubmit={onAddSubtask} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar nova subtarefa..."
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold focus:bg-white focus:ring-0 focus:border-gray-300 transition-colors"
                    value={newSubtask}
                    onChange={e => setNewSubtask(e.target.value)}
                    disabled={createSubtask.isPending}
                  />
                  <button
                    type="submit"
                    disabled={!newSubtask.trim() || createSubtask.isPending}
                    className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                </form>
              </div>

              {/* Call to Action: Resolver Ticket */}
              <button
                disabled={!canSubmit}
                onClick={() => confirmStatusChange("resolvido", { comment: "O Ticket foi marcado como Resolvido" })}
                className="w-full h-16 rounded-[16px] bg-[#C00000] text-white text-lg font-black tracking-wide shadow-xl shadow-red-900/10 hover:bg-[#A30D09] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <CheckCircle2 size={24} />
                CONCLUIR TAREFA / RESOLVER
              </button>

            </div>

            {/* Coluna Lateral: Contexto e Timeline (col-span-1) */}
            <div className="lg:col-span-1 flex flex-col gap-6 h-full">

              {/* Progressive Disclosure Card 1: Contexto */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Contexto</h3>
                  <button
                    onClick={() => {
                      setStatus(ticket.status || "");
                      setPrioridade(ticket.prioridade || "");
                      setDueAt(ticket.due_at ? toDateInputValue(ticket.due_at) : "");
                      setIsPropsModalOpen(true);
                    }}
                    className="text-[10px] font-black text-blue-700 bg-blue-50/80 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors uppercase tracking-widest"
                  >
                    <Settings2 size={12} /> Editar
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold shrink-0">
                      {clienteNome.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Cliente</p>
                      <p className="text-sm font-bold text-gray-900 truncate" title={clienteNome}>{clienteNome}</p>
                      {ticket.cliente?.cpf_cnpj && <p className="text-xs text-gray-500 truncate">{ticket.cliente.cpf_cnpj}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-50/80">
                    {ticket.assignee_id ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-[#C00000]/10 flex items-center justify-center text-[#C00000] font-bold shrink-0">
                          {ticket.assignee?.name?.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Responsável</p>
                          <p className="text-sm font-bold text-gray-900 truncate">{ticket.assignee?.name}</p>
                          <p className="text-xs text-gray-500 truncate">{ticket.assignee?.email}</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                          <UserCircle size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Responsável</p>
                          <p className="text-xs font-semibold text-gray-600 mb-1">Ninguém atribuído</p>
                          <button
                            onClick={onAssume}
                            disabled={!canSubmit}
                            className="text-xs font-bold text-[#C00000] hover:underline"
                          >
                            Assumir Posição
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: Timeline em formato Chat */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col flex-1" style={{ maxHeight: 'max(600px, calc(100vh - 120px))' }}>
                <div className="p-5 border-b border-gray-50 shrink-0 flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <h3 className="text-[10px] font-black text-gray-500 tracking-widest uppercase">Atividade e Comentários</h3>
                </div>

                <div className="p-5 flex-1 overflow-y-auto space-y-6 bg-gray-50/30">
                  {ticket.logs?.map(l => (
                    <div key={l.id} className="flex gap-4">
                      <div className="mt-1 w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[11px] shrink-0 z-10 text-gray-500 font-bold">
                        {actionIcon(l.action)}
                      </div>
                      <div className="flex-1 bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-sm shadow-sm relative group">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-xs font-bold text-gray-900">{actionLabel(l.action)}</span>
                          <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">{fmtDate(l.created_at)}</span>
                        </div>
                        {l.message && <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{l.message}</p>}
                        <p className="text-[10px] font-semibold text-gray-400 mt-2 text-right">
                          {l.user?.name ? l.user.name.split(' ')[0] : "Sistema Automático"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!ticket.logs || ticket.logs.length === 0) && (
                    <div className="text-center text-sm font-medium text-gray-400 italic mt-8 border-2 border-dashed border-gray-200 p-6 rounded-2xl">
                      Nenhuma atualização inserida no histórico.
                    </div>
                  )}
                </div>

                {/* Input Textarea Fixado no Bottom */}
                <div className="p-4 border-t border-gray-50 bg-white rounded-b-2xl shrink-0">
                  <div className="relative">
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Adicionar um comentário..."
                      rows={2}
                      className="w-full text-sm resize-none bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-300 focus:ring-0 rounded-xl p-4 pr-16 placeholder-gray-400 transition-colors font-medium shadow-inner shadow-gray-200/20"
                    />
                    <button
                      onClick={onAddComment}
                      disabled={!canSubmit || !comment.trim()}
                      className="absolute bottom-3 right-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white p-2.5 rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-sm"
                      title="Enviar comentário"
                    >
                      <Send size={16} className="-ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
