// /var/www/frontend/src/pages/campanhas/CampanhaCreate/steps/Step2Alcance.tsx
import StepCard from "@/pages/campanhas/CampanhaCreate/components/StepCard";
import PeriodoSelector from "@/pages/campanhas/CampanhaCreate/components/PeriodoSelector";
import PlacementsSelector from "@/pages/campanhas/CampanhaCreate/components/PlacementsSelector";
import CidadesSelector from "@/pages/campanhas/CampanhaCreate/components/CidadesSelector";
import type { PlacementType } from "@/hooks/useCampanhas";

export default function Step2Alcance({
  data_inicio,
  data_fim,
  placements,
  hasGlobalPlacement,
  cidades,
  filteredCidades,
  loadingCidades,
  selectedCidadeIds,
  cidadeSearch,
  setCidadeSearch,

  onChangeInicio,
  onChangeFim,
  onTogglePlacement,
  onToggleCidade,
  onClearCidades,
}: {
  data_inicio: string;
  data_fim: string;
  placements: PlacementType[];
  hasGlobalPlacement: boolean;

  cidades: any[];
  filteredCidades: any[];
  loadingCidades: boolean;
  selectedCidadeIds: number[];
  cidadeSearch: string;
  setCidadeSearch: (v: string) => void;

  onChangeInicio: (v: string) => void;
  onChangeFim: (v: string) => void;
  onTogglePlacement: (p: PlacementType, checked: boolean) => void;
  onToggleCidade: (id: number, checked: boolean) => void;
  onClearCidades: () => void;
}) {
  return (
    <StepCard
      step={2}
      title="Período e alcance"
      description="Definem onde a campanha aparece. Se for global, cidades deixam de ser obrigatórias."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="md:col-span-12">
          <PeriodoSelector
            data_inicio={data_inicio}
            data_fim={data_fim}
            onChangeInicio={onChangeInicio}
            onChangeFim={onChangeFim}
          />
        </div>

        <div className="md:col-span-12">
          <PlacementsSelector
            placements={placements}
            onToggle={onTogglePlacement}
            hasGlobalPlacement={hasGlobalPlacement}
          />
        </div>

        <div className="md:col-span-12">
          <CidadesSelector
            hasGlobalPlacement={hasGlobalPlacement}
            loading={loadingCidades}
            cidades={cidades as any}
            filteredCidades={filteredCidades as any}
            selectedIds={selectedCidadeIds}
            search={cidadeSearch}
            setSearch={setCidadeSearch}
            onToggleCidade={onToggleCidade}
            onClear={onClearCidades}
          />
        </div>
      </div>
    </StepCard>
  );
}
