import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/services/api"; // configure o axios com baseURL


export function useLeads({ search, status, page, perPage, origem, responsavel }) {
  return useQuery({
    queryKey: ['leads', { search, status, page, perPage, origem, responsavel }],
    queryFn: async () => {
      const params = {};
      if (search) params.search = search;
      if (status && status !== "Todos") params.status = status;
      if (origem) params.origem = origem;
      if (responsavel) params.responsavel = responsavel;
      params.page = page;
      params.per_page = perPage;

      const { data } = await axios.get("/v1/leads", { params });
      return data;
    },
    keepPreviousData: true,
  });
}


export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lead) => axios.post("/v1/leads", lead),
    onSuccess: () => queryClient.invalidateQueries(["leads"]),
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lead) => axios.put(`/v1/leads/${lead.id}`, lead),
    onSuccess: () => queryClient.invalidateQueries(["leads"]),
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => {
      console.log("useDeleteLead mutationFn called with id:", id);
      return axios.delete(`/v1/leads/${id}`);
    },
    onSuccess: () => {
      console.log("useDeleteLead onSuccess invalidating queries");
      queryClient.invalidateQueries(["leads"]);
    },
    onError: (err) => {
      console.error("useDeleteLead onError:", err);
    }
  });
}

// ✅ Novo hook para mover lead entre colunas do Kanban
export function useMoveLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => axios.patch(`/v1/leads/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries(["leads"]),
  });
}

export function useSendFollowup() {
  return useMutation({
    mutationFn: (id) => axios.post(`/v1/leads/${id}/send-followup`),
  });
}
