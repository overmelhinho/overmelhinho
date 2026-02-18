export function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

export function fmtDateOnly(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

export function fmtMoney(v?: number | null) {
  if (v === null || v === undefined) return "—";
  try {
    return Number(v).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  } catch {
    return String(v);
  }
}

export function statusLabelPt(s?: string | null) {
  const v = String(s || "").toLowerCase();
  const map: Record<string, string> = {
    rascunho: "Rascunho",
    ativa: "Ativa",
    encerrada: "Encerrada",
    cancelada: "Cancelada",

    em_revisao: "Em revisão",
    aprovado: "Aprovado",
    reprovado: "Reprovado",
    publicado: "Publicado",
    arquivado: "Arquivado",
  };
  return map[v] ?? (s || "—");
}

export function origemLabelPt(s?: string | null) {
  const v = String(s || "").toLowerCase();
  const map: Record<string, string> = {
    venda_nova: "Venda nova",
    renovacao: "Renovação",
    upgrade: "Upgrade",
  };
  return map[v] ?? (s || "—");
}

export function badgeToneFromStatus(s?: string | null) {
  const v = String(s || "").toLowerCase();
  if (["cancelada", "reprovado"].includes(v)) return "danger";
  if (["encerrada", "aprovado", "publicado"].includes(v)) return "success";
  if (["ativa", "em_revisao"].includes(v)) return "info";
  return "neutral";
}

export function financeiroLabelPt(s?: string | null) {
  const v = String(s || "").toUpperCase();
  const map: Record<string, string> = {
    AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
    PAGO: "Pago",
    CORTESIA: "Cortesia",
    PENDENTE: "Aguardando pagamento",
  };
  return map[v] ?? (s || "—");
}

export function financeiroTone(s?: string | null) {
  const v = String(s || "").toUpperCase();
  if (v === "PAGO" || v === "CORTESIA") return "success";
  if (v === "AGUARDANDO_PAGAMENTO" || v === "PENDENTE") return "warn";
  return "neutral";
}
