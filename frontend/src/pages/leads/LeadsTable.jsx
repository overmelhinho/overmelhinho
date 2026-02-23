import { useState } from "react";
import { Pencil, Trash2, UserPlus, Loader2, Search, ArrowRight, User, MessageCircle, Send, ClipboardList } from "lucide-react";
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, useSendFollowup } from "@/hooks/useLeads";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/services/api";
import LeadModal from "./LeadModal";
import { toast } from "sonner";

// Badge visual para status
function StatusBadge({ status }) {
  const s = status?.toLowerCase();
  let style = "bg-gray-200 text-[#474747]";
  if (s === "novo") style = "bg-[#FDB913]/20 text-[#B70F0A]";
  if (s === "em_contato") style = "bg-[#474747]/10 text-[#474747]";
  if (s === "qualificado" || s === "convertido") style = "bg-[#37B24D]/20 text-[#37B24D]";
  if (s === "perdido") style = "bg-[#B70F0A]/10 text-[#B70F0A]";

  const labels = {
    novo: "Novo",
    em_contato: "Em Contato",
    qualificado: "Qualificado",
    convertido: "Convertido",
    perdido: "Perdido"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow ${style}`}>
      {labels[s] || status}
    </span>
  );
}

// Badge/avatar ao lado do nome
function NameBadge({ nome }) {
  const initial = nome?.[0]?.toUpperCase() || "";
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-8 h-8 rounded-full bg-[#B70F0A] flex items-center justify-center text-white font-bold text-base shadow">
        {initial || <User className="w-5 h-5" />}
      </span>
      {nome}
    </span>
  );
}


const formatDateBR = (isoDate) => {
  if (!isoDate) return "";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(isoDate));
};


const statusOptions = [
  { value: "Todos", label: "Todos" },
  { value: "novo", label: "Novo" },
  { value: "em_contato", label: "Em Contato" },
  { value: "qualificado", label: "Qualificado" },
  { value: "convertido", label: "Convertido" },
  { value: "perdido", label: "Perdido" },
  { value: "recuperaveis", label: "Recuperáveis (Ciclo 3 meses)" },
];

export default function LeadsTable({ user }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get("status");
    return statusParam || "Todos";
  });
  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data, isLoading } = useLeads({ search, status, page, perPage });
  const leads = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, per_page: 10 };
  const totalPages = Math.ceil(meta.total / meta.per_page);

  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const sendFollowup = useSendFollowup();

  const [open, setOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const { data: comercialUsers = [] } = useQuery({
    queryKey: ['comercialUsers'],
    queryFn: async () => {
      const { data } = await api.get('/v1/comerciais');
      return data;
    },
  });

  function handleSendFollowup(id) {
    sendFollowup.mutate(id, {
      onSuccess: () => toast.success("Follow-up enviado via sistema!"),
      onError: () => toast.error("Erro ao enviar follow-up.")
    });
  }

  const createTask = useMutation({
    mutationFn: (leadId) => api.post('/v1/tickets', {
      lead_id: leadId,
      titulo: `Tarefa Manual: Lead #${leadId}`,
      setor: 'comercial',
      descricao: 'Tarefa criada manualmente para acompanhamento deste lead.',
      prioridade: 'media',
      tipo: 'tarefa'
    }),
    onSuccess: () => toast.success("Tarefa (Ticket) criada com sucesso!"),
    onError: () => toast.error("Erro ao criar tarefa.")
  });

  function handleNew() {
    setEditingLead(null);
    setOpen(true);
  }

  function handleEdit(lead) {
    setEditingLead(lead);
    setOpen(true);
  }

  function handleSubmit(lead) {
    const action = editingLead ? updateLead : createLead;
    action.mutate(
      editingLead ? { ...editingLead, ...lead } : lead,
      {
        onSuccess: () => {
          setOpen(false);
          toast.success("Lead salvo com sucesso!");
        },
        onError: () => toast.error("Erro ao salvar lead."),
      }
    );
  }

  function handleDelete(lead) {
    if (window.confirm("Deseja remover este lead?")) {
      deleteLead.mutate(lead.id, {
        onSuccess: () => toast.success("Lead removido."),
        onError: () => toast.error("Erro ao remover."),
      });
    }
  }

  function handleConvert(lead) {
    if (window.confirm("Converter este lead em oportunidade?")) {
      toast.success("Lead convertido em oportunidade! (mock)");
    }
  }

  const canCreate = user?.permissions?.includes("create leads");
  const canEdit = user?.permissions?.includes("edit leads");
  const canDelete = user?.permissions?.includes("delete leads");

  return (
    <>
      <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <div className="flex gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar nome, e-mail ou origem..."
                className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-primary/30 transition text-sm"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            <select
              className="py-2 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm shadow-sm"
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {canCreate && (
            <button
              onClick={handleNew}
              className="flex items-center bg-[#B70F0A] text-white px-4 py-2 rounded-xl font-semibold shadow hover:bg-[#990c08] transition"
            >
              <UserPlus className="mr-2 w-5 h-5" />
              Novo Lead
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <Loader2 className="animate-spin m-auto w-12 h-12" />
          ) : (
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-[#F2F2F2] text-[#232323]">
                  <th className="px-4 py-2 text-left font-semibold">Nome</th>
                  <th className="px-4 py-2 text-left">E-mail</th>
                  <th className="px-4 py-2 text-left">Telefone</th>
                  <th className="px-4 py-2 text-left">Origem</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Responsável</th>
                  <th className="px-4 py-2 text-left">Cadastrado em</th>
                  <th className="px-4 py-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-[#E0E0E0] hover:bg-[#FAFAFA]">
                    <td className="px-4 py-2 font-medium">
                      <NameBadge nome={lead.nome} />
                    </td>
                    <td className="px-4 py-2">{lead.email}</td>
                    <td className="px-4 py-2">{lead.telefone}</td>
                    <td className="px-4 py-2">{lead.origem}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-2">{lead.responsavel}</td>
                    <td className="px-4 py-2">{formatDateBR(lead.created_at)}</td>
                    <td className="px-4 py-2 flex gap-2 justify-center">
                      {[
                        "novo",
                        "em_contato"
                      ].includes(lead.status?.toLowerCase()) && (
                          <button
                            onClick={() => handleConvert(lead)}
                            className="p-1 rounded hover:bg-[#FAFAFA]"
                            title="Converter em Oportunidade"
                          >
                            <ArrowRight className="w-5 h-5 text-[#FDB913]" />
                          </button>
                        )}
                      {lead.status?.toLowerCase() === "perdido" && lead.telefone && (
                        <div className="flex gap-1">
                          <a
                            href={`https://api.whatsapp.com/send?phone=${lead.telefone.replace(/\D/g, '')}&text=${encodeURIComponent(`Olá ${lead.nome}, tudo bem? Aqui é do O Vermelhinho. Estivemos pensando em você e queríamos saber se mudou de ideia sobre a nossa proposta. Como podemos te ajudar hoje?`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded flex items-center justify-center hover:bg-green-50"
                            title="WhatsApp Web (Manual)"
                          >
                            <MessageCircle className="w-5 h-5 text-green-600" />
                          </a>
                          <button
                            onClick={() => handleSendFollowup(lead.id)}
                            className="p-1 rounded flex items-center justify-center hover:bg-blue-50"
                            disabled={sendFollowup.isLoading}
                            title="Disparar API WhatsApp (Sistema)"
                          >
                            {sendFollowup.isLoading ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <Send className="w-5 h-5 text-blue-600" />}
                          </button>
                          <button
                            onClick={() => createTask.mutate(lead.id)}
                            className="p-1 rounded flex items-center justify-center hover:bg-purple-50"
                            disabled={createTask.isLoading}
                            title="Agendar Tarefa (Ticket)"
                          >
                            {createTask.isLoading ? <Loader2 className="w-5 h-5 animate-spin text-purple-600" /> : <ClipboardList className="w-5 h-5 text-purple-600" />}
                          </button>
                        </div>
                      )}
                      {canEdit && (
                        <button onClick={() => handleEdit(lead)} className="p-1 rounded hover:bg-[#F2F2F2]" title="Editar">
                          <Pencil className="w-5 h-5 text-[#B70F0A]" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(lead)} className="p-1 rounded hover:bg-[#FAFAFA]" title="Deletar">
                          <Trash2 className="w-5 h-5 text-[#B70F0A]" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      Nenhum lead encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center gap-1 mt-6">
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                className={`w-8 h-8 rounded-xl font-bold text-sm border transition ${page === idx + 1
                  ? "bg-[#B70F0A] text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                onClick={() => setPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      <LeadModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        initialValues={editingLead}
        user={user}
        comercialUsers={comercialUsers}
      />
    </>
  );
}
