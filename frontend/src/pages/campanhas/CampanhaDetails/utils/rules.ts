import { GLOBAL_PLACEMENTS } from "@/hooks/useCampanhas";

export function isGlobalByPlacements(placements: any): boolean {
  if (!Array.isArray(placements)) return false;
  return placements.some((p) => GLOBAL_PLACEMENTS.includes(String(p) as any));
}
