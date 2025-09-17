import { useState, useMemo } from "react";
import { Pencil, Trash2, UserPlus, Loader2, Search } from "lucide-react";
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from "@/hooks/useLeads";
import LeadModal from "./LeadModal";
import { toast } from "sonner";

const statusOptions = ["Todos", "Novo", "Em Contato", "Convertido", "Perdido"];

export default function LeadsTable({ user }) {
  const { data: leads = [], isLoading } = useLeads();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const [open, setOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [page, setPage] = useState(1);
  const perPage = 10;

  // === Filtro/Busca ===
  const filteredLeads = useMemo(() => {
    let filtered = leads;
    if (status !== "Todos") {
      filtered = filtered.filter(l => l.status === status);
    }
    if (search.trim()) {
      filtered = filtered.filter(
        l =>
          l.nome.toLowerCase().includes(search.toLowerCase()) ||
          l.email.toLowerCase().includes(search.toLowerCase()) ||
          l.origem.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  }, [leads, search, status]);

  // === Paginação ===
  const totalPages = Math.ceil(filteredLeads.length / perPage);
  const paginatedLeads = filteredLeads.slice((page - 1) * perPage, page * perPage);

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

  if (isLoading) return <Loader2 className="animate-spin m-auto w-12 h-12" />;

  // === Controle de Permissão ===
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
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          {canCreate && (
            <button
              onClick={handleNew}
              className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold shadow hover:bg-[#990c08] transition"
            >
              <UserPlus className="mr-2 w-5 h-5" />
              Novo Lead
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-muted text-[#232323]">
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
              {paginatedLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-muted-line hover:bg-muted/60">
                  <td className="px-4 py-2 font-medium">{lead.nome}</td>
                  <td className="px-4 py-2">{lead.email}</td>
                  <td className="px-4 py-2">{lead.telefone}</td>
                  <td className="px-4 py-2">{lead.origem}</td>
                  <td className="px-4 py-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground shadow">
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{lead.responsavel}</td>
                  <td className="px-4 py-2">{lead.created_at}</td>
                  <td className="px-4 py-2 flex gap-2 justify-center">
                    {canEdit && (
                      <button onClick={() => handleEdit(lead)} className="p-1 rounded hover:bg-muted" title="Editar">
                        <Pencil className="w-5 h-5 text-primary" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(lead)} className="p-1 rounded hover:bg-muted" title="Deletar">
                        <Trash2 className="w-5 h-5 text-destructive" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {paginatedLeads.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    Nenhum lead encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1 mt-6">
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                className={`w-8 h-8 rounded-xl font-bold text-sm border transition ${
                  page === idx + 1
                    ? "bg-primary text-primary-foreground"
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
      />
    </>
  );
}
