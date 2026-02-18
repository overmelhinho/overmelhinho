// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/PlacementsSelector.tsx
import type { PlacementType } from "@/hooks/useCampanhas";
import PlacementCard from "@/pages/campanhas/CampanhaCreate/components/ui/PlacementCard";

const PLACEMENT_LABELS: Record<PlacementType, string> = {
  SEARCH_RESULT: "PALAVRAS-CHAVE",
  SEGMENT_LISTING: "SEGMENTOS",
  HOME_TOP: "BANNER HOME",
  POPUP_GLOBAL: "POPUP",
};

export default function PlacementsSelector({
  placements,
  onToggle,
  hasGlobalPlacement,
}: {
  placements: PlacementType[];
  onToggle: (p: PlacementType, checked: boolean) => void;
  hasGlobalPlacement: boolean;
}) {
  const selectedCount = placements.length;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <label className="block text-xs font-medium text-slate-600">
            Exibição <span className="text-[#B70F0A]">*</span>
          </label>
          <div className="mt-1 text-sm text-slate-600">
            Se for <b>global</b>, cidades deixam de ser obrigatórias.
          </div>
        </div>

        <div className="text-sm font-semibold text-slate-900">
          {selectedCount ? `${selectedCount} selecionado(s)` : "Selecione ao menos 1"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <PlacementCard
          icon="🔎"
          title={PLACEMENT_LABELS.SEARCH_RESULT}
          subtitle="Busca por palavra (usa algoritmo completo)."
          checked={placements.includes("SEARCH_RESULT")}
          onToggle={(next) => onToggle("SEARCH_RESULT", next)}
        />
        <PlacementCard
          icon="🧩"
          title={PLACEMENT_LABELS.SEGMENT_LISTING}
          subtitle="Listagem por segmento + cidade."
          checked={placements.includes("SEGMENT_LISTING")}
          onToggle={(next) => onToggle("SEGMENT_LISTING", next)}
        />
        <PlacementCard
          icon="🏠"
          title={PLACEMENT_LABELS.HOME_TOP}
          subtitle="Banner no topo do site (global)."
          checked={placements.includes("HOME_TOP")}
          onToggle={(next) => onToggle("HOME_TOP", next)}
          isGlobal
        />
        <PlacementCard
          icon="💬"
          title={PLACEMENT_LABELS.POPUP_GLOBAL}
          subtitle="Popup geral do site (global)."
          checked={placements.includes("POPUP_GLOBAL")}
          onToggle={(next) => onToggle("POPUP_GLOBAL", next)}
          isGlobal
        />
      </div>

      {hasGlobalPlacement ? (
        <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <div className="font-semibold">Exibição global selecionada</div>
          <div className="mt-1 text-amber-950/80">
            Ignora cidade/segment/keyword no algoritmo (mas respeita elegibilidade, plano e rotação).
            No cadastro, cidades deixam de ser obrigatórias.
          </div>
        </div>
      ) : (
        <div className="mt-3 text-sm text-slate-600">
          Exibições não globais exigem cidades.
        </div>
      )}
    </div>
  );
}
