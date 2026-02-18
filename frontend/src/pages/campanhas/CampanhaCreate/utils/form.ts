// /var/www/frontend/src/pages/campanhas/CampanhaCreate/utils/form.ts
import type { PlanoCampanha } from "@/hooks/useCampanhas";

export function toISODate(v: string) {
  return v || "";
}

export function normalizeKeyword(s: string) {
  return (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function parseKeywords(text: string) {
  const raw = (text || "")
    .split(/[,\n;]/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const original of raw) {
    const norm = normalizeKeyword(original);
    if (!norm) continue;
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(original);
  }
  return out;
}

export function keywordLimitByPlano(plano: PlanoCampanha) {
  if (plano === "premium") return 30;
  if (plano === "intermediario") return 15;
  return 5;
}

export function normalizeClientes(resp: any) {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.rows)) return resp.rows;
  if (Array.isArray(resp?.data)) return resp.data;
  if (Array.isArray(resp?.data?.data)) return resp.data.data;
  if (Array.isArray(resp?.data?.rows)) return resp.data.rows;
  return [];
}

export function normalizeCidades(resp: any) {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.data)) return resp.data;
  if (Array.isArray(resp?.data?.data)) return resp.data.data;
  return [];
}
