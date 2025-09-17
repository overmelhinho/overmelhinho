import { useQuery } from "@tanstack/react-query";
import axios from "@/services/api";

// KPIs: total de leads, oportunidades, usuários, funções, permissões, conversão
export function useDashboardKpis({ start, end }: { start: string; end: string }) {
  return useQuery({
    queryKey: ["dashboard-kpis", start, end],
    queryFn: async () => {
      const { data } = await axios.get("/v1/dashboard/kpis", {
        params: { start, end }
      });
      return data;
    },
    keepPreviousData: true,
  });
}

// KPIs do Comercial
export function useDashboardComercialKpis({ start, end }: { start: string; end: string }) {
  return useQuery({
    queryKey: ["dashboard-kpis-comercial", start, end],
    queryFn: async () => {
      const { data } = await axios.get("/v1/dashboard/comercial/kpis", {
        params: { start, end }
      });
      return data;
    },
    keepPreviousData: true,
  });
}

// KPIs da Diretoria (exemplo, ajuste se necessário)
export function useDashboardDiretoriaKpis({ start, end }: { start: string; end: string }) {
  return useQuery({
    queryKey: ["dashboard-kpis-diretoria", start, end],
    queryFn: async () => {
      const { data } = await axios.get("/v1/dashboard/diretoria/kpis", {
        params: { start, end }
      });
      return data;
    },
    keepPreviousData: true,
  });
}

// Movimentações recentes
export function useDashboardRecent({ start, end }: { start: string; end: string }) {
  return useQuery({
    queryKey: ["dashboard-recent", start, end],
    queryFn: async () => {
      const { data } = await axios.get("/v1/dashboard/recent", {
        params: { start, end }
      });
      return data;
    },
    keepPreviousData: true,
  });
}


export function useTaskList({ start, end }: { start: string; end: string }) {
  return useQuery({
    queryKey: ["dashboard-tasks", start, end],
    queryFn: async () => {
      const { data } = await axios.get("/v1/dashboard/tasks", { params: { start, end } });
      return data; // Exemplo: [{ titulo: 'Ligar para cliente XPTO', prazo: '2025-07-11', done: false }, ...]
    },
    keepPreviousData: true,
  });
}



// Linha do tempo de eventos
export function useTimelineEventos({ start, end }: { start: string; end: string }) {
  return useQuery({
    queryKey: ["dashboard-timeline", start, end],
    queryFn: async () => {
      const { data } = await axios.get("/v1/dashboard/timeline", {
        params: { start, end }
      });
      return data;
    },
    keepPreviousData: true,
  });
}
