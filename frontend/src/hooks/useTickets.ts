import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export type TicketStatus =
  | "aberto"
  | "assigned"
  | "em_andamento"
  | "aguardando_cliente"
  | "aguardando_interno"
  | "resolvido"
  | "concluido"
  | "fechado"
  | "closed"
  | "cancelado"
  | "canceled";

export type TicketPrioridade = "baixa" | "media" | "alta" | "urgente";

export type TicketLog = {
  id: number;
  ticket_id: number;
  user_id: number | null;
  action: string;
  message: string | null;
  created_at: string;
  updated_at?: string;
  user?: { id: number; name: string; email?: string | null } | null;
};

export type Ticket = {
  id: number;
  cliente_id: number | null;
  created_by: number | null;

  assignee_id?: number | null;

  setor: string;
  tipo?: string | null;

  status: TicketStatus;
  titulo: string;
  descricao?: string | null;
  prioridade: TicketPrioridade;

  due_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;

  meta?: any;
  sla_status?: "normal" | "warning" | "overdue" | "completed";

  created_at?: string | null;
  updated_at?: string | null;

  cliente?: {
    id: number;
    nome_fantasia?: string | null;
    razao_social?: string | null;
    cpf_cnpj?: string | null;
    logo_url?: string | null;
  };

  createdBy?: { id: number; name: string; email?: string | null } | null;
  assignee?: { id: number; name: string; email?: string | null } | null;

  logs?: TicketLog[];
  subtasks?: TicketSubtask[];
  subtasks_count?: number;
  completed_subtasks_count?: number;
};

export type TicketSubtask = {
  id: number;
  ticket_id: number;
  title: string;
  is_completed: boolean;
  completed_at?: string | null;
  completed_by?: number | null;
  completedBy?: { id: number; name: string } | null;
  created_at: string;
};

export type Paginated<T> = {
  current_page: number;
  data: T[];
  from: number | null;
  to: number | null;
  last_page: number;
  per_page: number;
  total: number;
};

export type TicketsQueryParams = {
  cliente_id?: number | string;
  setor?: string;
  status?: string;
  prioridade?: string;
  tipo?: string;
  assignee_id?: number | string;

  my?: boolean; // my=1
  open?: boolean; // open=1
  overdue?: boolean; // overdue=1

  page?: number;
  per_page?: number;
};

function buildParams(params?: TicketsQueryParams) {
  const p: Record<string, any> = {};
  if (!params) return p;

  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    p[k] = v;
  }

  if (typeof params.my === "boolean") p.my = params.my ? 1 : 0;
  if (typeof params.open === "boolean") p.open = params.open ? 1 : 0;
  if (typeof params.overdue === "boolean") p.overdue = params.overdue ? 1 : 0;

  return p;
}

export function useTickets(params: TicketsQueryParams) {
  return useQuery({
    queryKey: ["tickets", params],
    queryFn: async () => {
      const { data } = await api.get("/v1/tickets", { params: buildParams(params) });
      return data.data as Paginated<Ticket>;
    },
  });
}

export function useTicket(id?: number | string) {
  return useQuery({
    queryKey: ["ticket", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get(`/v1/tickets/${id}`);
      return data.data as Ticket;
    },
  });
}

export type CreateTicketInput = {
  cliente_id: number;
  setor: string;
  titulo: string;
  descricao?: string | null;
  prioridade?: TicketPrioridade;

  tipo?: string | null;
  assignee_id?: number | null;
  due_at?: string | null;
  meta?: any;
};

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTicketInput) => {
      const { data } = await api.post("/v1/tickets", payload);
      return data.data as Ticket;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export type UpdateTicketInput = Partial<{
  status: TicketStatus;
  titulo: string;
  descricao: string | null;
  prioridade: TicketPrioridade;

  tipo: string | null;
  assignee_id: number | null;
  due_at: string | null;
  meta: any;

  comment: string;
}>;

export function useUpdateTicket(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateTicketInput) => {
      const { data } = await api.patch(`/v1/tickets/${id}`, payload);
      return data.data as Ticket;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tickets"] });
      await qc.invalidateQueries({ queryKey: ["ticket", id] });
    },
  });
}

// ✅ NOVO: lista de usuários elegíveis para delegar por setor
export type AssigneeOption = { id: number; name: string; email?: string | null };

export function useTicketAssignees(setor?: string) {
  return useQuery({
    queryKey: ["ticketAssignees", setor],
    enabled: !!setor,
    queryFn: async () => {
      const { data } = await api.get("/v1/tickets/assignees", { params: { setor } });
      return data.data as AssigneeOption[];
    },
    staleTime: 1000 * 60 * 2,
  });
}

// ✅ NOVO: Hooks de subtarefas
export type CreateSubtaskInput = { title: string };

export function useCreateSubtask(ticketId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSubtaskInput) => {
      const { data } = await api.post(`/v1/tickets/${ticketId}/subtasks`, payload);
      return data.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
      await qc.invalidateQueries({ queryKey: ["tickets"] });
    }
  });
}

export function useToggleSubtask(ticketId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (subtaskId: number) => {
      const { data } = await api.patch(`/v1/tickets/${ticketId}/subtasks/${subtaskId}/toggle`);
      return data.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
      await qc.invalidateQueries({ queryKey: ["tickets"] });
    }
  });
}

export function useDeleteSubtask(ticketId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (subtaskId: number) => {
      const { data } = await api.delete(`/v1/tickets/${ticketId}/subtasks/${subtaskId}`);
      return data.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
      await qc.invalidateQueries({ queryKey: ["tickets"] });
    }
  });
}
