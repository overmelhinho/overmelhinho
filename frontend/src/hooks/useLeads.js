import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/services/api"; // configure o axios com baseURL

export function useLeads({ search, status, page, perPage }) {
  return useQuery({
    queryKey: ['leads', { search, status, page, perPage }],
    queryFn: async () => {
      const params = {};
      if (search) params.search = search;
      if (status && status !== "Todos") params.status = status;
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
    mutationFn: (id) => axios.delete(`/v1/leads/${id}`),
    onSuccess: () => queryClient.invalidateQueries(["leads"]),
  });
}
